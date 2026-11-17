import {spawnSync} from 'node:child_process';
// Builds never connect to a database, run migrations, import data, or seed accounts.
const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{stdio:'inherit',env:process.env});
process.exitCode=result.status??1;
