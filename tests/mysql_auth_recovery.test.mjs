import test from 'node:test';import assert from 'node:assert/strict';import mysql from 'mysql2/promise';import crypto from 'node:crypto';
import {findUnexpiredMembership} from '../server/membershipDates.js';
import {latestPaymentOrderSql} from '../server/paymentStatus.js';
const enabled=process.env.RUN_MYSQL_TESTS==='true';
if(enabled&&(process.env.DB_HOST!=='127.0.0.1'||process.env.DB_PORT!=='3307'||!/test$/.test(process.env.DB_NAME||'')||[process.env.APP_ENV,process.env.NODE_ENV].includes('production')))throw Error('Only isolated local database tests are allowed.');
test('real MariaDB auth lookups and payment-status SQL work with mixed connection collations',{skip:!enabled},async()=>{
 const connection=await mysql.createConnection({host:'127.0.0.1',port:3307,user:process.env.DB_USER,password:process.env.DB_PASSWORD,charset:'utf8mb4',dateStrings:true});
 const name='ayurvedasidhi_auth_'+crypto.randomBytes(4).toString('hex')+'_test';
 try{
  await connection.query('CREATE DATABASE `'+name+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');await connection.query('USE `'+name+'`');
  await connection.query('CREATE TABLE students(id VARCHAR(191) PRIMARY KEY,email VARCHAR(191)) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin');
  await connection.query('CREATE TABLE memberships(id VARCHAR(191) PRIMARY KEY,student_id VARCHAR(191),expiry_date LONGTEXT,status VARCHAR(32)) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
  await connection.query('CREATE TABLE payment_orders(id VARCHAR(191) PRIMARY KEY,student_id VARCHAR(191),plan_id VARCHAR(191),amount INT,currency VARCHAR(8),status VARCHAR(32),created_at VARCHAR(32),updated_at VARCHAR(32)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await connection.execute('INSERT INTO students VALUES (?,?)',['learner','learner@example.invalid']);
  await connection.execute('INSERT INTO memberships VALUES (?,?,?,?)',['current','learner','2099-01-01','active']);
  await connection.execute('INSERT INTO memberships VALUES (?,?,?,?)',['expired','learner','2020-01-01T00:00:00.000Z','active']);
  for(const id of ['order_a','order_b'])await connection.execute('INSERT INTO payment_orders VALUES (?,?,?,?,?,?,?,?)',[id,'learner','plan',100,'INR','pending','2026-11-18T00:00:00Z','2026-11-18T00:00:00Z']);
  const db={prepare(sql){return {async all(...params){return (await connection.execute(sql,params))[0];}};}};
  for(const collation of ['utf8mb4_general_ci','utf8mb4_unicode_ci','utf8mb4_bin']){
    await connection.query('SET collation_connection='+collation);
    assert.equal((await findUnexpiredMembership(db,' LEARNER@example.invalid ',{activeOnly:true})).id,'current');
    assert.equal(await findUnexpiredMembership(db,"' OR 1=1 --",{activeOnly:true}),undefined);
    assert.equal((await connection.execute(latestPaymentOrderSql,['learner']))[0][0].id,'order_b');
  }
 }finally{await connection.end();}
});
