import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {consumeOneTimeCode} from '../server/oneTimeCodes.js';
test('single-use OTP rejects concurrent reuse, expiry and exhausted retry limits',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE student_otps(id TEXT PRIMARY KEY,used_at TEXT,attempts INTEGER,expires_at TEXT)');
 try{db.prepare('INSERT INTO student_otps VALUES (?,NULL,0,?)').run('code','2099-01-01T00:00:00.000Z');assert.deepEqual(await Promise.all([consumeOneTimeCode(db,'code'),consumeOneTimeCode(db,'code')]),[true,false]);
 db.prepare('INSERT INTO student_otps VALUES (?,NULL,5,?)').run('locked','2099-01-01T00:00:00.000Z');assert.equal(await consumeOneTimeCode(db,'locked'),false);
 db.prepare('INSERT INTO student_otps VALUES (?,NULL,0,?)').run('expired','2000-01-01T00:00:00.000Z');assert.equal(await consumeOneTimeCode(db,'expired'),false);
 }finally{db.close();}
});
