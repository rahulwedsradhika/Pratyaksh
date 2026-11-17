import 'dotenv/config';import fs from 'node:fs';
import {getMysqlPool,closeMysqlPool} from '../../server/db_mysql.js';
try{
 const pool=getMysqlPool(),tables=JSON.parse(fs.readFileSync(new URL('../../database/import/source-schema.json',import.meta.url),'utf8'));
 for(const table of tables)await pool.query('SELECT 1 FROM `'+table.name+'` LIMIT 1');
 const [migrations]=await pool.query('SELECT version FROM schema_migrations WHERE applied_at IS NOT NULL');
 for(const name of fs.readdirSync(new URL('../../database/migrations/mysql/',import.meta.url)).filter(n=>n.endsWith('.sql')))if(!migrations.some(m=>m.version===name))throw Error('Missing migration: '+name);
 console.log('Database reachable; required tables and migration versions present. This does not certify production readiness; see docs/14_DEPLOYMENT_READINESS.md.');
}catch(error){console.error('Database verification failed:',error.code||error.message);process.exitCode=1;}finally{await closeMysqlPool();}
