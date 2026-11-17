export function requirePricingAdmin(req, res, next) {
  if (req.admin?.role !== 'super_admin') return res.status(403).json({ status: false, error: 'Only the superadmin can change membership prices, access or coupons.' });
  return next();
}
export function money(value, minimum = 0) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+(\.\d{1,2})?$/.test(String(value))) throw Error('Enter a valid amount with no more than two decimal places.');
  const n = Number(value);if (!Number.isFinite(n) || n < minimum || n > 10000000) throw Error('Amount is outside the supported range.');return n;
}
export function positiveInteger(value, max = 1000000) {const n = Number(value);if (!Number.isSafeInteger(n) || n < 1 || n > max) throw Error('Enter a valid positive whole number.');return n;}
export function couponInput(body, now = new Date()) {
  const code = String(body.code || '').trim().toUpperCase();if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw Error('Coupon code must contain 3–40 letters, numbers, hyphens or underscores.');
  const type = body.discount_type === 'fixed' ? 'fixed_amount' : body.discount_type;if (!['fixed_amount', 'percentage'].includes(type)) throw Error('Choose a valid discount type.');
  const value = money(body.discount_value, .01);if (type === 'percentage' && value > 100) throw Error('Percentage discounts cannot exceed 100%.');
  const from = new Date(body.valid_from || now),until = new Date(body.valid_until || now.getTime() + 365 * 86400000);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(until.getTime()) || until <= from) throw Error('Coupon expiry must be after its start date.');
  return { code, type, value, min: money(body.min_order_amount ?? 0), cap: body.max_discount_amount == null || body.max_discount_amount === '' ? null : money(body.max_discount_amount, .01), from: from.toISOString(), until: until.toISOString(), limit: positiveInteger(body.usage_limit ?? body.max_uses ?? 100) };
}
export async function installPricingSchema(db) {
  if (!(await db.prepare('PRAGMA table_info(coupons)').all()).some((c) => c.name === 'deleted_at')) await db.exec('ALTER TABLE coupons ADD COLUMN deleted_at TEXT');
  await db.exec("CREATE TABLE IF NOT EXISTS coupon_reservations (order_id TEXT PRIMARY KEY,coupon_id TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'reserved',created_at TEXT NOT NULL)");
}
export async function membershipQuote(db, planId, couponCode, now = new Date()) {
  if (typeof planId !== 'string' || !planId || planId.length > 100) throw Error('Choose a valid membership plan.');
  const aliases = { 'samhita-scholars': 'plan_12m', 'aiapget-fastrack': 'plan_6m', 'bams-foundation': 'plan_3m', 'fast-track': 'plan_1m', '12m': 'plan_12m', '6m': 'plan_6m', '3m': 'plan_3m', '1m': 'plan_1m' };
  const plan = await db.prepare('SELECT * FROM membership_plans WHERE id=? AND is_active=1 AND COALESCE(is_public,1)=1').get(aliases[planId] || planId);
  if (!plan) throw Error('This membership plan is invalid, inactive or unavailable.');
  const base = money(plan.price, 1),duration = positiveInteger(plan.duration_months, 120);let coupon = null,discount = 0;
  if (couponCode) {
    if (typeof couponCode !== 'string' || couponCode.length > 40) throw Error('Invalid coupon code.');
    coupon = await db.prepare('SELECT * FROM coupons WHERE code=? AND is_active=1 AND deleted_at IS NULL').get(couponCode.trim().toUpperCase());
    if (!coupon || !Number.isFinite(Date.parse(coupon.valid_from)) || !Number.isFinite(Date.parse(coupon.valid_until)) || Date.parse(coupon.valid_from) > now.getTime() || Date.parse(coupon.valid_until) <= now.getTime()) throw Error('This coupon is invalid, not yet available or expired.');
    if (base < money(coupon.min_order_amount ?? 0)) throw Error('The selected plan does not meet the coupon minimum amount.');
    const pending = (await db.prepare("SELECT COUNT(*) AS n FROM coupon_reservations WHERE coupon_id=? AND state='reserved'").get(coupon.id)).n;
    if ((coupon.times_used || 0) + pending >= positiveInteger(coupon.usage_limit)) throw Error('This coupon has reached its usage limit or is reserved by pending payments.');
    const value = money(coupon.discount_value, .01);
    if (!['percentage', 'fixed_amount', 'fixed'].includes(coupon.discount_type) || coupon.discount_type === 'percentage' && value > 100) throw Error('This coupon is not configured correctly.');
    discount = coupon.discount_type === 'percentage' ? Math.round(base * 100 * value / 100) / 100 : value;
    if (coupon.max_discount_amount != null) discount = Math.min(discount, money(coupon.max_discount_amount, .01));
  }
  const amountPaise = Math.round((base - discount) * 100);if (amountPaise < 100) throw Error('The payable amount must be at least INR 1.');
  return { plan: { ...plan, duration_months: duration }, coupon, couponId: coupon?.id || null, discountAmount: Math.round(discount * 100) / 100, finalAmount: amountPaise / 100, amountPaise };
}
export async function reserveCoupon(db, planId, code, orderId) {
  if(db.withTransaction)return db.withTransaction(async()=>{const quote=await membershipQuote(db,planId,code);if(quote.couponId)await db.prepare('INSERT INTO coupon_reservations(order_id,coupon_id,created_at) VALUES (?,?,?)').run(orderId,quote.couponId,new Date().toISOString());return quote;});
  await db.exec('BEGIN IMMEDIATE');try {const quote = await membershipQuote(db, planId, code);if (quote.couponId) await db.prepare('INSERT INTO coupon_reservations(order_id,coupon_id,created_at) VALUES (?,?,?)').run(orderId, quote.couponId, new Date().toISOString());await db.exec('COMMIT');return quote;} catch (error) {await db.exec('ROLLBACK');throw error;}
}
export async function consumeCoupon(db, order) {
  if (!order.coupon_id) return;
  const changed = await db.prepare("UPDATE coupon_reservations SET state='used' WHERE order_id=? AND state='reserved'").run(order.id);
  if (changed.changes) await db.prepare('UPDATE coupons SET times_used=COALESCE(times_used,0)+1 WHERE id=?').run(order.coupon_id);
}
