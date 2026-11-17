import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { requirePricingAdmin, money, couponInput, installPricingSchema, membershipQuote, reserveCoupon, consumeCoupon } from '../server/membershipPricing.js';
async function fixture() {const db = new DatabaseSync(':memory:');await db.exec(`CREATE TABLE membership_plans(id TEXT PRIMARY KEY,price REAL,duration_months INTEGER,is_active INTEGER,is_public INTEGER);CREATE TABLE coupons(id TEXT PRIMARY KEY,code TEXT,discount_type TEXT,discount_value REAL,min_order_amount REAL,max_discount_amount REAL,valid_from TEXT,valid_until TEXT,usage_limit INTEGER,times_used INTEGER,is_active INTEGER);
INSERT INTO membership_plans VALUES ('plan',1000,12,1,1);
INSERT INTO coupons VALUES ('coupon','SAVE','percentage',10,500,NULL,'2020-01-01','2099-01-01',1,0,1);`);await installPricingSchema(db);return db;}
test('only a server-verified superadmin role can mutate prices, access and coupons', () => {
  for (const role of [undefined, 'student', 'finance_staff', 'admissions_staff', 'support_staff']) {let status;requirePricingAdmin({ admin: { role }, body: { role: 'super_admin' } }, { status(s) {status = s;return this;}, json() {} }, () => assert.fail('Access granted'));assert.equal(status, 403);}
  let granted = false;requirePricingAdmin({ admin: { role: 'super_admin' } }, {}, () => {granted = true;});assert.equal(granted, true);
});
test('invalid numeric values cannot change prices or discount rules', () => {
  for (const value of [-1, '10xyz', 'Infinity', NaN, {}, '0.001']) assert.throws(() => money(value, 1));
  assert.equal(money('2999.50', 1), 2999.5);
  for (const change of [{ discount_value: 101 }, { discount_value: -5 }, { code: '<script>' }, { usage_limit: 0 }, { valid_until: 'yesterday' }]) assert.throws(() => couponInput({ code: 'SAVE', discount_type: 'percentage', discount_value: 10, ...change }));
  assert.equal(couponInput({ code: 'save', discount_type: 'fixed', discount_value: 20, max_uses: 5 }).limit, 5);
});
test('quotes use the stored price and reject unavailable plans and expired, deleted, inactive or unsuitable coupons', async () => {
  const db = await fixture();assert.equal((await membershipQuote(db, 'plan', 'SAVE')).finalAmount, 900);
  await assert.rejects(async () => await membershipQuote(db, 'garbage12', 'SAVE'));
  for (const [column, value] of [['is_active', 0], ['deleted_at', '2026-01-01'], ['valid_until', '2000-01-01'], ['valid_from', '2099-01-01'], ['min_order_amount', 2000], ['times_used', 1]]) {
    const original = (await db.prepare(`SELECT ${column} AS value FROM coupons`).get()).value;await db.prepare(`UPDATE coupons SET ${column}=?`).run(value);await assert.rejects(async () => await membershipQuote(db, 'plan', 'SAVE'));await db.prepare(`UPDATE coupons SET ${column}=?`).run(original);
  }
  await db.exec('UPDATE membership_plans SET is_public=0');await assert.rejects(async () => await membershipQuote(db, 'plan'));db.close();
});
test('last coupon use is reserved atomically and counted once when payment succeeds', async () => {
  const db = await fixture();const quote = await reserveCoupon(db, 'plan', 'SAVE', 'order1');assert.equal(quote.amountPaise, 90000);
  await assert.rejects(async () => await reserveCoupon(db, 'plan', 'SAVE', 'order2'));
  await consumeCoupon(db, { id: 'order1', coupon_id: 'coupon' });await consumeCoupon(db, { id: 'order1', coupon_id: 'coupon' });
  assert.equal((await db.prepare('SELECT times_used FROM coupons').get()).times_used, 1);
  await assert.rejects(async () => await membershipQuote(db, 'plan', 'SAVE'));db.close();
});
