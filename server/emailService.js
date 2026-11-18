/**
 * AYURVEDASIDHI HOSTINGER EMAIL SERVICE
 * High-performance, secure SMTP transport engine for Hostinger Business Email.
 * Outgoing mailbox: noreply@ayurvedasidhi.com (Port 465 SSL/TLS)
 */

import nodemailer from 'nodemailer';
import { db } from './db.js';
import { DEFAULT_EMAIL_TEMPLATES, emailBrandVariables } from './defaultEmailTemplates.js';

// Configuration defaults confirmed with Hostinger Webmail
const DEFAULT_SMTP_HOST = 'smtp.hostinger.com';
const DEFAULT_SMTP_PORT = 465;
const DEFAULT_SMTP_USER = 'noreply@ayurvedasidhi.com';
const DEFAULT_FROM_NAME = 'Pratyaksh Ayurveda';
const DEFAULT_FROM_EMAIL = 'noreply@ayurvedasidhi.com';

/**
 * Sanitize error message to prevent leaking secrets, internal file paths, or auth exchange tokens
 */
export function sanitizeEmailError(error) {
  if (!error) return null;
  const msg = typeof error === 'string' ? error : error.message || 'SMTP Connection Error';
  // Strip out any passwords, tokens, auth headers
  return msg.
  replace(/[a-zA-Z0-9_\-]{24,}/g, '[REDACTED_TOKEN]').
  replace(/auth.*?:.*?(\s|$)/gi, 'auth:[REDACTED] ').
  replace(/password.*?:.*?(\s|$)/gi, 'password:[REDACTED] ').
  replace(/[\r\n]+/g, ' ').
  trim();
}

/**
 * Redact sensitive 4-8 digit OTP codes from stored body previews
 */
export function redactSensitiveBody(body) {
  if (!body) return '';
  // Redact numeric codes
  return body.
  replace(/\b\d{4,8}\b/g, '[REDACTED_CODE]').
  slice(0, 1000);
}

/**
 * Validate email address format and disallow CRLF header injection
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (/[\r\n\0]/.test(email)) return false; // Header injection protection
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * HTML Escape helper for safe variable substitution
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).
  replace(/&/g, '&amp;').
  replace(/</g, '&lt;').
  replace(/>/g, '&gt;').
  replace(/"/g, '&quot;').
  replace(/'/g, '&#39;');
}

/**
 * Safely interpolate {{variable}} tokens into template string
 */
export function interpolateVariables(templateStr, vars = {}) {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return vars[key] !== undefined ? escapeHtml(vars[key]) : `{{${key}}}`;
  });
}

/**
 * Safely interpolate variables for plain text (no HTML escaping)
 */
export function interpolateTextVariables(templateStr, vars = {}) {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
  });
}

const OTP_TEMPLATE_KEYS = new Set(['email_verification_otp','login_otp','admin_login_otp','password_recovery_otp']);

// Also covers saved templates created before notification subjects included codes.
// Actual SMTP subjects contain the requested code; stored email logs remain redacted.
export function authenticationEmailSubject(templateKey, subject, code) {
  if (!OTP_TEMPLATE_KEYS.has(templateKey)) return subject;
  if (!/^\d{6}$/.test(String(code))) throw new Error('A valid six-digit authentication code is required.');
  return subject.startsWith(String(code)) ? subject : `${code} - ${subject}`;
}

/** Render the current admin-managed template so auth mail stays in sync with Email Center edits. */
export async function renderEmailTemplate(templateKey, variables = {}, database = db) {
  const template = await database.prepare(`
    SELECT template_key, subject, html_body, text_body, enabled
    FROM email_templates
    WHERE template_key = ?
  `).get(templateKey);

  if (!template) throw new Error(`Required email template "${templateKey}" is not configured in Admin Email Center.`);
  if (!template.enabled) throw new Error(`Required email template "${templateKey}" is disabled in Admin Email Center.`);

  const values = { ...variables, ...emailBrandVariables() };
  const rendered = {
    subject: authenticationEmailSubject(templateKey, interpolateTextVariables(template.subject, values), values.otp_code),
    html: interpolateVariables(template.html_body, values),
    text: interpolateTextVariables(template.text_body, values)
  };
  if (Object.values(rendered).some((value) => /\{\{\s*[a-zA-Z0-9_]+\s*\}\}/.test(value))) {
    throw new Error(`Email template "${templateKey}" has missing variables. Check its configuration in Email Centre.`);
  }
  if (/[\r\n]/.test(rendered.subject)) throw new Error('Email subject must be a single line.');
  return rendered;
}

/**
 * Get current SMTP configuration
 * Reads database settings merged with environment secrets
 */
export async function getSmtpConfig() {
  let dbSettings = null;
  try {
    dbSettings = await db.prepare('SELECT * FROM email_settings WHERE id = ?').get('default_settings');
  } catch (err) {

    // If table doesn't exist yet, fallback to defaults
  }
  const host = process.env.SMTP_HOST || dbSettings?.smtp_host || DEFAULT_SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || dbSettings?.smtp_port || DEFAULT_SMTP_PORT, 10);
  const secure = process.env.SMTP_SECURE !== 'false' && port === 465;
  const username = process.env.SMTP_USER || dbSettings?.smtp_username || DEFAULT_SMTP_USER;
  const password = process.env.SMTP_PASSWORD || '';
  const fromName = process.env.SMTP_FROM_NAME || dbSettings?.sender_name || DEFAULT_FROM_NAME;
  const fromEmail = process.env.SMTP_FROM_EMAIL || dbSettings?.sender_email || DEFAULT_FROM_EMAIL;

  return {
    provider: 'Hostinger Email',
    host,
    port,
    secure,
    security: secure ? 'SSL/TLS' : 'STARTTLS',
    username,
    fromName,
    fromEmail,
    passwordConfigured: Boolean(password && password.trim().length > 0),
    passwordStatus: Boolean(password && password.trim().length > 0) ? 'Configured' : 'Missing',
    lastVerifiedAt: dbSettings?.last_verified_at || null,
    lastVerificationStatus: dbSettings?.last_verification_status || 'Not Verified',
    lastVerificationError: dbSettings?.last_verification_error || null,
    rawPassword: password // Only accessed internally by Nodemailer transport
  };
}

/**
 * Create or reuse configured Nodemailer Transporter
 */
export async function createSmtpTransporter() {
  const config = await getSmtpConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for port 465 implicit TLS
    auth: {
      user: config.username,
      pass: config.rawPassword
    },
    tls: {
      rejectUnauthorized: true, // TLS validation strictly enforced
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000, // 10s timeout
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

/**
 * Verify Hostinger SMTP Connection and Authentication
 */
export async function verifySmtpConnection() {
  const config = await getSmtpConfig();
  const now = new Date().toISOString();

  if (!config.passwordConfigured) {
    const errorMsg = 'SMTP_PASSWORD environment variable is not configured on the server. Set SMTP_PASSWORD in server environment.';
    try {
      await db.prepare(`
        UPDATE email_settings 
        SET last_verified_at = ?, last_verification_status = 'Authentication Failed', last_verification_error = ?, updated_at = ?
        WHERE id = 'default_settings'
      `).run(now, errorMsg, now);
    } catch (e) {}

    return {
      success: false,
      status: 'Authentication Failed',
      message: errorMsg,
      timestamp: now,
      host: config.host,
      port: config.port,
      user: config.username
    };
  }

  try {
    const transporter = await createSmtpTransporter();
    await transporter.verify();

    try {
      await db.prepare(`
        UPDATE email_settings 
        SET last_verified_at = ?, last_verification_status = 'Connection Verified', last_verification_error = NULL, updated_at = ?
        WHERE id = 'default_settings'
      `).run(now, now);
    } catch (e) {}

    return {
      success: true,
      status: 'Connection Verified',
      message: `Successfully connected and authenticated with Hostinger SMTP (${config.host}:${config.port} via SSL/TLS).`,
      timestamp: now,
      host: config.host,
      port: config.port,
      user: config.username
    };
  } catch (err) {
    const sanitized = sanitizeEmailError(err);
    try {
      await db.prepare(`
        UPDATE email_settings 
        SET last_verified_at = ?, last_verification_status = 'Connection Error', last_verification_error = ?, updated_at = ?
        WHERE id = 'default_settings'
      `).run(now, sanitized, now);
    } catch (e) {}

    return {
      success: false,
      status: 'Connection Error',
      message: `SMTP Verification Failed: ${sanitized}`,
      timestamp: now,
      host: config.host,
      port: config.port,
      user: config.username,
      rawCode: err.code || 'UNKNOWN'
    };
  }
}

/**
 * Send an email via Hostinger SMTP and record authoritatively in MySQL email_logs
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  templateKey = 'custom_compose',
  isTest = false,
  adminId = 'admin_system'
}) {
  const now = new Date().toISOString();
  const logId = `eml_log_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // 1. Validation
  if (!isValidEmail(to)) {
    throw new Error(`Invalid recipient email address: "${to}". Please provide a valid email format.`);
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    throw new Error('Email subject is required.');
  }

  // Prevent CRLF injection in subject
  if (/[\r\n]/.test(subject)) {
    throw new Error('Email subject must not contain carriage return or line feed characters.');
  }

  if (!html && !text) {
    throw new Error('Email message body is required.');
  }

  const config = await getSmtpConfig();

  // Create initial log record in Pending state
  const cleanPreview = redactSensitiveBody(text || html);
  try {
    await db.prepare(`
      INSERT INTO email_logs (id, recipient, subject, template_key, message_id, submission_status, sanitized_error, body_preview, created_at, submitted_at)
      VALUES (?, ?, ?, ?, NULL, 'Pending', NULL, ?, ?, NULL)
    `).run(logId, to.trim(), redactSensitiveBody(subject.trim()), templateKey, cleanPreview, now);
  } catch (err) {
    console.error('Failed to create initial email_log record:', err);
  }

  // Check if SMTP password is set
  if (!config.passwordConfigured) {
    const errorMsg = 'SMTP_PASSWORD server environment variable is not configured. Unable to authenticate with Hostinger SMTP.';
    try {
      await db.prepare(`
        UPDATE email_logs 
        SET submission_status = 'Failed', sanitized_error = ?, submitted_at = ?
        WHERE id = ?
      `).run(errorMsg, now, logId);
    } catch (e) {}

    return {
      success: false,
      logId,
      status: 'Failed',
      error: errorMsg,
      recipient: to,
      subject
    };
  }

  // 2. Real SMTP Transmission
  try {
    const transporter = await createSmtpTransporter();

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: to.trim(),
      subject: subject.trim(),
      html: html || undefined,
      text: text || (html ? html.replace(/<[^>]+>/g, ' ').trim() : '')
    };

    const info = await transporter.sendMail(mailOptions);
    const submittedTime = new Date().toISOString();

    // 3. Record authoritative SMTP Accepted status
    // Important: Hostinger SMTP acceptance confirms server dispatch, NOT mailbox receipt
    try {
      await db.prepare(`
        UPDATE email_logs 
        SET message_id = ?, submission_status = 'SMTP Accepted', sanitized_error = NULL, submitted_at = ?
        WHERE id = ?
      `).run(info.messageId || `msg_${Date.now()}`, submittedTime, logId);
    } catch (e) {
      console.error('Failed to update email_log status:', e);
    }

    return {
      success: true,
      logId,
      status: 'SMTP Accepted',
      messageId: info.messageId,
      recipient: to,
      subject,
      submittedAt: submittedTime,
      response: info.response || '250 OK'
    };
  } catch (err) {
    const sanitized = sanitizeEmailError(err);
    const failedTime = new Date().toISOString();

    try {
      await db.prepare(`
        UPDATE email_logs 
        SET submission_status = 'Failed', sanitized_error = ?, submitted_at = ?
        WHERE id = ?
      `).run(sanitized, failedTime, logId);
    } catch (e) {}

    return {
      success: false,
      logId,
      status: 'Failed',
      error: sanitized,
      recipient: to,
      subject,
      failedAt: failedTime,
      code: err.code || 'SMTP_ERROR'
    };
  }
}

/**
 * Get Email Center Overview statistics directly from actual MySQL records
 */
export async function getEmailOverviewStats() {
  const config = await getSmtpConfig();
  const todayPrefix = new Date().toISOString().slice(0, 10);

  let totalSubmitted = 0;
  let smtpAccepted = 0;
  let failed = 0;
  let pending = 0;
  let sentToday = 0;
  let recentLogs = [];

  try {
    totalSubmitted = (await db.prepare('SELECT COUNT(*) as count FROM email_logs').get())?.count || 0;
    smtpAccepted = (await db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE submission_status = 'SMTP Accepted'").get())?.count || 0;
    failed = (await db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE submission_status = 'Failed'").get())?.count || 0;
    pending = (await db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE submission_status = 'Pending'").get())?.count || 0;
    sentToday = (await db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE created_at LIKE ?").get(`${todayPrefix}%`))?.count || 0;

    recentLogs = (await db.prepare(`
      SELECT id, recipient, subject, template_key, message_id, submission_status, sanitized_error, created_at, submitted_at
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT 6
    `).all()) || [];
  } catch (err) {
    console.error('Error querying email_logs stats:', err);
  }

  return {
    smtpStatus: {
      provider: config.provider,
      host: config.host,
      port: config.port,
      security: config.security,
      username: config.username,
      senderName: config.fromName,
      senderEmail: config.fromEmail,
      passwordConfigured: config.passwordConfigured,
      passwordStatus: config.passwordStatus,
      lastVerifiedAt: config.lastVerifiedAt,
      lastVerificationStatus: config.lastVerificationStatus,
      lastVerificationError: config.lastVerificationError
    },
    activity: {
      totalSubmitted,
      smtpAccepted,
      failed,
      pending,
      sentToday
    },
    recentLogs
  };
}

/**
 * Get paginated and filtered Sent Emails
 */
export async function getSentEmails({ page = 1, limit = 15, recipient = '', status = '', templateKey = '', search = '' }) {
  const offset = (Math.max(1, page) - 1) * limit;
  let whereClauses = [];
  let params = [];

  if (recipient && recipient.trim()) {
    whereClauses.push('recipient LIKE ?');
    params.push(`%${recipient.trim()}%`);
  }

  if (status && status.trim() && status !== 'all') {
    whereClauses.push('submission_status = ?');
    params.push(status.trim());
  }

  if (templateKey && templateKey.trim() && templateKey !== 'all') {
    whereClauses.push('template_key = ?');
    params.push(templateKey.trim());
  }

  if (search && search.trim()) {
    whereClauses.push('(recipient LIKE ? OR subject LIKE ? OR message_id LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let total = 0;
  let items = [];

  try {
    total = (await db.prepare(`SELECT COUNT(*) as count FROM email_logs ${whereSql}`).get(...params))?.count || 0;
    items = (await db.prepare(`
      SELECT id, recipient, subject, template_key, message_id, submission_status, sanitized_error, body_preview, created_at, submitted_at
      FROM email_logs
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset)) || [];
  } catch (err) {
    console.error('Error in getSentEmails:', err);
  }

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Seed default email templates if table is empty
 */
export async function seedEmailTemplatesIfEmpty() {
  try {
    const count = (await db.prepare('SELECT COUNT(*) as count FROM email_templates').get())?.count || 0;
    if (count === 0) {
      console.log('Seeding 8 canonical Ayurvedasidhi email templates...');
      const insert = db.prepare(`
        INSERT INTO email_templates (id, template_key, name, category, subject, html_body, text_body, variables_json, enabled, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `);

      const now = new Date().toISOString();
      for (const t of DEFAULT_EMAIL_TEMPLATES) {
        await insert.run(
          `tpl_${t.template_key}`,
          t.template_key,
          t.name,
          t.category,
          t.subject,
          t.html_body,
          t.text_body,
          t.variables_json,
          now
        );
      }
      console.log('Successfully seeded 8 email templates.');
    }
  } catch (err) {
    console.error('Error seeding email templates:', err);
  }
}
