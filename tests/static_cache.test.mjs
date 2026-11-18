import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {setStaticCacheHeaders} from '../server/staticCache.js';

test('public build assets cache safely while entry HTML and app updates revalidate',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pratyaksh-cache-'));
  await fs.mkdir(path.join(dir,'assets'));
  const files=['index.html','sw.js','manifest.webmanifest','assets/index-A123b456.js','assets/logo.svg'];
  for(const file of files)await fs.writeFile(path.join(dir,file),'fixture');
  const app=express();app.use(express.static(dir,{setHeaders:setStaticCacheHeaders}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(dir,{recursive:true,force:true});});
  const base='http://127.0.0.1:'+server.address().port;
  for(const file of ['index.html','sw.js','manifest.webmanifest'])assert.equal((await fetch(base+'/'+file)).headers.get('cache-control'),'no-cache');
  const asset=await fetch(base+'/assets/index-A123b456.js');assert.equal(asset.status,200);assert.equal(asset.headers.get('cache-control'),'public, max-age=31536000, immutable');
  assert.equal((await fetch(base+'/assets/logo.svg')).headers.get('cache-control'),'public, max-age=86400');
});
