import 'dotenv/config';
import { DatabaseSync, backup } from 'node:sqlite';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {getMysqlPool,closeMysqlPool} from '../../server/db_mysql.js';
const q=n=>'`'+n.replaceAll('`','``')+'`';
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const normalize=v=>typeof v==='bigint'?Number(v):v;
const values=(row,columns)=>columns.map(c=>normalize(row[c]??null));
export async function importSqlite({source,snapshotDirectory='.local-tools/import-snapshots',pool=getMysqlPool(),targetName=process.env.DB_NAME||process.env.DB_DATABASE,productionApproved=false}={}) {
  if(!source||!fs.existsSync(source))throw Error('An existing source SQLite file is required.');
  if([process.env.APP_ENV,process.env.NODE_ENV].includes('production')&&!productionApproved)throw Error('Production import requires an explicit --allow-production-import flag and a backup checkpoint.');
  const connection=await pool.getConnection();let snapshot;
  try{
    const [[identity]]=await connection.query('SELECT DATABASE() AS db');
    if(!targetName||identity.db!==targetName)throw Error('Target database identity did not match the explicit configuration.');
    const [[lock]]=await connection.query("SELECT GET_LOCK('ayurvedasidhi_data_import',10) AS acquired");if(!lock.acquired)throw Error('Another import is running.');
    fs.mkdirSync(snapshotDirectory,{recursive:true});
    const snapshotPath=path.resolve(snapshotDirectory,crypto.randomUUID()+'.sqlite');
    const original=new DatabaseSync(path.resolve(source),{readOnly:true});
    try{await backup(original,snapshotPath);}finally{original.close();}
    snapshot=new DatabaseSync(snapshotPath,{readOnly:true});
    if([process.env.APP_ENV,process.env.NODE_ENV].includes('production')){
      const active=snapshot.prepare("SELECT o.metadata FROM memberships m JOIN payment_orders o ON o.id=m.order_ref WHERE m.status='active' AND o.provider='razorpay'").all();
      if(active.some(row=>JSON.parse(row.metadata||'{}').gatewayMode!=='live'))throw Error('Active sandbox memberships cannot be imported into production.');
    }
    if(snapshot.prepare('PRAGMA foreign_key_check').all().length)throw Error('The source has foreign key violations; repair before import.');
    const tables=snapshot.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(t=>t.name);
    const schemas=new Map(tables.map(name=>[name,{columns:snapshot.prepare(`PRAGMA table_info(${q(name)})`).all(),fks:snapshot.prepare(`PRAGMA foreign_key_list(${q(name)})`).all()}]));
    const [targetRelations]=await connection.query('SELECT TABLE_NAME AS child,REFERENCED_TABLE_NAME AS parent FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL');
    for(const relation of targetRelations)if(schemas.has(relation.child)&&schemas.has(relation.parent))schemas.get(relation.child).fks.push({table:relation.parent});
    const order=[],visiting=new Set();
    function visit(name){if(order.includes(name))return;if(visiting.has(name))throw Error('Cyclic foreign keys need a staged import.');visiting.add(name);for(const fk of schemas.get(name).fks)visit(fk.table);visiting.delete(name);order.push(name);}
    tables.forEach(visit);
    await connection.query('CREATE TABLE IF NOT EXISTS data_import_progress (source_hash CHAR(64),table_name VARCHAR(191),imported_count BIGINT NOT NULL,completed_at VARCHAR(32),PRIMARY KEY(source_hash,table_name)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(snapshotPath)).digest('hex');
    const report={sourceHash,tables:[],foreignKeyViolations:0,completedAt:null};
    for(const name of order){
      const meta=schemas.get(name),columns=meta.columns.map(c=>c.name),keys=meta.columns.filter(c=>c.pk).sort((a,b)=>a.pk-b.pk).map(c=>c.name);
      if(!keys.length)throw Error('Every imported table needs a stable primary key: '+name);
      const rows=snapshot.prepare(`SELECT * FROM ${q(name)} ORDER BY ${keys.map(q).join(',')}`).all();
      let inserted=0,identical=0;
      for(let offset=0;offset<rows.length;offset+=100){
        const batch=rows.slice(offset,offset+100);
        await connection.beginTransaction();
        try{
          const where=batch.map(()=>`(${keys.map(k=>q(k)+' <=> ?').join(' AND ')})`).join(' OR ');
          const [existing]=await connection.execute(`SELECT ${columns.map(q).join(',')} FROM ${q(name)} WHERE ${where}`,batch.flatMap(row=>values(row,keys)));
          const byKey=new Map(existing.map(row=>[hash(values(row,keys)),row]));
          for(const row of batch){
            const found=byKey.get(hash(values(row,keys)));
            if(found){if(hash(values(row,columns))!==hash(values(found,columns)))throw Error('Existing target record differs; refusing to overwrite table '+name);identical++;continue;}
            await connection.execute(`INSERT INTO ${q(name)} (${columns.map(q).join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,values(row,columns));inserted++;
          }
          await connection.execute('INSERT INTO data_import_progress(source_hash,table_name,imported_count) VALUES (?,?,?) ON DUPLICATE KEY UPDATE imported_count=VALUES(imported_count)',[sourceHash,name,offset+batch.length]);
          await connection.commit();
        }catch(error){await connection.rollback();throw error;}
      }
      const [[total]]=await connection.query(`SELECT COUNT(*) AS n FROM ${q(name)}`);
      await connection.execute('INSERT INTO data_import_progress(source_hash,table_name,imported_count,completed_at) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE imported_count=VALUES(imported_count),completed_at=VALUES(completed_at)',[sourceHash,name,rows.length,new Date().toISOString()]);
      report.tables.push({name,source:rows.length,inserted,identical,target:Number(total.n),missing:0,extra:Number(total.n)-rows.length});
    }
    report.completedAt=new Date().toISOString();return report;
  }finally{snapshot?.close();await connection.query("SELECT RELEASE_LOCK('ayurvedasidhi_data_import')").catch(()=>{});connection.release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{if(!process.argv.includes('--source'))throw Error('Use --source <private SQLite path>.');const source=process.argv[process.argv.indexOf('--source')+1];const report=await importSqlite({source,productionApproved:process.argv.includes('--allow-production-import')});fs.mkdirSync('database/import-output',{recursive:true});fs.writeFileSync('database/import-output/latest-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({tables:report.tables.length,sourceRecords:report.tables.reduce((n,t)=>n+t.source,0),inserted:report.tables.reduce((n,t)=>n+t.inserted,0),missing:0}));}catch(error){console.error('Import failed:',error.code||error.message);process.exitCode=1;}finally{await closeMysqlPool();}
}
