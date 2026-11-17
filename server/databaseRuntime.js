import 'dotenv/config';
import './productionConfiguration.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getMysqlPool } from './db_mysql.js';
export const mysqlEnabled = process.env.DB_CONNECTION === 'mysql';
const scopes = new AsyncLocalStorage();
export function databaseScope(req, res, next) {
  const state={connection:null};
  scopes.run(state, () => {
    res.once('close', () => { if(state.connection){const c=state.connection;state.connection=null;c.rollback().finally(()=>c.release()).catch(()=>{});} });
    next();
  });
}
export function translateSql(sql) {
  return sql.replace(/\bINSERT OR IGNORE\b/gi,'INSERT')
    .replace(/ON CONFLICT\s*\([^)]*\)\s*DO UPDATE SET/gi,'ON DUPLICATE KEY UPDATE')
    .replace(/excluded\.([a-z_]+)/gi,'VALUES($1)')
    .replace(/julianday\(([^)]+)\)/gi,"STR_TO_DATE(REPLACE(REPLACE($1,'T',' '),'Z',''),'%Y-%m-%d %H:%i:%s.%f')");
}
export function createMysqlDatabase() {
  const pool=getMysqlPool();
  async function query(sql,params=[]) {
    const pragma=/^PRAGMA table_info\(["']?(\w+)["']?\)$/i.exec(sql.trim());
    if(pragma){const [rows]=await pool.execute('SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',[pragma[1]]);return rows;}
    const executor=scopes.getStore()?.connection||pool;
    const [rows]=await executor.execute(translateSql(sql),params.map(v=>v===undefined?null:v));return rows;
  }
  const db={engine:'mysql',
    prepare(sql){return {
      async all(...params){return query(sql,params);},
      async get(...params){return (await query(sql,params))[0];},
      async run(...params){try{const result=await query(sql,params);return {changes:result.affectedRows,lastInsertRowid:result.insertId};}catch(error){if(/INSERT OR IGNORE/i.test(sql)&&error.code==='ER_DUP_ENTRY')return {changes:0};throw error;}}
    };},
    async exec(sql){
      const state=scopes.getStore();
      if(/^BEGIN(?: IMMEDIATE)?$/i.test(sql.trim())){
        if(!state)throw Error('Transactions require a database scope.');
        if(state.connection)throw Error('Nested transactions are not supported.');
        const c=await pool.getConnection();state.connection=c;
        try {await c.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');await c.beginTransaction();}catch(error){state.connection=null;c.release();throw error;}return;
      }
      if(/^(COMMIT|ROLLBACK)$/i.test(sql.trim())){
        if(!state?.connection)throw Error('No transaction is active.');const c=state.connection;
        try{await c.query(sql);}finally{state.connection=null;c.release();}return;
      }
      // Schema creation belongs to the explicit migration command, never startup.
      if(/^\s*CREATE\s/i.test(sql)){
        for(const match of sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)/gi)){
          const [rows]=await pool.execute('SELECT 1 AS ok FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',[match[1]]);
          if(!rows.length)throw Error('Database migrations are required before starting the application.');
        }return;
      }
      throw Error('Runtime schema changes are disabled. Run the explicit migration command.');
    },
    async withTransaction(fn){
      if(scopes.getStore()?.connection)return fn();
      const work=async()=>{await db.exec('BEGIN');try{const result=await fn();await db.exec('COMMIT');return result;}catch(error){await db.exec('ROLLBACK');throw error;}};
      return scopes.getStore()?work():scopes.run({connection:null},work);
    }
  };return db;
}
