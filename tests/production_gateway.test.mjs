import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {readGateway} from '../server/gatewayConfiguration.js';import {encryptSecret} from '../server/gatewayVault.js';
test('student checkout is unavailable for production Test keys but remains available in separate staging',async()=>{
 const previous={env:process.env.APP_ENV,key:process.env.RAZORPAY_ENCRYPTION_KEY};process.env.RAZORPAY_ENCRYPTION_KEY='isolated-private-fixture-key-123456789012345';
 const db=new DatabaseSync(':memory:');
 try{db.exec('CREATE TABLE payment_settings(id TEXT,gateway_mode TEXT,gateway_enabled INTEGER);CREATE TABLE gateway_profiles(mode TEXT,key_id TEXT,key_secret TEXT,webhook_secret TEXT)');db.prepare('INSERT INTO payment_settings VALUES (?,?,1)').run('default_settings','test');db.prepare('INSERT INTO gateway_profiles VALUES (?,?,?,?)').run('test','rzp_test_fixture',encryptSecret('fixture-private-key'),'');
 process.env.APP_ENV='production';assert.equal((await readGateway(db)).gatewayEnabled,false);
 process.env.APP_ENV='staging';assert.equal((await readGateway(db)).gatewayEnabled,true);
 }finally{db.close();for(const [key,value]of [['APP_ENV',previous.env],['RAZORPAY_ENCRYPTION_KEY',previous.key]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
