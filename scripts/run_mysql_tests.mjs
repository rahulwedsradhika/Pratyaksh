import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['--test','tests/mysql_integration.test.mjs','tests/mysql_auth_recovery.test.mjs'],{stdio:'inherit',env:{...process.env,RUN_MYSQL_TESTS:'true'}});process.exitCode=result.status??1;
