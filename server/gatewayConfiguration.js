import { asyncMap } from "./asyncCollections.js";import { encryptSecret, decryptSecret } from './gatewayVault.js';
export const MODES = ['test', 'live'];
export function assertMode(mode) {if (!MODES.includes(mode)) throw Error('Choose Test or Live mode.');return mode;}
export function publicOrigin(value) {const url = new URL(value);if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Enter your public HTTPS website/API origin, without a path.');return url.origin;}
export async function initializeGatewayProfiles(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS gateway_profiles(mode TEXT PRIMARY KEY,key_id TEXT NOT NULL DEFAULT '',key_secret TEXT NOT NULL DEFAULT '',webhook_secret TEXT NOT NULL DEFAULT '',verified_at TEXT,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS gateway_diagnostic_orders(id TEXT PRIMARY KEY,admin_id TEXT NOT NULL,provider_order_id TEXT UNIQUE,amount_paise INTEGER NOT NULL,status TEXT NOT NULL,payment_id TEXT,created_at TEXT NOT NULL,verified_at TEXT);
 CREATE TABLE IF NOT EXISTS gateway_webhook_receipts(event_id TEXT PRIMARY KEY,mode TEXT NOT NULL,event_type TEXT NOT NULL,received_at TEXT NOT NULL);`);
  const row = await db.prepare("SELECT * FROM payment_settings WHERE id='default_settings'").get();
  const firstMigration = (await db.prepare('SELECT COUNT(*) AS n FROM gateway_profiles').get()).n === 0;
  if (firstMigration) {
    const legacyMode = (row?.gateway_key_id || process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_live_') ? 'live' : 'test';
    for (const order of await db.prepare("SELECT id,metadata FROM payment_orders WHERE provider='razorpay'").all()) {
      let metadata;try {metadata = JSON.parse(order.metadata || '{}');} catch {continue;}
      if (!metadata.gatewayMode) await db.prepare('UPDATE payment_orders SET metadata=? WHERE id=?').run(JSON.stringify({ ...metadata, gatewayMode: legacyMode }), order.id);
    }
  }
  for (const mode of MODES) {const legacyId = row?.gateway_key_id || process.env.RAZORPAY_KEY_ID || '';const matches = legacyId.startsWith('rzp_' + mode + '_');const secret = matches ? row?.gateway_key_secret || '' : '';const hook = matches ? row?.gateway_webhook_secret || '' : '';
    await db.prepare('INSERT OR IGNORE INTO gateway_profiles(mode,key_id,key_secret,webhook_secret,updated_at) VALUES (?,?,?,?,?)').run(mode, matches ? legacyId : '', secret || (matches && process.env.RAZORPAY_KEY_SECRET ? encryptSecret(process.env.RAZORPAY_KEY_SECRET) : ''), hook || (matches && process.env.RAZORPAY_WEBHOOK_SECRET ? encryptSecret(process.env.RAZORPAY_WEBHOOK_SECRET) : ''), new Date().toISOString());}
}
export async function readGateway(db, mode) {
  const row = await db.prepare("SELECT * FROM payment_settings WHERE id='default_settings'").get();
  mode = assertMode(mode || row?.gateway_mode || 'test');const profile = await db.prepare('SELECT * FROM gateway_profiles WHERE mode=?').get(mode);
  const origin = publicOrigin(process.env.PAYMENT_PUBLIC_ORIGIN || row?.webhook_url?.match(/^https:\/\/[^/]+/)?.[0] || 'https://pratyakshayurveda.in');
  const keyId = profile?.key_id || '',keySecret = decryptSecret(profile?.key_secret || ''),webhookSecret = decryptSecret(profile?.webhook_secret || '');
  return { provider: 'razorpay', keyId, keySecret, webhookSecret, mode, gatewayEnabled: Boolean(row?.gateway_enabled && keyId && keySecret), autoActivate: Boolean(row?.auto_activate_membership), merchantName: row?.merchant_display_name || 'Pratyaksh Ayurveda', logoUrl: row?.merchant_logo_url || '/assets/website-assets/img/logo-round.svg', supportEmail: row?.support_email || '', supportPhone: row?.support_phone || '+91 8795776006', webhookUrl: `${origin}/api/payment/razorpay/webhook/${mode}`, publicOrigin: origin, updatedAt: row?.updated_at };
}
export async function safeGateway(db) {
  const config = await readGateway(db);const profiles = Object.fromEntries(await asyncMap(MODES, async (mode) => {const p = await db.prepare('SELECT * FROM gateway_profiles WHERE mode=?').get(mode);return [mode, { mode, keyId: p.key_id, hasKeySecret: Boolean(p.key_secret), hasWebhookSecret: Boolean(p.webhook_secret), verifiedAt: p.verified_at, configured: Boolean(p.key_id && p.key_secret), webhookUrl: `${config.publicOrigin}/api/payment/razorpay/webhook/${mode}` }];}));
  const last = await db.prepare('SELECT mode,event_type,received_at FROM gateway_webhook_receipts ORDER BY received_at DESC LIMIT 1').get();
  return { mode: config.mode, gatewayEnabled: config.gatewayEnabled, autoActivate: config.autoActivate, merchantName: config.merchantName, logoUrl: config.logoUrl, supportEmail: config.supportEmail, supportPhone: config.supportPhone, publicOrigin: config.publicOrigin, profiles, lastWebhook: last || null };
}
export async function saveGatewayProfile(db, mode, input) {
  assertMode(mode);const current = await db.prepare('SELECT * FROM gateway_profiles WHERE mode=?').get(mode);const id = input.keyId === undefined ? current.key_id : String(input.keyId).trim();
  if (!new RegExp('^rzp_' + mode + '_[a-zA-Z0-9]+$').test(id)) throw Error(`Enter a valid Razorpay ${mode} Key ID.`);
  if (input.keySecret !== undefined && (typeof input.keySecret !== 'string' || input.keySecret.length < 8 || input.keySecret.length > 256 || /[\s•]/.test(input.keySecret))) throw Error('Enter the complete new Key Secret, or leave it blank to retain the saved one.');
  if (id !== current.key_id && !input.keySecret) throw Error('Changing the Key ID also requires its matching Key Secret.');
  const secret = input.keySecret ? encryptSecret(input.keySecret) : current.key_secret;if (!secret) throw Error('A Key Secret is required.');
  if (input.webhookSecret !== undefined && (typeof input.webhookSecret !== 'string' || input.webhookSecret.length < 16 || input.webhookSecret.length > 256)) throw Error('Use a webhook secret of 16–256 characters.');
  await db.prepare('UPDATE gateway_profiles SET key_id=?,key_secret=?,webhook_secret=?,verified_at=NULL,updated_at=? WHERE mode=?').run(id, secret, input.webhookSecret ? encryptSecret(input.webhookSecret) : current.webhook_secret, new Date().toISOString(), mode);
}
