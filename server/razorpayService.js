import { decodeGatewayWebhook } from './gatewayWebhookValidation.js';
import { readGateway } from './gatewayConfiguration.js';
import { reserveCoupon, consumeCoupon, positiveInteger } from './membershipPricing.js';
import { assertCapturedPayment, assertCheckoutSignature } from './paymentValidation.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from './db.js';
import { assertMembershipEligible } from './membershipEligibility.js';
import {assertPaymentEnvironment} from './productionConfiguration.js';

// Safe Transaction Runner supporting both node:sqlite DatabaseSync and better-sqlite3
async function runInTransaction(fn) {
  if (db.withTransaction) return db.withTransaction(fn);
  if (typeof db.transaction === 'function') {
    return db.transaction(fn)();
  }
  try {
    await db.exec('BEGIN');
    const result = await fn();
    await db.exec('COMMIT');
    return result;
  } catch (err) {
    try {await db.exec('ROLLBACK');} catch {}
    throw err;
  }
}

export { encryptSecret, decryptSecret } from './gatewayVault.js';
export async function getGatewaySettings(mode) {return await readGateway(db, mode);}

/**
 * Initialize official Razorpay SDK client with active credentials
 */
export async function getRazorpayClient(mode) {
  const settings = await getGatewaySettings(mode);
  if (!settings.keyId || !settings.keySecret) {
    throw new Error('Razorpay credentials not configured. Please supply Key ID and Key Secret.');
  }
  return {
    client: new Razorpay({
      key_id: settings.keyId,
      key_secret: settings.keySecret
    }),
    settings
  };
}

/**
 * Test Connection against Razorpay's Real API (Permitted read-only check)
 */
export async function testRazorpayConnection() {
  const startTime = Date.now();
  const settings = await getGatewaySettings();

  if (!settings.keyId) {
    return {
      status: false,
      code: 'MISSING_KEY_ID',
      message: 'Razorpay Key ID is missing. Please configure Key ID in settings.'
    };
  }

  if (!settings.keySecret) {
    return {
      status: false,
      code: 'MISSING_KEY_SECRET',
      message: 'Razorpay Key Secret is missing. Please configure Key Secret in settings.'
    };
  }

  // Format validation
  const isTest = settings.keyId.startsWith('rzp_test_');
  const isLive = settings.keyId.startsWith('rzp_live_');
  if (!isTest && !isLive) {
    return {
      status: false,
      code: 'INVALID_KEY_FORMAT',
      message: 'Razorpay Key ID format is invalid. Key must start with rzp_test_ or rzp_live_.'
    };
  }

  try {
    const { client } = await getRazorpayClient();
    // Perform permitted read-only collection query to verify authentication
    const response = await client.orders.all({ count: 1 });
    const latencyMs = Date.now() - startTime;

    return {
      status: true,
      data: {
        healthy: true,
        mode: settings.mode,
        keyId: settings.keyId,
        latencyMs,
        testedAt: new Date().toISOString(),
        razorpayEntity: response?.entity || 'collection',
        existingOrderCount: response?.count ?? 0,
        checks: {
          keyIdPresent: true,
          keyFormatValid: true,
          keySecretPresent: true,
          modeConsistent: settings.mode === 'test' && isTest || settings.mode === 'live' && isLive,
          apiAuthenticationVerified: true,
          webhookConfigured: Boolean(settings.webhookSecret),
          autoActivationEnabled: settings.autoActivate
        },
        message: `Successfully connected and authenticated with Razorpay Test Mode API (${latencyMs}ms latency).`
      }
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error('[RazorpayAPI] Authentication test failed; status:', err.statusCode || 'unavailable');

    let clientMessage = err.message || 'Razorpay authentication failed.';
    if (err.statusCode === 401 || err.error?.code === 'BAD_REQUEST_ERROR') {
      clientMessage = 'Razorpay rejected the provided Key ID / Key Secret credentials. Please verify your Test API keys in Razorpay Dashboard.';
    }

    return {
      status: false,
      error: clientMessage,
      statusCode: err.statusCode || 500,
      latencyMs,
      details: err.error || null
    };
  }
}

/**
 * Create a Real Order with Razorpay Test API
 */
const orderCreationInProgress = new Set();
export async function createRazorpayOrder(options) {
  const key = options.student.id;
  if (orderCreationInProgress.has(key)) throw new Error('A payment request is already in progress. Please wait.');
  orderCreationInProgress.add(key);
  try {return await createCheckedRazorpayOrder(options);} finally
  {orderCreationInProgress.delete(key);}
}

async function createCheckedRazorpayOrder({ student, planId, couponCode, reqIp }) {
  await assertMembershipEligible(student);
  if (student.is_suspended || !student.email_verified) {
    throw new Error('Your account must be verified and active before retrying payment. Contact the helpline.');
  }
  // Keep the original ledger intact. Do not charge again while money is being
  // reconciled or an earlier gateway payment is authorized/captured.
  const previousOrders = await db.prepare(`SELECT * FROM payment_orders WHERE student_id = ?
    AND status IN ('pending', 'processing', 'awaiting_verification')`).all(student.id);
  for (const order of previousOrders) {
    if (order.status === 'awaiting_verification' || order.student_submitted_utr) {
      throw new Error('Your earlier payment is awaiting bank confirmation. Please contact the helpline before paying again.');
    }
    if (order.razorpay_order_id) {
      const { client } = await getRazorpayClient(JSON.parse(order.metadata || '{}').gatewayMode);
      let payments;
      try {payments = await client.orders.fetchPayments(order.razorpay_order_id);}
      catch {throw new Error('We could not check your previous payment. Please refresh or contact the helpline before retrying.');}
      if ((payments.items || []).some((payment) => ['created', 'authorized', 'captured'].includes(payment.status))) {
        throw new Error('Your earlier payment is still being processed or has been received. Please wait for confirmation or contact the helpline.');
      }
    }
  }
  // Membership could have activated while waiting for a provider response.
  await assertMembershipEligible(student);
  const settings = await getGatewaySettings();

  if (!settings.gatewayEnabled) {
    throw new Error('Online payments are currently undergoing scheduled maintenance. Please try again shortly or contact admissions.');
  }

  const internalOrderId = 'ORD_' + crypto.randomUUID();
  const { plan, couponId, discountAmount, finalAmount, amountPaise } = await reserveCoupon(db, planId, couponCode, internalOrderId);

  // 3. Official Server-to-Server Call to Razorpay Orders API
  let rzpOrder;
  try {const { client } = await getRazorpayClient();rzpOrder = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: internalOrderId.slice(0, 40),
      notes: {
        internalOrderId,
        studentId: student.id,
        studentEmail: student.email,
        planId: plan.id,
        planName: plan.name,
        durationMonths: String(plan.duration_months)
      }
    });

  } catch (error) {
    await db.prepare("DELETE FROM coupon_reservations WHERE order_id=? AND state='reserved'").run(internalOrderId);
    throw error;
  }
  const now = new Date().toISOString();

  // 4. Save to Database Ledger
  await db.prepare(`
    INSERT INTO payment_orders (
      id, student_id, plan_id, amount, currency, status, idempotency_key, provider,
      provider_order_id, razorpay_order_id, payment_method, coupon_id, discount_amount,
      base_amount, metadata, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'INR', 'pending', ?, 'razorpay', ?, ?, 'razorpay_gateway', ?, ?, ?, ?, ?, ?)
  `).run(
    internalOrderId,
    student.id,
    plan.id,
    finalAmount,
    internalOrderId,
    rzpOrder.id,
    rzpOrder.id,
    couponId,
    discountAmount,
    plan.price,
    JSON.stringify({
      rzpOrderId: rzpOrder.id,
      planName: plan.name,
      studentEmail: student.email,
      gatewayMode: settings.mode,
      gatewayKeyId: settings.keyId,
      durationMonths: plan.duration_months,
      clientIp: reqIp || '127.0.0.1'
    }),
    now,
    now
  );

  return {
    orderId: internalOrderId,
    razorpayOrderId: rzpOrder.id,
    amount: finalAmount,
    amountPaise,
    currency: 'INR',
    keyId: settings.keyId,
    planId: plan.id,
    planName: plan.name,
    durationMonths: plan.duration_months,
    merchantName: settings.merchantName,
    logoUrl: new URL(settings.logoUrl, settings.publicOrigin).href,
    mode: settings.mode,
    themeColor: '#1E40AF',
    prefill: {
      name: student.full_name || student.name || '',
      email: student.email || '',
      contact: student.phone || ''
    }
  };
}

/**
 * Verify Razorpay Checkout Signature & Payment Status
 */
export async function verifyRazorpayPayment({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  student
}) {


  // 1. Find internal order
  const order = await db.prepare(`
    SELECT * FROM payment_orders 
    WHERE (id = ? OR razorpay_order_id = ?) AND student_id = ?
  `).get(orderId, orderId, student.id);

  if (!order) {
    throw new Error('Order record not found or does not belong to the authenticated scholar.');
  }
  assertPaymentEnvironment(JSON.parse(order.metadata || '{}').gatewayMode || 'test');

  // Idempotency check: Already fulfilled
  if (order.status === 'completed') {
    const existingMembership = await db.prepare('SELECT * FROM memberships WHERE order_ref = ? AND student_id = ?').get(order.id, student.id);
    return {
      status: true,
      alreadyFulfilled: true,
      orderId: order.id,
      membership: existingMembership,
      message: 'This payment has already been verified and your membership is active.'
    };
  }

  const settings = await getGatewaySettings(JSON.parse(order.metadata || '{}').gatewayMode);
  assertPaymentEnvironment(settings.mode);
  const effectiveOrderId = order.razorpay_order_id;
  assertCheckoutSignature(order, { razorpayOrderId, razorpayPaymentId, razorpaySignature }, settings.keySecret);

  // Require independent confirmation from the gateway; a checkout callback is not proof of capture.
  const { client } = await getRazorpayClient(settings.mode);
  let rzpPayment;
  try {rzpPayment = await client.payments.fetch(razorpayPaymentId);}
  catch {throw new Error('Payment confirmation is temporarily unavailable. Please check payment status before retrying.');}
  assertCapturedPayment(order, rzpPayment);
  const completedDuringVerification = await db.prepare('SELECT status FROM payment_orders WHERE id = ?').get(order.id);
  if (completedDuringVerification?.status === 'completed') {
    return { status: true, alreadyFulfilled: true, orderId: order.id, membership: await db.prepare('SELECT * FROM memberships WHERE order_ref = ? AND student_id = ?').get(order.id, student.id) };
  }

  // 4. Atomic Membership Activation
  const now = new Date();
  const plan = await db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(order.plan_id);

  // No-loss extension policy
  const currentActive = await db.prepare(`
    SELECT * FROM memberships 
    WHERE student_id = ? AND status = 'active' AND expiry_date > ? 
    ORDER BY expiry_date DESC LIMIT 1
  `).get(student.id, now.toISOString());

  const startDate = currentActive && new Date(currentActive.expiry_date) > now ?
  currentActive.expiry_date :
  now.toISOString();

  const snapshot = JSON.parse(order.metadata || '{}');
  const durationMonths = positiveInteger(snapshot.durationMonths ?? plan?.duration_months, 120);
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

  const membershipId = `MEM_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  let fulfilledMembershipId=membershipId;

  // Execute database transaction
  await runInTransaction(async () => {
    const locked=await db.prepare('SELECT status FROM payment_orders WHERE id=?'+(db.engine==='mysql'?' FOR UPDATE':'')).get(order.id);
    if(locked?.status==='completed'){
      const previous=await db.prepare('SELECT id FROM memberships WHERE order_ref=?').get(order.id);
      if(!previous)throw Error('Completed payment requires reconciliation.');
      fulfilledMembershipId=previous.id;return;
    }
    // A. Update payment_orders
    await db.prepare(`
      UPDATE payment_orders
      SET status = 'completed',
          provider = 'razorpay',
          provider_payment_id = ?,
          provider_order_id = ?,
          provider_signature = ?,
          razorpay_payment_id = ?,
          razorpay_order_id = ?,
          razorpay_signature = ?,
          reconciliation_status = 'gateway_verified',
          updated_at = ?
      WHERE id = ?
    `).run(
      razorpayPaymentId,
      effectiveOrderId,
      razorpaySignature,
      razorpayPaymentId,
      effectiveOrderId,
      razorpaySignature,
      now.toISOString(),
      order.id
    );

    await consumeCoupon(db, order);
    // B. Insert active membership
    await db.prepare(`
      INSERT INTO memberships (
        id, student_id, plan_id, plan_name_snapshot, price_snapshot, currency,
        duration_months, order_ref, start_date, expiry_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      membershipId,
      student.id,
      plan ? plan.id : order.plan_id,
      snapshot.planName || plan?.name || 'Pratyaksh Ayurveda membership',
      order.amount,
      durationMonths,
      order.id,
      startDate,
      expiryDate.toISOString(),
      now.toISOString(),
      now.toISOString()
    );

    // C. Update student onboarding state
    await db.prepare("UPDATE students SET onboarding_state = 'completed', updated_at = ? WHERE id = ?").run(
      now.toISOString(),
      student.id
    );

    // D. Audit event
    await db.prepare(`
      INSERT INTO payment_events (id, order_id, event_type, payload, is_reconciled, created_at)
      VALUES (?, ?, 'razorpay_payment_verified', ?, 1, ?)
    `).run(
      `evt_${Date.now()}`,
      order.id,
      JSON.stringify({
        orderId: order.id,
        razorpayPaymentId,
        razorpayOrderId: effectiveOrderId,
        membershipId,
        amount: order.amount,
        startDate,
        expiryDate: expiryDate.toISOString()
      }),
      now.toISOString()
    );
  });

  const activatedMembership = await db.prepare('SELECT * FROM memberships WHERE id = ?').get(fulfilledMembershipId);

  return {
    status: true,
    orderId: order.id,
    membershipId:fulfilledMembershipId,
    membership: activatedMembership,
    planName: plan?.name || 'Ayurvedasidhi Membership',
    expiryDate: expiryDate.toISOString(),
    message: `Payment verified successfully! Welcome to ${plan?.name || 'Ayurvedasidhi'}.`
  };
}

/**
 * Handle Inbound Webhooks from Razorpay
 */
export async function processRazorpayWebhook(rawBody, signatureHeader, mode) {
  const profiles = { test: await getGatewaySettings('test'), live: await getGatewaySettings('live') };
  const decoded = decodeGatewayWebhook(rawBody, signatureHeader, profiles, mode);
  const settings = profiles[decoded.mode],event = decoded.event;
  const eventId = event.id || `rzp_${crypto.createHash('sha256').update(rawBody).digest('hex')}`;
  const eventType = event.event;
  await db.prepare('INSERT OR IGNORE INTO gateway_webhook_receipts(event_id,mode,event_type,received_at) VALUES (?,?,?,?)').run(eventId, settings.mode, eventType, new Date().toISOString());

  if (event.payload?.payment?.entity?.order_id && (await db.prepare('SELECT id FROM gateway_diagnostic_orders WHERE provider_order_id=?').get(event.payload.payment.entity.order_id))) return { status: true, diagnostic: true };
  // Deduplication check
  const existingEvent = await db.prepare('SELECT id FROM payment_events WHERE id = ?').get(eventId);
  if (existingEvent) {
    return { status: true, message: 'Event already processed (deduplicated).' };
  }

  if (eventType === 'order.paid' || eventType === 'payment.captured') {
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;

    if (razorpayOrderId) {
      const internalOrder = await db.prepare('SELECT * FROM payment_orders WHERE razorpay_order_id = ?').get(razorpayOrderId);
      if (internalOrder && JSON.parse(internalOrder.metadata || '{}').gatewayMode && JSON.parse(internalOrder.metadata).gatewayMode !== settings.mode) throw Error('Webhook environment does not match the order.');
      if (internalOrder && internalOrder.status !== 'completed' && settings.autoActivate) {
        assertPaymentEnvironment(settings.mode);
        assertCapturedPayment(internalOrder, paymentEntity);
        if (orderEntity && (orderEntity.id !== internalOrder.razorpay_order_id || orderEntity.status !== 'paid')) throw new Error('Webhook order is not paid.');
        const student = await db.prepare('SELECT * FROM students WHERE id = ?').get(internalOrder.student_id);
        if (student) {
          const now = new Date();
          const plan = await db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(internalOrder.plan_id);
          const snapshot = JSON.parse(internalOrder.metadata || '{}');
          const durationMonths = positiveInteger(snapshot.durationMonths ?? plan?.duration_months, 120);
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

          const membershipId = `MEM_WH_${Date.now()}`;

          await runInTransaction(async () => {
            const latest=await db.prepare('SELECT status FROM payment_orders WHERE id=?'+(db.engine==='mysql'?' FOR UPDATE':'')).get(internalOrder.id);
            if(latest?.status==='completed')return;
            await db.prepare(`
              UPDATE payment_orders 
              SET status = 'completed', provider_payment_id = ?, razorpay_payment_id = ?, reconciliation_status = 'webhook_verified', updated_at = ?
              WHERE id = ?
            `).run(razorpayPaymentId || 'pay_wh_captured', razorpayPaymentId || 'pay_wh_captured', now.toISOString(), internalOrder.id);

            await db.prepare(`
              INSERT INTO memberships (id, student_id, plan_id, plan_name_snapshot, price_snapshot, currency, duration_months, order_ref, start_date, expiry_date, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, 'active', ?, ?)
            `).run(membershipId, student.id, plan ? plan.id : internalOrder.plan_id, snapshot.planName || plan?.name || 'Pratyaksh Ayurveda membership', internalOrder.amount, durationMonths, internalOrder.id, now.toISOString(), expiryDate.toISOString(), now.toISOString(), now.toISOString());

            await consumeCoupon(db, internalOrder);
            await db.prepare("UPDATE students SET onboarding_state = 'completed', updated_at = ? WHERE id = ?").run(now.toISOString(), student.id);

            await db.prepare('INSERT INTO payment_events (id, order_id, event_type, payload, is_reconciled, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(eventId, internalOrder.id, eventType, rawBody.toString('utf8'), now.toISOString());
          });
        }
      }
    }
  }

  return { status: true, event: eventType, processed: true };
}
