import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {isProductionSandbox,isSandboxOrder,recordSandboxPayment} from '../server/sandboxPayments.js';

test('sandbox verification records the Test payment and releases coupons without activating access',async t=>{
  const db=new DatabaseSync(':memory:');t.after(()=>db.close());
  db.exec(`CREATE TABLE payment_orders(id TEXT,student_id TEXT,status TEXT,provider_payment_id TEXT,razorpay_payment_id TEXT,provider_signature TEXT,razorpay_signature TEXT,reconciliation_status TEXT,updated_at TEXT);
    CREATE TABLE coupon_reservations(order_id TEXT,state TEXT);
    CREATE TABLE memberships(id TEXT);
    CREATE TABLE students(id TEXT,onboarding_state TEXT);
    INSERT INTO students VALUES('learner','verified_pending_payment');
    INSERT INTO payment_orders(id,student_id,status) VALUES('order','learner','pending');
    INSERT INTO coupon_reservations VALUES('order','reserved');`);
  const order={provider:'razorpay',id:'order',student_id:'learner',razorpay_order_id:'order_test',amount:100,currency:'INR',metadata:JSON.stringify({gatewayMode:'test'})};
  const payment={id:'pay_fixture',order_id:'order_test',status:'captured',captured:true,amount:10000,currency:'INR'};
  const result=await recordSandboxPayment(db,order,payment,'signature-previously-verified');
  assert.equal(result.sandbox,true);assert.equal(result.membership,null);
  assert.equal(db.prepare('SELECT status FROM payment_orders').get().status,'sandbox_verified');
  assert.equal(db.prepare('SELECT state FROM coupon_reservations').get().state,'released');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM memberships').get().n,0);
  assert.equal(db.prepare('SELECT onboarding_state FROM students').get().onboarding_state,'verified_pending_payment');
  await recordSandboxPayment(db,order,payment);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM memberships').get().n,0);
  await assert.rejects(recordSandboxPayment(db,order,{...payment,amount:1}),/amount or currency/);
  await assert.rejects(recordSandboxPayment(db,{...order,metadata:JSON.stringify({gatewayMode:'live'})},payment),/Only Test-mode/);
});

test('only server-labelled Test orders bypass old sandbox retry blocks; Live and unknown orders do not',()=>{
  const gatewayOrder={provider:'razorpay',razorpay_order_id:'order_fixture'};
  assert.equal(isSandboxOrder({...gatewayOrder,metadata:'{"gatewayMode":"test"}'}),true);
  assert.equal(isSandboxOrder({...gatewayOrder,provider:'direct_upi_qr',metadata:'{"gatewayMode":"test"}'}),false);
  for(const metadata of ['{"gatewayMode":"live"}','{}','invalid'])assert.equal(isSandboxOrder({...gatewayOrder,metadata}),false);
  assert.equal(isProductionSandbox('test',{APP_ENV:'production'}),true);
  assert.equal(isProductionSandbox('live',{APP_ENV:'production'}),false);
  assert.equal(isProductionSandbox('test',{APP_ENV:'development'}),false);
});
