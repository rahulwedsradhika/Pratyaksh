import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { membershipEligibility, installMembershipOverview } from '../server/membershipOverview.js';
import { assertCheckoutSignature, assertCapturedPayment } from '../server/paymentValidation.js';

test('renewal is available only at or after expiry for a verified student', () => {
  const now = Date.parse('2026-11-17T12:00:00Z');
  const student = { email_verified: 1 };
  const membership = (expiry_date) => [{ expiry_date }];
  assert.equal(membershipEligibility(student, membership('2026-11-17T12:00:01Z'), now), 'active');
  assert.equal(membershipEligibility(student, membership('2026-11-17T12:00:00Z'), now), 'expired');
  assert.equal(membershipEligibility(student, [], now), 'no_membership');
  assert.equal(membershipEligibility(student, membership('invalid'), now), 'no_membership');
  assert.equal(membershipEligibility({ ...student, classroomAccess: true }, membership('2020-01-01'), now), 'administrator');
  assert.equal(membershipEligibility({ ...student, is_suspended: 1 }, membership('2020-01-01'), now), 'suspended');
  assert.equal(membershipEligibility({ email_verified: 0 }, membership('2020-01-01'), now), 'unverified');
});

test('checkout signature uses stored order and rejects forged or simulated payments', () => {
  const order = { razorpay_order_id: 'order_verified' };
  const secret = 'test-only-secret';
  const input = { razorpayOrderId: order.razorpay_order_id, razorpayPaymentId: 'pay_real123', razorpaySignature: crypto.createHmac('sha256', secret).update('order_verified|pay_real123').digest('hex') };
  assert.doesNotThrow(() => assertCheckoutSignature(order, input, secret));
  for (const change of [{ razorpayOrderId: 'order_other' }, { razorpaySignature: 'sandbox_valid_sig' }, { razorpaySignature: '0'.repeat(64) }, { razorpayPaymentId: 'pay_sandbox_1' }]) {
    assert.throws(() => assertCheckoutSignature(order, { ...input, ...change }, secret));
  }
  assert.throws(() => assertCheckoutSignature(order, input, ''));
});

test('only captured payments with exact order, amount and currency are accepted', () => {
  const order = { razorpay_order_id: 'order_verified', amount: 1999, currency: 'INR' };
  const payment = { id: 'pay_real123', order_id: order.razorpay_order_id, amount: 199900, currency: 'INR', status: 'captured', captured: true };
  assert.doesNotThrow(() => assertCapturedPayment(order, payment));
  for (const change of [{ status: 'authorized', captured: false }, { amount: 100 }, { currency: 'USD' }, { order_id: 'order_other' }, { captured: false }]) {
    assert.throws(() => assertCapturedPayment(order, { ...payment, ...change }));
  }
  assert.throws(() => assertCapturedPayment(order, null));
});

test('overview reads only the signed-in student and never exposes gateway secrets', async () => {
  const db = new DatabaseSync(':memory:');
  await db.exec(`CREATE TABLE memberships(id TEXT,student_id TEXT,plan_id TEXT,plan_name_snapshot TEXT,start_date TEXT,expiry_date TEXT,status TEXT);
    CREATE TABLE membership_plans(id TEXT,name TEXT);
    CREATE TABLE payment_orders(id TEXT,student_id TEXT,plan_id TEXT,amount REAL,currency TEXT,status TEXT,created_at TEXT,razorpay_payment_id TEXT);`);
  await db.prepare('INSERT INTO membership_plans VALUES (?,?)').run('p1', 'Actual Plan');
  await db.prepare('INSERT INTO memberships VALUES (?,?,?,?,?,?,?)').run('m1', 'alice', 'p1', 'Actual Plan', '2025-01-01', '2099-01-01', 'active');
  await db.prepare('INSERT INTO payment_orders VALUES (?,?,?,?,?,?,?,?)').run('o1', 'alice', 'p1', 1999, 'INR', 'completed', '2025-01-01', 'pay_real123');
  let handler;
  installMembershipOverview({ get(path, fn) {handler = fn;} }, db, (request) => request.student, () => false, () => ({ gatewayEnabled: true, mode: 'test', keySecret: 'secret' }));
  const response = () => ({ code: 200, setHeader() {}, status(code) {this.code = code;return this;}, json(body) {this.body = body;return this;} });
  let res = response();await handler({ student: { id: 'alice', email_verified: 1 } }, res);
  assert.equal(res.body.data.canRenew, false);
  assert.equal(res.body.data.membership.name, 'Actual Plan');
  assert.equal(res.body.data.history.length, 1);
  assert.equal(JSON.stringify(res.body).includes('secret'), false);
  res = response();await handler({ student: { id: 'bob', email_verified: 1 } }, res);
  assert.equal(res.body.data.history.length, 0);
  assert.equal(res.body.data.canRenew, false);
  res = response();await handler({}, res);assert.equal(res.code, 401);
  db.close();
});
