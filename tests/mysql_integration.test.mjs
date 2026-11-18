import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createMysqlDatabase} from '../server/databaseRuntime.js';import {getMysqlPool,closeMysqlPool} from '../server/db_mysql.js';
import {migrate} from '../database/migrate.mjs';import {getAdminOverview} from '../server/adminAnalytics.js';
import {membershipQuote} from '../server/membershipPricing.js';import {findActiveMembership} from '../server/membershipEligibility.js';
import {recordSandboxPayment} from '../server/sandboxPayments.js';
import {resolveGoogleStudent} from '../server/googleAuthService.js';
import {consumeOneTimeCode} from '../server/oneTimeCodes.js';
import {paperQuestions} from '../server/paperQuestions.js';
const enabled=process.env.RUN_MYSQL_TESTS==='true';
if(enabled&&(!/^ayurvedasidhi_.*test$/.test(process.env.DB_NAME||'')||process.env.DB_HOST!=='127.0.0.1'||[process.env.APP_ENV,process.env.NODE_ENV].includes('production')))throw Error('MySQL tests are restricted to explicit local test databases.');
test('real MariaDB: schema, UTF-8, transactions, parameter binding and application reads',{skip:!enabled},async()=>{
  const pool=getMysqlPool(),db=createMysqlDatabase();
  try{
    assert.ok((await migrate(pool)).every(m=>m.status==='already applied'));
    const [[text]]=await pool.execute('SELECT ? AS text',['आयुर्वेदः हिन्दी 🌿']);assert.equal(text.text,'आयुर्वेदः हिन्दी 🌿');
    const [[engine]]=await pool.query("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND ENGINE<>'InnoDB'");assert.equal(Number(engine.n),0);
    const plan=await db.prepare('SELECT id FROM membership_plans ORDER BY duration_months LIMIT 1').get();assert.ok((await membershipQuote(db,plan.id)).amountPaise>0);
    const formerlyEmpty=await db.prepare('SELECT p.id FROM test_papers p WHERE NOT EXISTS(SELECT 1 FROM questions q WHERE q.paper_id=p.id) LIMIT 1').get();assert.ok(formerlyEmpty);assert.ok((await paperQuestions(db,formerlyEmpty.id)).length>0);
    const overview=await getAdminOverview(db);assert.ok(overview.totalStudents>=3);assert.equal(overview.revenue30DaysTrend.length,30);
    assert.equal(await findActiveMembership("' OR 1=1 --",db),undefined);
    const id='test_'+crypto.randomUUID();
    await assert.rejects(db.withTransaction(async()=>{await db.prepare('INSERT INTO inquiries(id,name,email,created_at) VALUES (?,?,?,?)').run(id,'आयुर्वेदः','fixture@example.invalid',new Date().toISOString());throw Error('rollback requested');}),/rollback requested/);
    assert.equal(await db.prepare('SELECT id FROM inquiries WHERE id=?').get(id),undefined);
    const googleEmail='google_'+crypto.randomUUID()+'@example.invalid';
    await assert.rejects(db.withTransaction(async()=>{
      const profile={sub:'fixture_'+crypto.randomUUID(),email:googleEmail,fullName:'Google Fixture',phone:'9876543210',picture:null};
      const options={database:db,logActivity:async()=>{}};
      const first=await resolveGoogleStudent(profile,'127.0.0.1',options);
      assert.ok(first.student.id);assert.equal(first.student.onboarding_state,'verified_pending_payment');
      await db.prepare('DELETE FROM user_auth_identities WHERE student_id=?').run(first.student.id);
      const linked=await resolveGoogleStudent(profile,'127.0.0.1',options);
      const returning=await resolveGoogleStudent(profile,'127.0.0.1',options);
      for(const result of [linked,returning]){
        assert.equal(result.student.id,first.student.id);
        const tokenHash=crypto.randomBytes(32).toString('hex');
        await db.prepare('INSERT INTO student_sessions(token_hash,student_id,expires_at,created_at) VALUES (?,?,?,?)').run(tokenHash,result.student.id,'2099-01-01T00:00:00.000Z',new Date().toISOString());
        assert.equal((await db.prepare('SELECT student_id FROM student_sessions WHERE token_hash=?').get(tokenHash)).student_id,first.student.id);
      }
      const sandboxId='sandbox_'+crypto.randomUUID();
      const sandboxOrder={provider:'razorpay',id:sandboxId,student_id:first.student.id,razorpay_order_id:'order_fixture',amount:100,currency:'INR',metadata:JSON.stringify({gatewayMode:'test'})};
      await db.prepare('INSERT INTO payment_orders(id,student_id,plan_id,amount,currency,status,metadata,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(sandboxId,first.student.id,plan.id,100,'INR','pending',sandboxOrder.metadata,new Date().toISOString(),new Date().toISOString());
      const confirmed=await recordSandboxPayment(db,sandboxOrder,{id:'pay_fixture',order_id:'order_fixture',status:'captured',captured:true,amount:10000,currency:'INR'});
      assert.equal(confirmed.sandbox,true);assert.equal((await db.prepare('SELECT status FROM payment_orders WHERE id=?').get(sandboxId)).status,'sandbox_verified');
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM memberships WHERE student_id=?').get(first.student.id)).n,0);
      throw Error('rollback Google fixture');
    }),/rollback Google fixture/);
    assert.equal(await db.prepare('SELECT id FROM students WHERE email=?').get(googleEmail),undefined);
    const [[date]]=await pool.query("SELECT STR_TO_DATE(REPLACE(REPLACE('2099-01-01T00:00:00.000Z','T',' '),'Z',''),'%Y-%m-%d %H:%i:%s.%f') IS NOT NULL AS valid");assert.equal(date.valid,1);
    const otpId='otp_fixture_'+crypto.randomUUID();
    try{await db.prepare('INSERT INTO student_otps(id,email,otp_code,purpose,expires_at,created_at) VALUES (?,?,?,?,?,?)').run(otpId,'fixture@example.invalid','test-hash','test','2099-01-01T00:00:00.000Z',new Date().toISOString());
      const claims=await Promise.all([consumeOneTimeCode(db,otpId),consumeOneTimeCode(db,otpId)]);assert.equal(claims.filter(Boolean).length,1);
    }finally{await db.prepare('DELETE FROM student_otps WHERE id=?').run(otpId);}
  }finally{await closeMysqlPool();}
});
