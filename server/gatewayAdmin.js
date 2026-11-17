import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import Razorpay from 'razorpay';
import { safeGateway, readGateway, saveGatewayProfile, assertMode, publicOrigin } from './gatewayConfiguration.js';
import { decryptSecret } from './gatewayVault.js';
import { assertCheckoutSignature, assertCapturedPayment } from './paymentValidation.js';
import {storageDirectory} from './persistentStorage.js';
async function probe(id, secret) {const response = await fetch('https://api.razorpay.com/v1/orders?count=1', { headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64') }, signal: AbortSignal.timeout(12000) });if (!response.ok) throw Error('Razorpay could not verify this credential pair. Check that both keys belong to the selected mode.');}
const sdk = (conf) => new Razorpay({ key_id: conf.keyId, key_secret: conf.keySecret });
export function installGatewayAdmin(router, db, auth, owner, audit, dependencies = {}) {
  const verifyCredentials = dependencies.probe || probe,clientFor = dependencies.client || sdk;
  const result = async (res) => res.json({ status: true, data: await safeGateway(db) });
  const handle = (fn) => async (req, res) => {try {await fn(req, res);} catch (error) {res.status(400).json({ status: false, error: error.statusCode ? 'Razorpay could not complete the request. Check your configuration and retry.' : error.message || 'Gateway request failed.' });}};
  router.get('/gateway/settings', auth, owner, handle(async (_req, res) => await result(res)));
  router.put('/gateway/profiles/:mode', auth, owner, handle(async (req, res) => {
    const mode = assertMode(req.params.mode),current = await db.prepare('SELECT * FROM gateway_profiles WHERE mode=?').get(mode);
    const id = req.body.keyId === undefined ? current.key_id : String(req.body.keyId).trim();
    const secret = req.body.keySecret || decryptSecret(current.key_secret);
    if (!new RegExp('^rzp_' + mode + '_[a-zA-Z0-9]+$').test(id) || typeof secret !== 'string' || secret.length < 8 || secret.length > 256 || /[\s•]/.test(secret)) throw Error('Enter a matching Key ID and Key Secret for this mode.');
    await verifyCredentials(id, secret);
    await saveGatewayProfile(db, mode, { ...req.body, keySecret: req.body.keySecret || undefined, webhookSecret: req.body.webhookSecret || undefined });
    await db.prepare('UPDATE gateway_profiles SET verified_at=? WHERE mode=?').run(new Date().toISOString(), mode);
    await audit(req.admin.id, req.admin.full_name, 'GATEWAY_PROFILE_SAVED', 'gateway_profiles', mode, { mode });await result(res);
  }));
  router.post('/gateway/mode', auth, owner, handle(async (req, res) => {
    const mode = assertMode(req.body.mode),conf = await readGateway(db, mode);
    if(mode==='live'&&process.env.ALLOW_LIVE_PAYMENTS!=='true')throw Error('Live payments require separate approval and ALLOW_LIVE_PAYMENTS on the server.');
    if (!conf.keyId || !conf.keySecret) throw Error(`Save and verify ${mode === 'live' ? 'Live' : 'Test'} credentials first.`);
    if (mode === 'live' && !conf.webhookSecret) throw Error('Save a Live webhook secret and configure its public URL in Razorpay before switching.');
    await verifyCredentials(conf.keyId, conf.keySecret);
    const latest = await readGateway(db, mode);if (conf.keyId !== latest.keyId || conf.keySecret !== latest.keySecret) throw Error('Credentials changed during verification. Try again.');
    await db.prepare("UPDATE payment_settings SET gateway_mode=?,updated_at=? WHERE id='default_settings'").run(mode, new Date().toISOString());
    await db.prepare('UPDATE gateway_profiles SET verified_at=? WHERE mode=?').run(new Date().toISOString(), mode);
    await audit(req.admin.id, req.admin.full_name, 'GATEWAY_MODE_CHANGED', 'payment_settings', 'default_settings', { mode });await result(res);
  }));
  router.put('/gateway/settings', auth, owner, handle(async (req, res) => {
    const current = await readGateway(db),b = req.body;
    if (['keyId', 'keySecret', 'webhookSecret', 'mode'].some((key) => b[key] !== undefined)) throw Error('Use the separate mode and credential controls.');
    const name = b.merchantName ?? current.merchantName;if (typeof name !== 'string' || name.trim().length < 2 || name.length > 80) throw Error('Use a brand name of 2–80 characters.');
    const origin = publicOrigin(b.publicOrigin || current.publicOrigin);
    for (const key of ['gatewayEnabled', 'autoActivate']) if (b[key] !== undefined && typeof b[key] !== 'boolean') throw Error('Invalid gateway setting.');
    if (b.gatewayEnabled === true && (!current.keyId || !current.keySecret)) throw Error('Save valid credentials before enabling checkout.');
    const email = b.supportEmail ?? current.supportEmail,phone = b.supportPhone ?? current.supportPhone;
    if (typeof email !== 'string' || email.length > 254 || email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Enter a valid support email.');
    if (typeof phone !== 'string' || phone.length > 30) throw Error('Invalid support phone.');
    await db.prepare("UPDATE payment_settings SET merchant_display_name=?,support_email=?,support_phone=?,webhook_url=?,gateway_enabled=?,auto_activate_membership=?,updated_at=? WHERE id='default_settings'").run(name.trim(), email, phone, origin + '/api/payment/razorpay/webhook', Number(b.gatewayEnabled ?? current.gatewayEnabled), Number(b.autoActivate ?? current.autoActivate), new Date().toISOString());
    await audit(req.admin.id, req.admin.full_name, 'GATEWAY_BRANDING_UPDATED', 'payment_settings', 'default_settings', {});await result(res);
  }));
  router.post('/gateway/logo', auth, owner, handle(async (req, res) => {
    const match = typeof req.body.image === 'string' && req.body.image.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if (!match) throw Error('Upload a PNG, JPEG or WebP image.');
    const data = Buffer.from(match[2], 'base64');if (data.length > 90000 || data.length < 12) throw Error('Choose a logo smaller than 90 KB.');
    const valid = match[1] === 'png' ? data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : match[1] === 'jpeg' ? data[0] === 255 && data[1] === 216 && data[2] === 255 : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';if (!valid) throw Error('The logo file format is invalid.');
    const dir = storageDirectory('branding');const filename = crypto.randomUUID() + '.' + (match[1] === 'jpeg' ? 'jpg' : match[1]);fs.writeFileSync(path.join(dir, filename), data, { flag: 'wx' });
    await db.prepare("UPDATE payment_settings SET merchant_logo_url=?,updated_at=? WHERE id='default_settings'").run('/assets/checkout-branding/' + filename, new Date().toISOString());await audit(req.admin.id, req.admin.full_name, 'GATEWAY_LOGO_UPDATED', 'payment_settings', 'default_settings', {});await result(res);
  }));
  router.post('/gateway/test-connection', auth, owner, handle(async (req, res) => {const conf = await readGateway(db, assertMode(req.body.mode || (await readGateway(db)).mode));await verifyCredentials(conf.keyId, conf.keySecret);await db.prepare('UPDATE gateway_profiles SET verified_at=? WHERE mode=?').run(new Date().toISOString(), conf.mode);res.json({ status: true, data: { mode: conf.mode, message: 'Razorpay authenticated these saved credentials. No payment was created.' } });}));
  router.post('/gateway/import-csv', auth, owner, (_req, res) => res.status(410).json({ status: false, error: 'Use the separate Test and Live credential forms. CSV import cannot overwrite the active configuration.' }));
  router.post('/gateway/test-checkout/order', auth, owner, handle(async (req, res) => {
    const conf = await readGateway(db, 'test');if (!conf.keyId.startsWith('rzp_test_') || !conf.keySecret) throw Error('Save Test credentials first.');
    const recent = await db.prepare('SELECT created_at FROM gateway_diagnostic_orders WHERE admin_id=? ORDER BY created_at DESC LIMIT 1').get(req.admin.id);if (recent && Date.now() - Date.parse(recent.created_at) < 10000) throw Error('Wait a few seconds before starting another test.');
    const id = 'diag_' + crypto.randomUUID(),order = await clientFor(conf).orders.create({ amount: 100, currency: 'INR', receipt: id.slice(0, 40), notes: { purpose: 'admin_gateway_diagnostic' } });
    await db.prepare('INSERT INTO gateway_diagnostic_orders(id,admin_id,provider_order_id,amount_paise,status,created_at) VALUES (?,?,?,?,?,?)').run(id, req.admin.id, order.id, 100, 'created', new Date().toISOString());
    res.json({ status: true, data: { id, keyId: conf.keyId, razorpayOrderId: order.id, amountPaise: 100, currency: 'INR', merchantName: conf.merchantName, logoUrl: new URL(conf.logoUrl, conf.publicOrigin).href, mode: 'test' } });
  }));
  router.post('/gateway/test-checkout/verify', auth, owner, handle(async (req, res) => {
    const row = await db.prepare('SELECT * FROM gateway_diagnostic_orders WHERE id=? AND admin_id=?').get(req.body.id, req.admin.id);if (!row) throw Error('Test order not found.');
    const conf = await readGateway(db, 'test'),order = { razorpay_order_id: row.provider_order_id, amount: row.amount_paise / 100, currency: 'INR' };
    assertCheckoutSignature(order, req.body, conf.keySecret);const payment = await clientFor(conf).payments.fetch(req.body.razorpayPaymentId);assertCapturedPayment(order, payment);
    await db.prepare('UPDATE gateway_diagnostic_orders SET status=?,payment_id=?,verified_at=? WHERE id=?').run('verified', payment.id, new Date().toISOString(), row.id);
    await audit(req.admin.id, req.admin.full_name, 'GATEWAY_SANDBOX_VERIFIED', 'gateway_diagnostic_orders', row.id, {});
    res.json({ status: true, data: { message: 'Sandbox checkout and server verification succeeded. No membership was granted and no real money was charged.' } });
  }));
}
