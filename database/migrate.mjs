import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getMysqlPool, closeMysqlPool } from '../server/db_mysql.js';

export async function migrate(pool=getMysqlPool()) {
  const connection=await pool.getConnection();
  try {
    const [[lock]]=await connection.query("SELECT GET_LOCK('ayurvedasidhi_schema',10) AS acquired");
    if(!lock.acquired)throw Error('Another database migration is running.');
    await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(191) PRIMARY KEY, checksum CHAR(64) NOT NULL, completed_statements INT NOT NULL DEFAULT 0, applied_at VARCHAR(32)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    const dir=fileURLToPath(new URL('./migrations/mysql/',import.meta.url));
    const result=[];
    for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.sql')).sort()){
      const sql=fs.readFileSync(path.join(dir,name),'utf8');
      if(/\b(DROP\s+(DATABASE|TABLE)|TRUNCATE|DELETE\s+FROM)\b/i.test(sql))throw Error('Destructive migration blocked: '+name);
      const checksum=crypto.createHash('sha256').update(sql).digest('hex');
      const [[current]]=await connection.execute('SELECT * FROM schema_migrations WHERE version=?',[name]);
      if(current&&current.checksum!==checksum)throw Error('Applied migration checksum changed: '+name);
      if(current?.applied_at){result.push({version:name,status:'already applied'});continue;}
      if(!current)await connection.execute('INSERT INTO schema_migrations(version,checksum) VALUES (?,?)',[name,checksum]);
      const statements=sql.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean);
      for(let i=current?.completed_statements||0;i<statements.length;i++){
        try{await connection.query(statements[i]);}catch(error){
          // DDL autocommits. A crash between an ADD CONSTRAINT and its checkpoint
          // is recoverable only if the expected constraint really exists.
          const match=/ADD CONSTRAINT `([^`]+)`/.exec(statements[i]);
          if(!match)throw error;
          const [[present]]=await connection.execute('SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME=?',[match[1]]);
          if(!present)throw error;
        }
        await connection.execute('UPDATE schema_migrations SET completed_statements=? WHERE version=?',[i+1,name]);
      }
      await connection.execute('UPDATE schema_migrations SET applied_at=? WHERE version=?',[new Date().toISOString(),name]);
      result.push({version:name,status:'applied'});
    }return result;
  }finally{await connection.query("SELECT RELEASE_LOCK('ayurvedasidhi_schema')").catch(()=>{});connection.release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(await migrate()));}catch(error){console.error('Migration failed:',error.code||error.message);process.exitCode=1;}finally{await closeMysqlPool();}
}
