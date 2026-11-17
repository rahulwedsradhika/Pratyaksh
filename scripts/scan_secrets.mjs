import fs from 'node:fs';import {spawnSync} from 'node:child_process';import dotenv from 'dotenv';
const git=(args)=>{const r=spawnSync('git',args,{encoding:'utf8',maxBuffer:150*1024*1024});if(r.status!==0)throw Error('Git scan could not read repository objects.');return r.stdout;};
const env=fs.existsSync('.env')?dotenv.parse(fs.readFileSync('.env')):{};
const secrets=Object.entries(env).filter(([key,value])=>/SECRET|PASSWORD|TOKEN|ENCRYPTION_KEY|SERVICE_ROLE/.test(key)&&value.length>=12).map(([key,value])=>({key,value}));
const findings=[],seen=new Set();let blobs=0;
const objects=git(['rev-list','--objects','--all']).trim().split('\n').map(line=>{const [id,...rest]=line.split(' ');return {id,file:rest.join(' ')};}).filter(o=>o.file&&/\.(?:js|jsx|mjs|cjs|json|sql|env|txt|md|yml|yaml|toml|csv)$|(?:^|\/)\.env(?:\.|$)|\.sqlite(?:$|-)/i.test(o.file));
const batch=spawnSync('git',['cat-file','--batch'],{input:objects.map(o=>o.id).join('\n')+'\n',maxBuffer:700*1024*1024});
if(batch.status!==0)throw Error('Historical batch scan could not complete.');
let cursor=0;
for(const entry of objects){
  const end=batch.stdout.indexOf(10,cursor),header=batch.stdout.subarray(cursor,end).toString('utf8').split(' '),size=Number(header[2]);cursor=end+1;
  if(!Number.isFinite(size))throw Error('Unexpected git object stream.');
  const raw=batch.stdout.subarray(cursor,cursor+size);cursor+=size+1;
  const line=entry.id+' '+entry.file;
  const [object,...rest]=line.split(' '),file=rest.join(' ');if(!file||seen.has(object))continue;seen.add(object);
  if(!/\.(?:js|jsx|mjs|cjs|json|sql|env|txt|md|yml|yaml|toml|csv)$|(?:^|\/)\.env(?:\.|$)|\.sqlite(?:$|-)/i.test(file))continue;
  if(header[1]!=='blob')continue;blobs++;
  const contents=raw.toString('utf8');
  const matched=secrets.filter(s=>contents.includes(s.value)).map(s=>s.key);
  if(matched.length)findings.push({object,file,secretNames:matched});
  if(!file.endsWith('.example') && /(?:^|\/)\.env(?:\.|$)|\.sqlite(?:$|-)|seed_data\.sql$|credential.*\.csv$/i.test(file))findings.push({object,file,reason:'Private configuration/database/export is present in history; inspect and rotate privately.'});
}
const tracked=git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean);
const current=[];
for(const file of tracked){if(!fs.existsSync(file)||fs.statSync(file).size>100*1024*1024)continue;const body=fs.readFileSync(file,'utf8');const names=secrets.filter(s=>body.includes(s.value)).map(s=>s.key);if(names.length)current.push({file,secretNames:names});}
const report={scannedHistoricalBlobs:blobs,historyFindings:findings,currentTrackedFindings:current,limitations:'Historical source/config/text blobs plus current tracked/unignored files: exact-value scan against current private environment plus sensitive-file history detection. Does not prove old/rotated unknown secrets were absent; media binaries are excluded.'};
fs.mkdirSync('.local-tools',{recursive:true});fs.writeFileSync('.local-tools/secret-scan.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({scannedHistoricalBlobs:blobs,historyFindings:findings.length,currentTrackedFindings:current.length,historyFiles:[...new Set(findings.map(f=>f.file))]}));
