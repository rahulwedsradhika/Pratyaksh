import { installGatewayAdmin } from './gatewayAdmin.js';
import { requirePricingAdmin, money, positiveInteger, couponInput } from './membershipPricing.js';
import { getAdminOverview } from './adminAnalytics.js';
import { studentSummary, studentDetail } from './adminStudentData.js';
import express from 'express';
import {consumeOneTimeCode} from './oneTimeCodes.js';
import {installCurriculumAdmin} from './curriculumAdmin.js';
import crypto from 'crypto';
import { db, calculateCalendarExpiry } from './db.js';
import {
  getSmtpConfig,
  verifySmtpConnection,
  sendEmail,
  getEmailOverviewStats,
  getSentEmails,
  interpolateVariables,
  interpolateTextVariables,
  isValidEmail,
  sanitizeEmailError,
  renderEmailTemplate } from
'./emailService.js';
import { DEFAULT_EMAIL_TEMPLATES, emailBrandVariables } from './defaultEmailTemplates.js';
import {
  getGoogleAuthSettings,
  updateGoogleAuthSettings,
  validateGoogleClientId,
  verifyGoogleIdToken,
  recordGoogleTestResult,
  getRecentAuthActivity,
  getRuntimeEnvironment } from
'./googleAuthService.js';
import {
  getGatewaySettings,
  testRazorpayConnection } from
'./razorpayService.js';

export const adminRouter = express.Router();
installCurriculumAdmin(adminRouter,db,requireAdminAuth,requirePricingAdmin);

const OWNER_EMAIL = (process.env.OWNER_EMAIL || (process.env.NODE_ENV!=='production'&&process.env.APP_ENV!=='production'?'mukeshk65018@gmail.com':'')).toLowerCase();
const ADMIN_OTP_PURPOSE = 'admin_login';

function authSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') throw new Error('AUTH_SESSION_SECRET must be configured for admin authentication.');
  return secret || 'local-development-session-secret-change-before-production';
}

function digest(value) {
  return crypto.createHmac('sha256', authSecret()).update(String(value)).digest();
}

async function issueAdminSession(admin, req) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
  await db.prepare('INSERT INTO admin_sessions (id, admin_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').
  run(`admin_session_${crypto.randomUUID()}`, admin.id, digest(token).toString('hex'), expiresAt, now.toISOString());
  await db.prepare('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now.toISOString(), now.toISOString(), admin.id);
  await recordAuditLog(admin.id, admin.full_name, 'ADMIN_LOGIN', 'admin_users', admin.id, { email: admin.email, role: admin.role }, req.ip);
  return { token, expiresAt };
}

function publicAdmin(admin) {
  const permissions = {
    canManageStudents: ['super_admin', 'admissions_staff'].includes(admin.role),
    canManagePlans: admin.role === 'super_admin',
    canManageFinances: ['super_admin', 'finance_staff'].includes(admin.role),
    canManageIntegrations: admin.role === 'super_admin'
  };
  return {
    id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role,
    avatar_url: admin.avatar_url, phone: admin.phone || '', address: admin.address || '',
    onboarding_complete: Boolean(admin.onboarding_complete),
    onboardingComplete: Boolean(admin.onboarding_complete), permissions
  };
}

async function requireAdminSession(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : '';
  if (!token || token.length < 32) return res.status(401).json({ status: false, error: 'A valid admin session is required.' });
  try {
    const admin = await db.prepare(`
      SELECT u.*, s.id AS session_id FROM admin_sessions s
      JOIN admin_users u ON u.id = s.admin_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND u.is_active = 1
      LIMIT 1
    `).get(digest(token).toString('hex'), new Date().toISOString());
    if (!admin) return res.status(401).json({ status: false, error: 'Admin session is expired or revoked.' });
    req.admin = admin;
    req.adminSessionId = admin.session_id;
    next();
  } catch (error) {
    return res.status(500).json({ status: false, error: 'Unable to validate the admin session.' });
  }
}

function requireOnboardedAdmin(req, res, next) {
  if (!req.admin.onboarding_complete) return res.status(403).json({ status: false, code: 'ADMIN_ONBOARDING_REQUIRED', error: 'Complete your admin profile to continue.' });
  next();
}

function requireOwner(req, res, next) {
  if (req.admin.email?.toLowerCase() !== OWNER_EMAIL || req.admin.role !== 'super_admin') {
    return res.status(403).json({ status: false, error: 'Only the designated superadmin can manage administrator access.' });
  }
  next();
}

/**
 * Admin Authentication Middleware
 */
export async function requireAdminAuth(req, res, next) {
  await requireAdminSession(req, res, () => requireOnboardedAdmin(req, res, next));
}

/**
 * Helper to record admin audit logs
 */
async function recordAuditLog(adminId, adminName, action, entityType, entityId, details, ip = '127.0.0.1') {
  try {
    await db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, admin_name, action, entity_type, entity_id, details_json, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      adminId,
      adminName,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
      ip,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}

// ============================================================================
// 1. ADMIN AUTHENTICATION & SESSION
// ============================================================================

// Admin access is invite-only. OTP and Google are the only supported sign-in methods.
adminRouter.post('/auth/login', (_req, res) => res.status(410).json({ status: false, error: 'Password based admin sign-in has been retired. Use email OTP or Google.' }));

adminRouter.post('/auth/otp/send', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) return res.status(400).json({ status: false, error: 'Enter a valid administrator email.' });
    const admin = await db.prepare('SELECT * FROM admin_users WHERE lower(email) = ? AND is_active = 1').get(email);
    if (!admin) return res.status(403).json({ status: false, error: 'This email is not authorized for administrator access.' });
    const now = new Date().toISOString();
    const recent = await db.prepare('SELECT created_at FROM student_otps WHERE lower(email) = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1').get(email, ADMIN_OTP_PURPOSE);
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 45_000) return res.status(429).json({ status: false, error: 'Wait before requesting another code.' });
    const code = crypto.randomInt(100000, 1000000).toString();
    const id = `admin_otp_${crypto.randomUUID()}`;
    const template = await renderEmailTemplate('admin_login_otp', { student_name: admin.full_name || email.split('@')[0], otp_code: code, expiry_minutes: '10' });
    const sent = await sendEmail({ to: email, ...template, templateKey: 'admin_login_otp' });
    if (!sent.success) {
      console.error('[ADMIN OTP] Delivery failed:', sanitizeEmailError(sent.error || sent.status || 'SMTP rejected the message'));
      return res.status(503).json({ status: false, error: 'The verification email could not be sent. Please try again later.' });
    }
    await db.prepare('INSERT INTO student_otps (id, email, otp_code, purpose, attempts, expires_at, created_at) VALUES (?, ?, ?, ?, 0, ?, ?)').
    run(id, email, digest(code).toString('hex'), ADMIN_OTP_PURPOSE, new Date(Date.now() + 10 * 60_000).toISOString(), now);
    return res.json({ status: true, message: `A sign-in code was sent to ${email}.`, expiresInMinutes: 10 });
  } catch (err) {
    console.error('[ADMIN OTP] Request failed:', sanitizeEmailError(err));
    return res.status(500).json({ status: false, error: 'Unable to send the administrator sign-in code.' });
  }
});

adminRouter.post('/auth/otp/verify', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) return res.status(400).json({ status: false, error: 'Enter your email and 6-digit code.' });
    const otp = await db.prepare('SELECT * FROM student_otps WHERE lower(email) = ? AND purpose = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1').get(email, ADMIN_OTP_PURPOSE);
    if (!otp || new Date(otp.expires_at).getTime() <= Date.now() || otp.attempts >= 5) return res.status(400).json({ status: false, error: 'The code is invalid or expired. Request a new code.' });
    const expected = Buffer.from(otp.otp_code, 'hex');
    const actual = digest(code);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      await db.prepare('UPDATE student_otps SET attempts = attempts + 1 WHERE id = ?').run(otp.id);
      return res.status(400).json({ status: false, error: 'The code is invalid or expired. Request a new code.' });
    }
    const admin = await db.prepare('SELECT * FROM admin_users WHERE lower(email) = ? AND is_active = 1').get(email);
    if (!admin) return res.status(403).json({ status: false, error: 'This administrator account is inactive.' });
    if(!await consumeOneTimeCode(db,otp.id))return res.status(400).json({status:false,error:'The code has already been used or expired.'});
    const session = await issueAdminSession(admin, req);
    return res.json({ status: true, token: session.token, expiresAt: session.expiresAt, admin: publicAdmin(admin) });
  } catch (err) {
    return res.status(500).json({ status: false, error: 'Unable to verify the administrator sign-in code.' });
  }
});

adminRouter.post('/auth/google', async (req, res) => {
  try {
    const credential = String(req.body.credential || req.body.idToken || '').trim();
    if (!credential) return res.status(400).json({ status: false, error: 'Google credential is required.' });
    const verified = await verifyGoogleIdToken(credential);
    const email = String(verified.email || '').trim().toLowerCase();
    if (!verified.emailVerified || !email) return res.status(401).json({ status: false, error: 'Google account email could not be verified.' });
    const admin = await db.prepare('SELECT * FROM admin_users WHERE lower(email) = ? AND is_active = 1').get(email);
    if (!admin) return res.status(403).json({ status: false, error: 'This Google account is not authorized for administrator access.' });
    const session = await issueAdminSession(admin, req);
    return res.json({ status: true, token: session.token, expiresAt: session.expiresAt, admin: publicAdmin(admin) });
  } catch (err) {
    return res.status(401).json({ status: false, error: 'Google sign-in could not be verified. Check the configured Google client ID.' });
  }
});

// GET /api/admin/auth/me
adminRouter.get('/auth/me', requireAdminSession, (req, res) => {
  res.json({ status: true, admin: publicAdmin(req.admin) });
});

adminRouter.put('/auth/profile', requireAdminSession, async (req, res) => {
  const fullName = String(req.body.full_name || req.body.name || '').trim();
  const phone = String(req.body.phone || req.body.mobile || '').trim();
  const address = String(req.body.address || '').trim();
  if (fullName.length < 2 || fullName.length > 100) return res.status(400).json({ status: false, error: 'Enter your full name.' });
  if (!/^\+?[\d\s().-]{7,20}$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) return res.status(400).json({ status: false, error: 'Enter a valid mobile number.' });
  if (address.length < 8 || address.length > 300) return res.status(400).json({ status: false, error: 'Enter your complete address.' });
  const now = new Date().toISOString();
  await db.prepare('UPDATE admin_users SET full_name = ?, phone = ?, address = ?, onboarding_complete = 1, updated_at = ? WHERE id = ?').run(fullName, phone, address, now, req.admin.id);
  const admin = await db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.id);
  await recordAuditLog(admin.id, admin.full_name, 'ADMIN_ONBOARDING_COMPLETED', 'admin_users', admin.id, {}, req.ip);
  res.json({ status: true, admin: publicAdmin(admin) });
});

// POST /api/admin/auth/logout
adminRouter.post('/auth/logout', requireAdminSession, async (req, res) => {
  await db.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(new Date().toISOString(), req.adminSessionId);
  await recordAuditLog(req.admin.id, req.admin.full_name, 'ADMIN_LOGOUT', 'admin_users', req.admin.id, {});
  res.json({ status: true, message: 'Logged out successfully' });
});

adminRouter.get('/admins', requireAdminAuth, requireOwner, async (_req, res) => {
  const admins = (await db.prepare(`
    SELECT id, email, full_name, role, is_active, phone, address, onboarding_complete, last_login_at, created_at
    FROM admin_users ORDER BY created_at DESC
  `).all()).map((admin) => ({ ...admin, is_active: Boolean(admin.is_active), onboarding_complete: Boolean(admin.onboarding_complete) }));
  res.json({ status: true, admins });
});

adminRouter.post('/admins', requireAdminAuth, requireOwner, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const role = String(req.body.role || 'support_staff').trim();
  if (!isValidEmail(email) || !email.endsWith('@gmail.com')) return res.status(400).json({ status: false, error: 'Enter a valid Gmail address for the administrator invite.' });
  if (!['finance_staff', 'admissions_staff', 'support_staff'].includes(role)) return res.status(400).json({ status: false, error: 'Choose a supported staff role.' });
  const existing = await db.prepare('SELECT id, is_active FROM admin_users WHERE lower(email) = ?').get(email);
  if (existing?.is_active) return res.status(409).json({ status: false, error: 'An active administrator already uses this email.' });
  const now = new Date().toISOString();
  const id = existing?.id || `admin_${crypto.randomUUID()}`;
  if (existing) {
    await db.prepare(`UPDATE admin_users SET password_hash = '', full_name = 'Profile setup required', role = ?, is_active = 1, phone = '', address = '', onboarding_complete = 0, updated_at = ? WHERE id = ?`).run(role, now, id);
    await db.prepare('UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, ?) WHERE admin_id = ?').run(now, id);
  } else {
    await db.prepare(`INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, mfa_enabled, phone, address, onboarding_complete, created_at, updated_at)
      VALUES (?, ?, '', 'Profile setup required', ?, 1, 0, '', '', 0, ?, ?)`).run(id, email, role, now, now);
  }
  await recordAuditLog(req.admin.id, req.admin.full_name, 'ADMIN_INVITED', 'admin_users', id, { email, role }, req.ip);
  res.status(201).json({ status: true, message: 'Administrator invited. They can now sign in with Google or email OTP and complete onboarding.', id, email, role });
});

adminRouter.delete('/admins/:id', requireAdminAuth, requireOwner, async (req, res) => {
  const target = await db.prepare('SELECT id, email, full_name FROM admin_users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ status: false, error: 'Administrator not found.' });
  if (target.email.toLowerCase() === OWNER_EMAIL || target.id === req.admin.id) return res.status(400).json({ status: false, error: 'The owner account cannot be revoked.' });
  const now = new Date().toISOString();
  await db.prepare('UPDATE admin_users SET is_active = 0, updated_at = ? WHERE id = ?').run(now, target.id);
  await db.prepare('UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, ?) WHERE admin_id = ?').run(now, target.id);
  await recordAuditLog(req.admin.id, req.admin.full_name, 'ADMIN_ACCESS_REVOKED', 'admin_users', target.id, { email: target.email }, req.ip);
  res.json({ status: true, message: 'Administrator access revoked.' });
});

// ============================================================================
// 2. DASHBOARD ANALYTICS OVERVIEW
// ============================================================================

// GET /api/admin/analytics/overview
adminRouter.get('/analytics/overview', requireAdminAuth, async (req, res) => {
  try {
    res.json({ status: true, data: await getAdminOverview(db) });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 3. STUDENT DIRECTORY & PROFILE MANAGEMENT
// ============================================================================

// GET /api/admin/students
adminRouter.get('/students', requireAdminAuth, async (req, res) => {
  try {
    const { search = '', status = 'all', enrollment = req.query.enrollmentType || 'all', sort = 'newest', page = '1', limit = '10' } = req.query;

    let query = `
      SELECT s.*, 
             m.id as membership_id, m.plan_name_snapshot, m.expiry_date as membership_expiry, m.status as membership_status,
             (SELECT COUNT(*) FROM payment_orders o WHERE o.student_id = s.id) as payment_count
      FROM students s
      LEFT JOIN memberships m ON m.student_id = s.id AND m.status = 'active'
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (s.full_name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status !== 'all') {
      if (status === 'active') {
        query += ` AND m.status = 'active'`;
      } else if (status === 'expired') {
        query += ` AND (m.status = 'expired' OR (m.id IS NULL AND s.onboarding_state = 'completed'))`;
      } else if (status === 'suspended') {
        query += ` AND s.is_suspended = 1`;
      }
    }

    if (enrollment !== 'all') {
      query += ` AND s.enrollment_type = ?`;
      params.push(enrollment);
    }

    // Sort order
    if (sort === 'name') {
      query += ` ORDER BY s.full_name ASC`;
    } else if (sort === 'oldest') {
      query += ` ORDER BY s.created_at ASC`;
    } else {
      query += ` ORDER BY s.created_at DESC`;
    }

    // Total count before pagination
    let countQuery = `
      SELECT COUNT(DISTINCT s.id) as count
      FROM students s
      LEFT JOIN memberships m ON m.student_id = s.id AND m.status = 'active'
      WHERE 1=1
    `;
    const countParams = [];
    if (search) {
      countQuery += ` AND (s.full_name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)`;
      const term = `%${search}%`;
      countParams.push(term, term, term);
    }
    if (status !== 'all') {
      if (status === 'active') {
        countQuery += ` AND m.status = 'active'`;
      } else if (status === 'expired') {
        countQuery += ` AND (m.status = 'expired' OR (m.id IS NULL AND s.onboarding_state = 'completed'))`;
      } else if (status === 'suspended') {
        countQuery += ` AND s.is_suspended = 1`;
      }
    }
    if (enrollment !== 'all') {
      countQuery += ` AND s.enrollment_type = ?`;
      countParams.push(enrollment);
    }
    const countRow = await db.prepare(countQuery).get(...countParams);
    const totalCount = countRow ? countRow.count : 0;

    // Apply pagination if limit is not 'all'
    if (limit !== 'all') {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.max(1, parseInt(limit, 10) || 10);
      query += ` LIMIT ? OFFSET ?`;
      params.push(l, (p - 1) * l);
    }

    const students = (await db.prepare(query).all(...params)).map(studentSummary);
    const totalPages = limit === 'all' ? 1 : Math.max(1, Math.ceil(totalCount / (parseInt(limit, 10) || 10)));

    res.json({
      status: true,
      data: {
        students,
        pagination: {
          total: totalCount,
          page: parseInt(page, 10) || 1,
          limit: limit === 'all' ? totalCount : parseInt(limit, 10) || 10,
          pages: totalPages,
          totalPages
        }
      },
      students,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10) || 1,
        limit: limit === 'all' ? totalCount : parseInt(limit, 10) || 10,
        pages: totalPages,
        totalPages
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// GET /api/admin/students/:id
adminRouter.get('/students/:id', requireAdminAuth, async (req, res) => {
  try {
    const student = await db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) {
      return res.status(404).json({ status: false, error: 'Student not found' });
    }

    const memberships = await db.prepare('SELECT * FROM memberships WHERE student_id = ? ORDER BY created_at DESC').all(student.id);
    const orders = await db.prepare('SELECT * FROM payment_orders WHERE student_id = ? ORDER BY created_at DESC').all(student.id);

    res.json({
      status: true,
      data: studentDetail(student, memberships, orders)
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// PUT /api/admin/students/:id
adminRouter.put('/students/:id', requireAdminAuth, async (req, res) => {
  try {
    const { full_name, phone, academic_status, bams_year, exam_goal, is_suspended, admin_notes } = req.body;
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ status: false, error: 'Student not found' });
    }

    await db.prepare(`
      UPDATE students
      SET full_name = COALESCE(?, full_name),
          phone = COALESCE(?, phone),
          academic_status = COALESCE(?, academic_status),
          bams_year = COALESCE(?, bams_year),
          exam_goal = COALESCE(?, exam_goal),
          is_suspended = COALESCE(?, is_suspended),
          admin_notes = COALESCE(?, admin_notes),
          updated_at = ?
      WHERE id = ?
    `).run(full_name, phone, academic_status, bams_year, exam_goal, is_suspended, admin_notes, now, req.params.id);

    await recordAuditLog(req.admin.id, req.admin.full_name, 'STUDENT_UPDATED', 'students', req.params.id, {
      full_name, phone, is_suspended, admin_notes
    });

    res.json({ status: true, message: 'Student profile updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/students/manual-enroll
adminRouter.post('/students/manual-enroll', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  try {
    const email = req.body.email;
    const full_name = req.body.full_name || req.body.name;
    const phone = req.body.phone;
    const academic_status = req.body.academic_status || req.body.academicStatus;
    const exam_goal = req.body.exam_goal || req.body.examGoal;
    const plan_id = req.body.plan_id || req.body.planId;
    const enrollment_type = req.body.enrollment_type || req.body.enrollmentType || 'complimentary';
    const admin_notes = req.body.admin_notes || req.body.adminNotes;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ status: false, error: 'A valid email address is required' });
    }
    if (!full_name) {
      return res.status(400).json({ status: false, error: 'Full name is required' });
    }
    if (!plan_id) {
      return res.status(400).json({ status: false, error: 'Membership plan selection is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.prepare('SELECT id FROM students WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ status: false, error: `Account already exists with email: ${cleanEmail}` });
    }

    let plan = await db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(plan_id);
    if (!plan) {
      const aliasMap = {
        'samhita-scholars': 'plan_12m',
        'aiapget-fastrack': 'plan_6m',
        'bams-foundation': 'plan_3m',
        'fast-track': 'plan_1m'
      };
      const mappedId = aliasMap[plan_id] || (plan_id.includes('12') ? 'plan_12m' : plan_id.includes('6') ? 'plan_6m' : plan_id.includes('3') ? 'plan_3m' : 'plan_1m');
      plan = await db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(mappedId);
    }
    if (!plan) {
      return res.status(400).json({ status: false, error: 'Selected membership plan does not exist' });
    }

    const studentId = `stu_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const inviteToken = crypto.randomBytes(24).toString('hex');
    const now = new Date().toISOString();

    // Create student
    await db.prepare(`
      INSERT INTO students (
        id, email, password_hash, full_name, phone, academic_status, exam_goal,
        avatar_url, admin_notes, enrollment_type, invitation_token, invitation_sent_at,
        auth_provider, email_verified, onboarding_state, role, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      studentId,
      cleanEmail,
      '', // No shared default password; use the verified recovery/onboarding flow
      full_name,
      phone || '',
      academic_status || 'Enrolled Scholar',
      exam_goal || 'AIAPGET Complete',
      null,
      admin_notes || `Manually enrolled by ${req.admin.full_name} (${enrollment_type})`,
      enrollment_type,
      inviteToken,
      now,
      'invitation',
      1, // Verified by admin issuance
      'completed',
      'student',
      now,
      now
    );

    // Create active membership for the enrolled scholar
    const expiry = calculateCalendarExpiry(now, plan.duration_months);
    const membershipId = `mem_${Date.now()}`;
    const orderRef = `ORD_MANUAL_${Date.now()}`;

    await db.prepare(`
      INSERT INTO memberships (
        id, student_id, plan_id, plan_name_snapshot, price_snapshot, currency,
        duration_months, order_ref, start_date, expiry_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      membershipId,
      studentId,
      plan.id,
      plan.name,
      enrollment_type === 'complimentary' || enrollment_type === 'scholarship' ? 0 : plan.price,
      'INR',
      plan.duration_months,
      orderRef,
      now,
      expiry,
      'active',
      now,
      now
    );

    // Create completed payment order record for finance ledger
    const orderId = `ord_${Date.now()}`;
    await db.prepare(`
      INSERT INTO payment_orders (
        id, student_id, plan_id, amount, currency, status, idempotency_key, provider,
        payment_method, admin_verified_by, admin_verified_at, admin_notes,
        reconciliation_status, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      studentId,
      plan.id,
      enrollment_type === 'complimentary' || enrollment_type === 'scholarship' ? 0 : plan.price,
      'INR',
      'completed',
      `idemp_manual_${orderId}`,
      'manual_admin',
      enrollment_type,
      req.admin.id,
      now,
      `Manual enrollment: ${enrollment_type}`,
      'manual_approved',
      JSON.stringify({ enrolledBy: req.admin.full_name, enrollmentType: enrollment_type }),
      now,
      now
    );

    // Record transactional notification
    await db.prepare(`
      INSERT INTO transactional_notifications (id, recipient_email, recipient_name, template_type, subject, content_html, sent_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      cleanEmail,
      full_name,
      'invitation',
      'Welcome to Pratyaksh Ayurveda — Your Classroom Invitation',
      `<p>Namaste ${full_name},</p><p>You have been enrolled into the <strong>${plan.name}</strong>. Access your classroom using invitation token: ${inviteToken}</p>`,
      now,
      now
    );

    await recordAuditLog(req.admin.id, req.admin.full_name, 'STUDENT_MANUAL_ENROLL', 'students', studentId, {
      email: cleanEmail,
      plan: plan.name,
      enrollment_type
    });

    const invitationLink = `http://localhost:5173/#/onboarding?token=${inviteToken}`;
    res.json({
      status: true,
      message: `Student successfully enrolled under ${plan.name} (${enrollment_type})`,
      studentId,
      inviteToken,
      invitationLink,
      data: {
        studentId,
        inviteToken,
        invitationLink,
        enrollmentType: enrollment_type
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 4. MEMBERSHIP PLAN MANAGEMENT & COUPONS
// ============================================================================

// GET /api/admin/plans
adminRouter.get('/plans', requireAdminAuth, async (req, res) => {
  try {
    const plans = await db.prepare(`
      SELECT p.*,
             (SELECT COUNT(*) FROM memberships m WHERE m.plan_id = p.id AND m.status = 'active') as active_subscribers
      FROM membership_plans p
      ORDER BY p.duration_months ASC
    `).all();

    res.json({ status: true, data: plans });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/plans
adminRouter.post('/plans', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  try {
    const { id, name, tier_code, duration_months, price, badge, description, features_json, eligibility_rules, is_public = 1 } = req.body;
    if (!id || !name || !price || !duration_months) {
      return res.status(400).json({ status: false, error: 'Plan ID, name, price, and duration are required' });
    }

    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO membership_plans (
        id, duration_months, name, tier_code, price, currency, badge,
        is_active, description, features_json, eligibility_rules, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'INR', ?, 1, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      positiveInteger(duration_months, 120),
      name,
      tier_code || 'TIER',
      money(price, 1),
      badge || '',
      description || '',
      JSON.stringify(features_json || []),
      eligibility_rules || 'All Ayurveda scholars and practitioners',
      is_public ? 1 : 0,
      now,
      now
    );

    await recordAuditLog(req.admin.id, req.admin.full_name, 'PLAN_CREATED', 'membership_plans', id, { name, price });
    res.json({ status: true, message: 'Membership plan created successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// PUT /api/admin/plans/:id
adminRouter.put('/plans/:id', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  let pricingTransaction = false;
  try {
    const { name, price, badge, description, is_active, is_public } = req.body;
    const plan = await db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(req.params.id);
    if (!plan) {
      return res.status(404).json({ status: false, error: 'Plan not found' });
    }

    const now = new Date().toISOString();
    const newPrice = price !== undefined ? money(price, 1) : plan.price;
    const duration = req.body.duration_months !== undefined ? positiveInteger(req.body.duration_months, 120) : plan.duration_months;
    for (const value of [is_active, is_public]) if (value !== undefined && ![0, 1, true, false].includes(value)) return res.status(400).json({ status: false, error: 'Invalid plan visibility.' });

    for (const [key, value] of Object.entries({ name, badge, description })) if (value !== undefined && (typeof value !== 'string' || value.length > 6000)) return res.status(400).json({ status: false, error: 'Invalid plan text.' });
    await db.exec('BEGIN IMMEDIATE');pricingTransaction = true;
    // Track price change history if price altered
    if (newPrice !== plan.price) {
      await db.prepare(`
        INSERT INTO membership_plan_price_history (id, plan_id, previous_price, new_price, changed_by_admin_id, effective_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`ph_${Date.now()}`, plan.id, plan.price, newPrice, req.admin.id, now);
    }

    await db.prepare(`
      UPDATE membership_plans
      SET name = COALESCE(?, name),
          duration_months = ?,
          price = ?,
          badge = COALESCE(?, badge),
          description = COALESCE(?, description),
          is_active = COALESCE(?, is_active),
          is_public = COALESCE(?, is_public),
          updated_at = ?
      WHERE id = ?
    `).run(name ?? null, duration, newPrice, badge ?? null, description ?? null, is_active == null ? null : Number(is_active), is_public == null ? null : Number(is_public), now, plan.id);

    await db.exec('COMMIT');pricingTransaction = false;
    await recordAuditLog(req.admin.id, req.admin.full_name, 'PLAN_UPDATED', 'membership_plans', plan.id, {
      previousPrice: plan.price,
      newPrice
    });

    res.json({ status: true, message: 'Membership plan updated successfully' });
  } catch (err) {
    if (pricingTransaction) await db.exec('ROLLBACK');
    res.status(400).json({ status: false, error: err.message });
  }
});

// GET /api/admin/plans/:id/history
adminRouter.get('/plans/:id/history', requireAdminAuth, async (req, res) => {
  try {
    const history = await db.prepare(`
      SELECT ph.*, a.full_name as admin_name, a.email as admin_email
      FROM membership_plan_price_history ph
      LEFT JOIN admin_users a ON a.id = ph.changed_by_admin_id
      WHERE ph.plan_id = ?
      ORDER BY ph.effective_date DESC
    `).all(req.params.id);

    res.json({ status: true, data: history });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/memberships/action (Extend, Pause, Renew, Cancel)
adminRouter.post('/memberships/action', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  try {
    const { membership_id, action, extend_months = 1, reason = '' } = req.body;
    const membership = await db.prepare('SELECT * FROM memberships WHERE id = ?').get(membership_id);
    if (!membership) {
      return res.status(404).json({ status: false, error: 'Membership record not found' });
    }

    if (!['extend', 'pause', 'resume', 'cancel'].includes(action)) return res.status(400).json({ status: false, error: 'Choose a supported membership action.' });
    if (action === 'extend') positiveInteger(extend_months, 120);
    const now = new Date().toISOString();
    let newStatus = membership.status;
    let newExpiry = membership.expiry_date;

    if (action === 'extend') {
      newExpiry = calculateCalendarExpiry(membership.expiry_date, parseInt(extend_months, 10));
      newStatus = 'active';
    } else if (action === 'pause') {
      newStatus = 'suspended';
    } else if (action === 'resume') {
      newStatus = 'active';
    } else if (action === 'cancel') {
      newStatus = 'cancelled';
    }

    await db.prepare(`
      UPDATE memberships
      SET status = ?, expiry_date = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, newExpiry, now, membership.id);

    await recordAuditLog(req.admin.id, req.admin.full_name, `MEMBERSHIP_${action.toUpperCase()}`, 'memberships', membership.id, {
      student_id: membership.student_id,
      previousExpiry: membership.expiry_date,
      newExpiry,
      reason
    });

    res.json({ status: true, message: `Membership successfully ${action}ed.`, newStatus, newExpiry });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// GET /api/admin/coupons
adminRouter.get('/coupons', requireAdminAuth, async (req, res) => {
  try {
    const coupons = await db.prepare('SELECT * FROM coupons WHERE deleted_at IS NULL ORDER BY created_at DESC').all();
    res.json({ status: true, data: coupons });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/coupons
adminRouter.post('/coupons', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  try {
    const c = couponInput(req.body),id = 'coup_' + crypto.randomUUID(),now = new Date().toISOString();
    if (await db.prepare('SELECT id FROM coupons WHERE code=?').get(c.code)) return res.status(409).json({ status: false, error: 'This coupon code already exists. Use a new code.' });
    await db.prepare('INSERT INTO coupons(id,code,discount_type,discount_value,min_order_amount,max_discount_amount,valid_from,valid_until,usage_limit,is_active,created_at) VALUES (?,?,?,?,?,?,?,?,?,1,?)').run(id, c.code, c.type, c.value, c.min, c.cap, c.from, c.until, c.limit, now);
    await recordAuditLog(req.admin.id, req.admin.full_name, 'COUPON_CREATED', 'coupons', id, { code: c.code, discount_value: c.value });
    res.json({ status: true, message: 'Coupon created successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

adminRouter.put('/coupons/:id', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  const active = req.body.is_active;if (![0, 1, true, false].includes(active)) return res.status(400).json({ status: false, error: 'Choose Active or Disabled.' });
  const changed = await db.prepare('UPDATE coupons SET is_active=? WHERE id=? AND deleted_at IS NULL').run(Number(active), req.params.id);
  if (!changed.changes) return res.status(404).json({ status: false, error: 'Coupon not found.' });
  await recordAuditLog(req.admin.id, req.admin.full_name, active ? 'COUPON_ACTIVATED' : 'COUPON_DEACTIVATED', 'coupons', req.params.id, {});
  res.json({ status: true });
});
adminRouter.delete('/coupons/:id', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  const changed = await db.prepare('UPDATE coupons SET is_active=0,deleted_at=? WHERE id=? AND deleted_at IS NULL').run(new Date().toISOString(), req.params.id);
  if (!changed.changes) return res.status(404).json({ status: false, error: 'Coupon not found.' });
  await recordAuditLog(req.admin.id, req.admin.full_name, 'COUPON_DELETED', 'coupons', req.params.id, {});res.json({ status: true });
});

// ============================================================================
// 5. MERCHANT PAYMENT SETTINGS & UPI QR GENERATOR
// ============================================================================

// GET /api/admin/payments/settings
adminRouter.get('/payments/settings', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  try {
    const settings = await db.prepare('SELECT * FROM payment_settings WHERE id = ?').get('default_settings');
    const { gateway_key_secret, gateway_webhook_secret, ...safe } = settings || {};
    res.json({ status: true, data: safe });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// PUT /api/admin/payments/settings
adminRouter.put('/payments/settings', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  try {
    const {
      merchant_display_name,
      merchant_upi_vpa,
      support_email,
      support_phone,
      payment_instructions,
      gateway_provider,
      gateway_key_id,
      gateway_enabled,
      upi_qr_enabled
    } = req.body;

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE payment_settings
      SET merchant_display_name = COALESCE(?, merchant_display_name),
          merchant_upi_vpa = COALESCE(?, merchant_upi_vpa),
          support_email = COALESCE(?, support_email),
          support_phone = COALESCE(?, support_phone),
          payment_instructions = COALESCE(?, payment_instructions),
          gateway_provider = COALESCE(?, gateway_provider),
          gateway_key_id = COALESCE(?, gateway_key_id),
          gateway_enabled = COALESCE(?, gateway_enabled),
          upi_qr_enabled = COALESCE(?, upi_qr_enabled),
          updated_at = ?
      WHERE id = 'default_settings'
    `).run(
      merchant_display_name,
      merchant_upi_vpa,
      support_email,
      support_phone,
      payment_instructions,
      gateway_provider,
      gateway_key_id,
      gateway_enabled,
      upi_qr_enabled,
      now
    );

    await recordAuditLog(req.admin.id, req.admin.full_name, 'PAYMENT_SETTINGS_UPDATED', 'payment_settings', 'default_settings', {
      merchant_upi_vpa,
      merchant_display_name
    });

    res.json({ status: true, message: 'Payment settings saved successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/payments/generate-qr-test
adminRouter.post('/payments/generate-qr-test', requireAdminAuth, async (req, res) => {
  try {
    const { amount = 8999, note = 'Pratyaksh Ayurveda Scholar Membership' } = req.body;
    const settings = await db.prepare('SELECT merchant_upi_vpa, merchant_display_name FROM payment_settings WHERE id = ?').get('default_settings');

    const vpa = settings?.merchant_upi_vpa || 'pratyaksh@icici';
    const name = settings?.merchant_display_name || 'Pratyaksh Ayurveda Education';
    const testOrderId = `TEST_ORD_${Date.now()}`;

    // Standard NPCI UPI URI Specification
    const encodedName = encodeURIComponent(name);
    const encodedNote = encodeURIComponent(note);
    const upiUri = `upi://pay?pa=${vpa}&pn=${encodedName}&am=${parseFloat(amount).toFixed(2)}&cu=INR&tn=${encodedNote}&tr=${testOrderId}`;

    res.json({
      status: true,
      data: {
        merchantVpa: vpa,
        merchantName: name,
        amount: parseFloat(amount).toFixed(2),
        currency: 'INR',
        upiUri,
        testOrderId
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 5.5 RAZORPAY PAYMENT GATEWAY SETTINGS & TELEMETRY
// ============================================================================

installGatewayAdmin(adminRouter, db, requireAdminAuth, requirePricingAdmin, recordAuditLog);

// GET /api/admin/gateway/transactions
adminRouter.get('/gateway/transactions', requireAdminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const orders = await db.prepare(`
      SELECT o.id, o.student_id, o.plan_id, o.amount, o.currency, o.status,
             o.provider, o.provider_order_id, o.provider_payment_id,
             o.razorpay_order_id, o.razorpay_payment_id,
             o.reconciliation_status, o.created_at, o.updated_at,
             s.full_name as student_name, s.email as student_email, s.phone as student_phone,
             p.name as plan_name, p.duration_months
      FROM payment_orders o
      LEFT JOIN students s ON s.id = o.student_id
      LEFT JOIN membership_plans p ON p.id = o.plan_id
      ORDER BY o.created_at DESC
      LIMIT ?
    `).all(limit);

    res.json({
      status: true,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 6. BANK GMAIL INTEGRATION & SENDER RULES
// ============================================================================

// GET /api/admin/integrations/bank-email/status
adminRouter.get('/integrations/bank-email/status', requireAdminAuth, async (req, res) => {
  try {
    const connection = await db.prepare('SELECT * FROM bank_email_connections ORDER BY created_at DESC LIMIT 1').get();
    const rules = await db.prepare('SELECT * FROM bank_sender_rules WHERE is_active = 1').all();
    const totalAlerts = (await db.prepare('SELECT COUNT(*) as count FROM bank_credit_alerts').get()).count;
    const unmatchedAlerts = (await db.prepare("SELECT COUNT(*) as count FROM bank_credit_alerts WHERE match_status = 'unmatched'").get()).count;

    res.json({
      status: true,
      data: {
        isConnected: Boolean(connection && connection.is_connected),
        connectedEmail: connection ? connection.email_address : 'bank-alerts@pratyakshayurveda.com (Configured OAuth 2.0)',
        lastSyncAt: connection?.last_sync_at || new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        lastSyncStatus: connection?.last_sync_status || 'HEALTHY_SYNC',
        rules,
        totalAlerts,
        unmatchedAlerts
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/integrations/bank-email/sync-now
adminRouter.post('/integrations/bank-email/sync-now', requireAdminAuth, async (req, res) => {
  try {
    const now = new Date().toISOString();

    // Reconcile unmatched alerts against pending orders
    const unmatched = await db.prepare("SELECT * FROM bank_credit_alerts WHERE match_status = 'unmatched'").all();
    let matchesCount = 0;

    for (const alert of unmatched) {
      if (alert.utr_number) {
        const order = await db.prepare(`
          SELECT * FROM payment_orders 
          WHERE student_submitted_utr = ? AND status = 'awaiting_verification'
        `).get(alert.utr_number);

        if (order) {
          await db.prepare(`
            UPDATE bank_credit_alerts 
            SET match_status = 'matched_order', matched_order_id = ?, match_confidence = 1.0, 
                match_reason = 'Exact UTR match detected during bank sync'
            WHERE id = ?
          `).run(order.id, alert.id);
          matchesCount++;
        }
      }
    }

    await recordAuditLog(req.admin.id, req.admin.full_name, 'BANK_EMAIL_SYNC', 'bank_email_connections', 'sync_manual', {
      matchesFound: matchesCount
    });

    res.json({
      status: true,
      message: `Bank synchronization complete. ${matchesCount} new order-credit matches identified.`,
      syncedAt: now,
      matchesCount
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/integrations/bank-email/simulate-email
adminRouter.post('/integrations/bank-email/simulate-email', requireAdminAuth, async (req, res) => {
  try {
    const bank_name = req.body.bank_name || req.body.bankName || 'HDFC Bank';
    const amount = req.body.amount || 8999;
    const utr_number = req.body.utr_number || req.body.utrNumber;
    const remitter_name = req.body.remitter_name || req.body.studentName || 'Dr. Test Scholar';

    if (!utr_number) {
      return res.status(400).json({ status: false, error: 'UTR number is required for simulation' });
    }

    const now = new Date().toISOString();
    const alertId = `sim_alert_${Date.now()}`;
    const paise = Math.round(parseFloat(amount) * 100);
    const formatted = `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Check if an awaiting order exists with this UTR
    const matchedOrder = await db.prepare(`
      SELECT * FROM payment_orders WHERE student_submitted_utr = ? AND status = 'awaiting_verification'
    `).get(utr_number);

    await db.prepare(`
      INSERT INTO bank_credit_alerts (
        id, connection_id, bank_name, email_message_id, received_at, sender_email, subject,
        raw_snippet, credit_amount_paise, credit_amount_formatted, utr_number, remitter_vpa,
        remitter_name, match_status, matched_order_id, match_confidence, match_reason, created_at
      ) VALUES (?, 'sim_conn', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'test@upi', ?, ?, ?, ?, ?, ?)
    `).run(
      alertId,
      bank_name,
      `msg_sim_${Date.now()}`,
      now,
      'alerts@simulatedbank.com',
      `${bank_name} Credit Alert: ${formatted} received via UPI`,
      `Your account credited with ${formatted} on ${now} via UPI. Ref/UTR: ${utr_number}`,
      paise,
      formatted,
      utr_number,
      remitter_name,
      matchedOrder ? 'matched_order' : 'unmatched',
      matchedOrder ? matchedOrder.id : null,
      matchedOrder ? 1.0 : 0.0,
      matchedOrder ? 'Exact UTR match with pending order' : 'Awaiting corresponding order claim',
      now
    );

    await recordAuditLog(req.admin.id, req.admin.full_name, 'BANK_ALERT_SIMULATED', 'bank_credit_alerts', alertId, {
      utr: utr_number,
      amount
    });

    res.json({
      status: true,
      message: 'Simulated bank credit alert registered in reconciliation pipeline.',
      alertId,
      data: {
        alertId,
        utrNumber: utr_number,
        amount,
        matchedOrderId: matchedOrder ? matchedOrder.id : null
      },
      matchedOrderId: matchedOrder ? matchedOrder.id : null
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 7. PAYMENT RECONCILIATION CENTER
// ============================================================================

// GET /api/admin/reconciliation/orders
adminRouter.get('/reconciliation/orders', requireAdminAuth, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let query = `
      SELECT o.*, 
             s.full_name as student_name, s.email as student_email, s.phone as student_phone,
             p.name as plan_name, p.duration_months
      FROM payment_orders o
      JOIN students s ON s.id = o.student_id
      JOIN membership_plans p ON p.id = o.plan_id
      WHERE 1=1
    `;
    const params = [];

    if (status !== 'all') {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;
    const orders = await db.prepare(query).all(...params);

    res.json({ status: true, data: orders });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// GET /api/admin/reconciliation/alerts
adminRouter.get('/reconciliation/alerts', requireAdminAuth, async (req, res) => {
  try {
    const alerts = await db.prepare('SELECT * FROM bank_credit_alerts ORDER BY received_at DESC').all();
    res.json({ status: true, data: alerts });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/reconciliation/approve (ATOMIC SERVER-SIDE APPROVAL & MEMBERSHIP ACTIVATION)
adminRouter.post('/reconciliation/approve', requireAdminAuth, requirePricingAdmin, async (req, res) => {
  try {
    const order_id = req.body.order_id || req.body.orderId;
    const notes = req.body.notes || req.body.adminNotes || '';
    if (!order_id) {
      return res.status(400).json({ status: false, error: 'Order ID is required' });
    }

    const order = await db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ status: false, error: 'Payment order not found' });
    }
    if(order.provider==='razorpay'||order.razorpay_order_id)return res.status(400).json({status:false,error:'Gateway orders require captured payment verification; manual activation is disabled.'});

    // Idempotency: prevent double activation
    if (order.status === 'completed') {
      return res.json({ status: true, message: 'Order has already been approved and settled previously.' });
    }

    const student = await db.prepare('SELECT * FROM students WHERE id = ?').get(order.student_id);
    const plan = await db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(order.plan_id);

    const now = new Date().toISOString();
    const expiry = calculateCalendarExpiry(now, plan.duration_months);

    // 1. Mark Order Completed atomically
    await db.prepare(`
      UPDATE payment_orders
      SET status = 'completed',
          reconciliation_status = 'manual_approved',
          admin_verified_by = ?,
          admin_verified_at = ?,
          admin_notes = ?,
          updated_at = ?
      WHERE id = ?
    `).run(req.admin.id, now, notes || `Manually verified & approved by ${req.admin.full_name}`, now, order.id);

    // 2. Grant or Extend Student Membership
    const existingMembership = await db.prepare("SELECT * FROM memberships WHERE student_id = ? AND status = 'active'").get(student.id);

    if (existingMembership) {
      // Extend existing membership smoothly from current expiry
      const extendedExpiry = calculateCalendarExpiry(existingMembership.expiry_date, plan.duration_months);
      await db.prepare(`
        UPDATE memberships
        SET expiry_date = ?, updated_at = ?
        WHERE id = ?
      `).run(extendedExpiry, now, existingMembership.id);
    } else {
      // Create new active membership
      const membershipId = `mem_${Date.now()}`;
      await db.prepare(`
        INSERT INTO memberships (
          id, student_id, plan_id, plan_name_snapshot, price_snapshot, currency,
          duration_months, order_ref, start_date, expiry_date, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `).run(
        membershipId,
        student.id,
        plan.id,
        plan.name,
        order.amount,
        'INR',
        plan.duration_months,
        order.id,
        now,
        expiry,
        now,
        now
      );
    }

    // 3. Mark Student onboarding completed
    await db.prepare(`UPDATE students SET onboarding_state = 'completed', updated_at = ? WHERE id = ?`).run(now, student.id);

    // 4. Update matching bank alert to 'approved' if one exists
    if (order.student_submitted_utr) {
      await db.prepare(`
        UPDATE bank_credit_alerts
        SET match_status = 'approved', processed_by_admin = ?, processed_at = ?
        WHERE utr_number = ?
      `).run(req.admin.id, now, order.student_submitted_utr);
    }

    // 5. Send Transactional Confirmation Receipt
    await db.prepare(`
      INSERT INTO transactional_notifications (id, recipient_email, recipient_name, template_type, subject, content_html, sent_at, related_order_id, created_at)
      VALUES (?, ?, ?, 'payment_success', ?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      student.email,
      student.full_name,
      'Payment Verified & Membership Activated — Pratyaksh Ayurveda',
      `<p>Namaste ${student.full_name},</p><p>Your payment of <strong>₹${order.amount}</strong> for <strong>${plan.name}</strong> has been verified. Your full classroom access is active until ${new Date(expiry).toLocaleDateString()}.</p>`,
      now,
      order.id,
      now
    );

    await recordAuditLog(req.admin.id, req.admin.full_name, 'PAYMENT_APPROVED', 'payment_orders', order.id, {
      amount: order.amount,
      studentEmail: student.email,
      plan: plan.name,
      utr: order.student_submitted_utr
    });

    res.json({
      status: true,
      message: `Order ${order.id} approved. Student membership for ${student.full_name} is active until ${new Date(expiry).toLocaleDateString()}.`,
      data: {
        membership: {
          plan_id: plan.id,
          expires_at: expiry
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// POST /api/admin/reconciliation/reject
adminRouter.post('/reconciliation/reject', requireAdminAuth, async (req, res) => {
  try {
    const order_id = req.body.order_id || req.body.orderId;
    const reason = req.body.reason || req.body.rejectReason || 'Bank UTR not found or amount mismatch';
    if (!order_id) {
      return res.status(400).json({ status: false, error: 'Order ID is required' });
    }

    const order = await db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ status: false, error: 'Order not found' });
    }

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE payment_orders
      SET status = 'cancelled',
          rejection_reason = ?,
          reconciliation_status = 'rejected',
          admin_verified_by = ?,
          admin_verified_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(reason, req.admin.id, now, now, order.id);

    await recordAuditLog(req.admin.id, req.admin.full_name, 'PAYMENT_REJECTED', 'payment_orders', order.id, {
      reason,
      utr: order.student_submitted_utr
    });

    res.json({ status: true, message: 'Order marked rejected with audit documentation.' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 8. SUPABASE INTEGRATION DIAGNOSTICS
// ============================================================================

// GET /api/admin/integrations/supabase/status
adminRouter.get('/integrations/supabase/status', requireAdminAuth, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    const isCloudConfigured = Boolean(supabaseUrl && anonKey && supabaseUrl.startsWith('http'));

    // Count records across core tables
    const tableCounts = {
      students: (await db.prepare('SELECT COUNT(*) as c FROM students').get()).c,
      memberships: (await db.prepare('SELECT COUNT(*) as c FROM memberships').get()).c,
      membership_plans: (await db.prepare('SELECT COUNT(*) as c FROM membership_plans').get()).c,
      payment_orders: (await db.prepare('SELECT COUNT(*) as c FROM payment_orders').get()).c,
      bank_credit_alerts: (await db.prepare('SELECT COUNT(*) as c FROM bank_credit_alerts').get()).c,
      admin_users: (await db.prepare('SELECT COUNT(*) as c FROM admin_users').get()).c,
      admin_audit_logs: (await db.prepare('SELECT COUNT(*) as c FROM admin_audit_logs').get()).c
    };

    res.json({
      status: true,
      data: {
        isCloudConfigured:db.engine==='mysql',
        mode: db.engine==='mysql'?'MYSQL':'SQLITE_DEVELOPMENT',
        supabaseUrl:'Not used by this backend',
        anonKeyPreview:'First-party server authentication',
        serviceRoleKeyConfigured:false,
        databaseLatencyMs:null,
        tableCounts,
        rlsEnabled:false,
        migrationVersion:'database/migrations/mysql',
        securityNote:'Authorization is enforced by first-party server middleware. This backend does not use Supabase RLS.'
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 9. REPORTING & NOTIFICATION FEED
// ============================================================================

// GET /api/admin/reports/revenue
adminRouter.get('/reports/revenue', requireAdminAuth, async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    let dateFilter = '';
    const params = [];
    if (range === '7d') {
      const d = new Date(Date.now() - 7 * 86400000).toISOString();
      dateFilter = 'AND o.created_at >= ?';
      params.push(d);
    } else if (range === '30d') {
      const d = new Date(Date.now() - 30 * 86400000).toISOString();
      dateFilter = 'AND o.created_at >= ?';
      params.push(d);
    } else if (range === '90d') {
      const d = new Date(Date.now() - 90 * 86400000).toISOString();
      dateFilter = 'AND o.created_at >= ?';
      params.push(d);
    }

    const orders = await db.prepare(`
      SELECT o.id, 
             o.id as order_id,
             o.razorpay_order_id,
             o.razorpay_payment_id,
             o.provider_payment_id,
             o.amount, 
             o.status, 
             COALESCE(o.payment_method, o.provider, 'razorpay') as payment_method, 
             COALESCE(o.razorpay_payment_id, o.provider_payment_id, o.student_submitted_utr) as utr_number, 
             o.created_at,
             COALESCE(s.full_name, 'Ayurveda Scholar') as student_name, 
             s.email as student_email,
             p.name as plan_name, 
             p.price as original_price,
             o.discount_amount,
             o.coupon_id as coupon_code
      FROM payment_orders o
      LEFT JOIN students s ON s.id = o.student_id
      LEFT JOIN membership_plans p ON p.id = o.plan_id
      WHERE 1=1 ${dateFilter}
      ORDER BY o.created_at DESC
    `).all(...params);

    const completed = orders.filter((o) => o.status === 'completed' || o.status === 'paid');
    const totalRevenue = completed.reduce((sum, o) => sum + (o.amount || 0), 0);
    const razorpayRevenue = completed.filter((o) => {
      const pm = (o.payment_method || '').toLowerCase();
      return pm.includes('razorpay') || pm.includes('gateway') || Boolean(o.razorpay_payment_id);
    }).reduce((sum, o) => sum + (o.amount || 0), 0);
    const directUpiRevenue = completed.filter((o) => {
      const pm = (o.payment_method || '').toLowerCase();
      return pm.includes('upi') && !o.razorpay_payment_id;
    }).reduce((sum, o) => sum + (o.amount || 0), 0);
    const aov = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

    res.json({
      status: true,
      data: {
        orders,
        totalRevenue,
        razorpayRevenue,
        upiRevenue: directUpiRevenue,
        orderCount: orders.length,
        completedCount: completed.length,
        pendingCount: orders.filter((o) => o.status === 'pending').length,
        failedCount: orders.filter((o) => o.status === 'failed' || o.status === 'rejected').length,
        aov
      },
      orders
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// GET /api/admin/notifications
adminRouter.get('/notifications', requireAdminAuth, async (req, res) => {
  try {
    const notifications = await db.prepare('SELECT * FROM transactional_notifications ORDER BY sent_at DESC LIMIT 25').all();
    res.json({ status: true, data: notifications });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

/* ==========================================================
   HOSTINGER EMAIL CENTER ADMIN ROUTES
   ========================================================== */

// 1. Overview Statistics & SMTP Status
adminRouter.get('/email/overview', requireAdminAuth, async (req, res) => {
  try {
    const stats = await getEmailOverviewStats();
    res.json({ status: true, data: stats });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// 2. SMTP Settings (Non-secret only; password masked)
adminRouter.get('/email/settings', requireAdminAuth, async (req, res) => {
  try {
    const config = await getSmtpConfig();
    res.json({
      status: true,
      data: {
        provider: config.provider,
        host: config.host,
        port: config.port,
        security: config.security,
        username: config.username,
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        passwordConfigured: config.passwordConfigured,
        passwordStatus: config.passwordStatus,
        lastVerifiedAt: config.lastVerifiedAt,
        lastVerificationStatus: config.lastVerificationStatus,
        lastVerificationError: config.lastVerificationError
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// 3. Update Non-secret SMTP Settings
adminRouter.put('/email/settings', requireAdminAuth, async (req, res) => {
  try {
    const { fromName, fromEmail, host, port, username } = req.body;
    const now = new Date().toISOString();

    if (fromEmail && !isValidEmail(fromEmail)) {
      return res.status(400).json({ status: false, error: 'Invalid sender email address' });
    }

    await db.prepare(`
      UPDATE email_settings
      SET sender_name = COALESCE(?, sender_name),
          sender_email = COALESCE(?, sender_email),
          smtp_host = COALESCE(?, smtp_host),
          smtp_port = COALESCE(?, smtp_port),
          smtp_username = COALESCE(?, smtp_username),
          updated_at = ?
      WHERE id = 'default_settings'
    `).run(
      fromName || null,
      fromEmail || null,
      host || null,
      port ? parseInt(port, 10) : null,
      username || null,
      now
    );

    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'EMAIL_SETTINGS_UPDATED',
      'email_settings',
      'default_settings',
      { fromName, fromEmail, host, port, username },
      req.ip
    );

    res.json({ status: true, message: 'Hostinger email settings updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// 4. Test SMTP Connection
adminRouter.post('/email/test-connection', requireAdminAuth, async (req, res) => {
  try {
    const result = await verifySmtpConnection();
    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'SMTP_CONNECTION_TEST',
      'email_service',
      'hostinger_smtp',
      { status: result.status, success: result.success },
      req.ip
    );
    res.json({ status: true, data: result });
  } catch (err) {
    res.status(500).json({ status: false, error: sanitizeEmailError(err) });
  }
});

// 5. Send Test Email (Authorized test recipient)
adminRouter.post('/email/send-test', requireAdminAuth, async (req, res) => {
  try {
    const { recipientEmail, subject, body } = req.body;
    const targetRecipient = recipientEmail || req.admin.email;

    if (!isValidEmail(targetRecipient)) {
      return res.status(400).json({ status: false, error: 'Please provide a valid recipient email address for testing' });
    }

    const rendered = await renderEmailTemplate(body?.trim() ? 'account_notification' : 'system_smtp_test', {
      student_name: req.admin.full_name || 'Administrator',
      notification_title: 'Email delivery test',
      notification_message: body?.trim() || ''
    });
    const testSubject = subject?.trim() || rendered.subject;
    const testBodyHtml = rendered.html;
    const testBodyText = rendered.text;

    const sendResult = await sendEmail({
      to: targetRecipient,
      subject: testSubject,
      html: testBodyHtml,
      text: testBodyText,
      templateKey: 'system_smtp_test',
      isTest: true,
      adminId: req.admin.id
    });

    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'EMAIL_TEST_SENT',
      'email_logs',
      sendResult.logId,
      { recipient: targetRecipient, status: sendResult.status },
      req.ip
    );

    res.json({ status: true, data: sendResult });
  } catch (err) {
    res.status(500).json({ status: false, error: sanitizeEmailError(err) });
  }
});

// 6. Compose and Send Custom Email
adminRouter.post('/email/compose', requireAdminAuth, async (req, res) => {
  try {
    const { to, subject, html, text, templateKey, variables = {} } = req.body;

    if (!isValidEmail(to)) {
      return res.status(400).json({ status: false, error: 'Valid recipient email address is required' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ status: false, error: 'Email subject is required' });
    }
    if (!html && !text) {
      return res.status(400).json({ status: false, error: 'Email message content is required' });
    }

    const values = { ...variables, ...emailBrandVariables() };
    const renderedSubject = interpolateTextVariables(subject, values);
    const renderedHtml = interpolateVariables(html || '', values);
    const renderedText = interpolateTextVariables(text || '', values);
    if ([renderedSubject, renderedHtml, renderedText].some((value) => /\{\{\s*\w+\s*\}\}/.test(value))) {
      return res.status(400).json({ status: false, error: 'Fill in all template variables before sending.' });
    }
    const sendResult = await sendEmail({
      to,
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText,
      templateKey: templateKey || 'admin_compose',
      isTest: false,
      adminId: req.admin.id
    });

    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'EMAIL_COMPOSED_AND_SENT',
      'email_logs',
      sendResult.logId,
      { recipient: to, subject, status: sendResult.status },
      req.ip
    );

    res.json({ status: true, data: sendResult });
  } catch (err) {
    res.status(500).json({ status: false, error: sanitizeEmailError(err) });
  }
});

// 7. Paginated Sent Emails History
adminRouter.get('/email/sent', requireAdminAuth, async (req, res) => {
  try {
    const { page, limit, recipient, status, templateKey, search } = req.query;
    const data = await getSentEmails({ page, limit, recipient, status, templateKey, search });
    res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// 8. Sent Email Details
adminRouter.get('/email/sent/:id', requireAdminAuth, async (req, res) => {
  try {
    const email = await db.prepare('SELECT * FROM email_logs WHERE id = ?').get(req.params.id);
    if (!email) {
      return res.status(404).json({ status: false, error: 'Email log record not found' });
    }
    res.json({ status: true, data: email });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// 9. Drafts Management
adminRouter.get('/email/drafts', requireAdminAuth, async (req, res) => {
  try {
    const drafts = await db.prepare(`
      SELECT * FROM email_drafts 
      WHERE admin_user_id = ? 
      ORDER BY updated_at DESC
    `).all(req.admin.id);
    res.json({ status: true, data: drafts });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

adminRouter.post('/email/drafts', requireAdminAuth, async (req, res) => {
  try {
    const { recipient, subject, body, templateKey } = req.body;
    const now = new Date().toISOString();
    const id = `dft_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    await db.prepare(`
      INSERT INTO email_drafts (id, admin_user_id, recipient, subject, body, template_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.admin.id, recipient || '', subject || '', body || '', templateKey || null, now, now);

    res.json({ status: true, data: { id, message: 'Draft saved successfully' } });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

adminRouter.put('/email/drafts/:id', requireAdminAuth, async (req, res) => {
  try {
    const { recipient, subject, body, templateKey } = req.body;
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE email_drafts
      SET recipient = ?, subject = ?, body = ?, template_key = ?, updated_at = ?
      WHERE id = ? AND admin_user_id = ?
    `).run(recipient || '', subject || '', body || '', templateKey || null, now, req.params.id, req.admin.id);

    res.json({ status: true, message: 'Draft updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

adminRouter.delete('/email/drafts/:id', requireAdminAuth, async (req, res) => {
  try {
    await db.prepare('DELETE FROM email_drafts WHERE id = ? AND admin_user_id = ?').run(req.params.id, req.admin.id);
    res.json({ status: true, message: 'Draft deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// 10. Email Templates Management
adminRouter.get('/email/templates', requireAdminAuth, async (req, res) => {
  try {
    const templates = await db.prepare('SELECT * FROM email_templates ORDER BY category, name').all();
    res.json({ status: true, data: templates.map((template) => ({ ...template, system_variables: emailBrandVariables() })) });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

adminRouter.put('/email/templates/:id', requireAdminAuth, async (req, res) => {
  try {
    const { subject, html_body, text_body, enabled } = req.body;
    const current = await db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ status: false, error: 'Template not found.' });
    const allowed = JSON.parse(current.variables_json || '[]');
    const merged = { subject: subject ?? current.subject, html_body: html_body ?? current.html_body, text_body: text_body ?? current.text_body };
    if (Object.values(merged).some((value) => typeof value !== 'string' || !value.trim())) return res.status(400).json({ status: false, error: 'Subject, HTML and plain text are required.' });
    if (/[\r\n]/.test(merged.subject)) return res.status(400).json({ status: false, error: 'Subject must be a single line.' });
    const tokens = [...Object.values(merged).join('\n').matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]);
    const unknown = tokens.find((key) => !allowed.includes(key));
    if (unknown) return res.status(400).json({ status: false, error: `Unknown template variable: ${unknown}` });
    if (current.category === 'authentication' && (!/\{\{\s*otp_code\s*\}\}/.test(merged.html_body) || !/\{\{\s*otp_code\s*\}\}/.test(merged.text_body))) return res.status(400).json({ status: false, error: 'Authentication emails must include the otp_code variable in HTML and plain text.' });
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE email_templates
      SET subject = COALESCE(?, subject),
          html_body = COALESCE(?, html_body),
          text_body = COALESCE(?, text_body),
          enabled = COALESCE(?, enabled),
          updated_at = ?
      WHERE id = ?
    `).run(subject || null, html_body || null, text_body || null, enabled !== undefined ? enabled : null, now, req.params.id);

    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'EMAIL_TEMPLATE_UPDATED',
      'email_template',
      req.params.id,
      { subject },
      req.ip
    );

    res.json({ status: true, message: 'Template updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

adminRouter.post('/email/templates/:id/preview', requireAdminAuth, async (req, res) => {
  try {
    const template = await db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ status: false, error: 'Template not found' });
    }

    const sampleVars = {
      ...emailBrandVariables(),
      student_name: 'Dr. Rahul Parihar',
      otp_code: '849201',
      expiry_minutes: '10',
      membership_name: '12 Months Academic Complete',
      membership_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      payment_reference: 'pay_RAZORPAY_DEMO_9182',
      amount: '14,999',
      notification_title: 'Syllabus Update: Charaka Sutrasthana Live Batch',
      notification_message: 'The clinical discussion for Charaka Sutrasthana Chapter 17 has been rescheduled to tomorrow at 7:00 PM IST with Dr. Rahul Parihar.'
    };

    const renderedSubject = interpolateTextVariables(template.subject, sampleVars);
    const renderedHtml = interpolateVariables(template.html_body, sampleVars);
    const renderedText = interpolateTextVariables(template.text_body, sampleVars);

    res.json({
      status: true,
      data: {
        templateKey: template.template_key,
        name: template.name,
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText,
        sampleVars
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

adminRouter.post('/email/templates/:id/restore-default', requireAdminAuth, async (req, res) => {
  try {
    const current = await db.prepare('SELECT template_key FROM email_templates WHERE id = ?').get(req.params.id);
    if (!current) {
      return res.status(404).json({ status: false, error: 'Template not found' });
    }

    const canonical = DEFAULT_EMAIL_TEMPLATES.find((t) => t.template_key === current.template_key);
    if (!canonical) {
      return res.status(404).json({ status: false, error: 'Canonical default template not found' });
    }

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE email_templates
      SET subject = ?, html_body = ?, text_body = ?, variables_json = ?, enabled = 1, updated_at = ?
      WHERE id = ?
    `).run(canonical.subject, canonical.html_body, canonical.text_body, canonical.variables_json, now, req.params.id);

    res.json({ status: true, message: 'Template successfully restored to canonical defaults' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// ============================================================================
// 10. AUTHENTICATION PROVIDER & GOOGLE LOGIN MANAGEMENT
// ============================================================================

// GET /api/admin/auth/google/settings
adminRouter.get('/auth/google/settings', requireAdminAuth, async (req, res) => {
  try {
    const environment = req.query.env || getRuntimeEnvironment();
    const settings = await getGoogleAuthSettings(environment);

    const host = req.headers.host || 'localhost:3001';
    const registeredOrigins = [
    {
      name: 'Localhost Development Origin',
      url: 'http://localhost',
      status: 'Must be added in Google Cloud Console',
      isCurrent: false
    },
    {
      name: 'Localhost Development Port',
      url: 'http://localhost:3001',
      status: 'Must be added in Google Cloud Console',
      isCurrent: host.includes('3001') || host.includes('5173')
    },
    {
      name: 'Production Domain Origin',
      url: 'https://study.ayurvedasidhi.com',
      status: 'Must be added in Google Cloud Console',
      isCurrent: host.includes('ayurvedasidhi.com')
    }];


    res.json({
      status: true,
      data: {
        ...settings,
        currentHost: host,
        registeredOrigins,
        serverEnvironment: getRuntimeEnvironment(),
        googleCloudConsoleUrl: 'https://console.cloud.google.com/apis/credentials',
        oauthAppName: 'Ayurvedasidhi Web Login',
        googleCloudProject: 'Ayurvedasidhi Authentication'
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// PUT /api/admin/auth/google/settings
adminRouter.put('/auth/google/settings', requireAdminAuth, async (req, res) => {
  try {
    const { clientId, clientSecret, isEnabled, environment } = req.body;
    const targetEnv = environment || getRuntimeEnvironment();

    const updated = await updateGoogleAuthSettings({
      clientId,
      clientSecret,
      isEnabled,
      adminId: req.admin.id,
      adminName: req.admin.full_name,
      targetEnv
    });

    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'UPDATE_GOOGLE_AUTH_SETTINGS',
      'authentication_settings',
      `auth_cfg_google_${targetEnv === 'production' ? 'prod' : 'dev'}`,
      {
        environment: targetEnv,
        isEnabled: updated.isEnabled,
        clientIdMasked: updated.clientId ? `${updated.clientId.slice(0, 14)}...apps.googleusercontent.com` : 'empty'
      },
      req.ip
    );

    res.json({
      status: true,
      message: 'Google login settings saved successfully to MySQL.',
      data: updated
    });
  } catch (err) {
    res.status(400).json({ status: false, error: err.message });
  }
});

// POST /api/admin/auth/google/test-verify
adminRouter.post('/auth/google/test-verify', requireAdminAuth, async (req, res) => {
  try {
    const { credential, clientId } = req.body;
    if (!credential) {
      return res.status(400).json({ status: false, error: 'Google credential (ID token) is required for verification.' });
    }

    const verified = await verifyGoogleIdToken(credential, {
      explicitClientId: clientId,
      isTest: true
    });

    await recordGoogleTestResult({
      status: 'Verified',
      error: null,
      targetEnv: getRuntimeEnvironment()
    });

    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'TEST_GOOGLE_LOGIN_SUCCESS',
      'authentication_settings',
      'google',
      {
        testedEmail: verified.email,
        sub: verified.sub,
        verifiedAt: new Date().toISOString()
      },
      req.ip
    );

    res.json({
      status: true,
      message: 'Official Google Identity Services token verified with 100% success!',
      data: {
        verifiedAt: new Date().toISOString(),
        email: verified.email,
        sub: verified.sub,
        fullName: verified.fullName,
        emailVerified: verified.emailVerified,
        tokenAudience: 'Matches Configured Client ID',
        tokenIssuer: 'accounts.google.com'
      }
    });
  } catch (err) {
    await recordGoogleTestResult({
      status: 'Failed',
      error: err.message,
      targetEnv: getRuntimeEnvironment()
    });

    await recordAuditLog(
      req.admin.id,
      req.admin.full_name,
      'TEST_GOOGLE_LOGIN_FAILED',
      'authentication_settings',
      'google',
      { error: err.message },
      req.ip
    );

    res.status(400).json({
      status: false,
      error: err.message || 'Google token verification failed'
    });
  }
});

// GET /api/admin/auth/activity
adminRouter.get('/auth/activity', requireAdminAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const logs = await getRecentAuthActivity(limit);
    res.json({ status: true, data: logs });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});
