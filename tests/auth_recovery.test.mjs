import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import express from 'express';
import {membershipExpiryTime,findUnexpiredMembership} from '../server/membershipDates.js';
import {apiErrorHandler} from '../server/apiErrors.js';
import {readApiResponse} from '../src/services/apiResponse.js';
import {createPaymentStatusHandler} from '../server/paymentStatus.js';

test('membership expiry checks retain UTC, offsets and the exact renewal boundary without SQL date functions',async()=>{
 const now=Date.parse('2026-11-18T12:00:00Z');
 assert.equal(membershipExpiryTime('2026-11-18 12:00:00'),now);
 assert.equal(membershipExpiryTime('2026-11-18T17:30:00+05:30'),now);
 assert.equal(membershipExpiryTime('2026-11-18'),Date.parse('2026-11-18T00:00:00Z'));
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE students(id TEXT,email TEXT);CREATE TABLE memberships(id TEXT,student_id TEXT,expiry_date TEXT,status TEXT)');
 db.prepare('INSERT INTO students VALUES (?,?)').run('alice','alice@example.invalid');
 const insert=db.prepare('INSERT INTO memberships VALUES (?,?,?,?)');
 insert.run('boundary','alice','2026-11-18T12:00:00Z','active');
 insert.run('invalid','alice','invalid-date','active');
 insert.run('unpaid','alice','2099-01-01','pending');
 try{
  assert.equal(await findUnexpiredMembership(db,'alice@example.invalid',{activeOnly:true,now}),undefined);
  assert.equal((await findUnexpiredMembership(db,'alice@example.invalid',{now})).id,'unpaid');
  insert.run('active','alice','2026-11-18T12:00:00.001Z','active');
  assert.equal((await findUnexpiredMembership(db,' ALICE@example.invalid ',{activeOnly:true,now})).id,'active');
  assert.equal(await findUnexpiredMembership(db,"' OR 1=1 --",{activeOnly:true,now}),undefined);
 }finally{db.close();}
});

test('API failures stay JSON and authentication clients do not display raw HTML parser errors',async t=>{
 const app=express();app.get('/api/test-failure',async()=>{const error=Error('Private database details');error.code='TEST_DATABASE_FAILURE';throw error;});app.use(apiErrorHandler);
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/test-failure');
 assert.equal(response.status,500);assert.match(response.headers.get('content-type'),/application\/json/);
 const body=await readApiResponse(response);assert.equal(body.status,false);assert.equal(body.code,'REQUEST_FAILED');assert.ok(!JSON.stringify(body).includes('Private database'));
 await assert.rejects(readApiResponse(new Response('<!DOCTYPE html><h1>503</h1>',{status:503})),error=>error.code==='INVALID_API_RESPONSE'&&!error.message.includes('Unexpected token'));
 assert.deepEqual(await readApiResponse(new Response(JSON.stringify({status:false,message:'Please wait before requesting another code.'}))),{status:false,message:'Please wait before requesting another code.'});
});

test('payment recovery keeps unpaid accounts restricted and returns their own latest order',async()=>{
 const query=[];const db={prepare(sql){return {async get(id){query.push({sql,id});return {id:'pending_order',student_id:id,status:'pending'};}};}};
 const handler=createPaymentStatusHandler({db,authenticate:async req=>req.student,findActiveMembership:async()=>undefined,hasAdminAccess:async()=>false});
 const response=()=>({statusCode:200,headers:{},status(code){this.statusCode=code;return this;},set(k,v){this.headers[k]=v;},json(body){this.body=body;return this;}});
 let res=response();await handler({},res);assert.equal(res.statusCode,401);assert.equal(query.length,0);
 res=response();await handler({student:{id:'learner',email:'learner@example.invalid',email_verified:1}},res);
 assert.equal(res.body.status,true);assert.equal(res.body.hasActiveMembership,false);assert.equal(res.body.classroomAccess,false);assert.equal(res.body.order.status,'pending');assert.equal(query[0].id,'learner');assert.ok(!query[0].sql.includes('rowid'));
});
