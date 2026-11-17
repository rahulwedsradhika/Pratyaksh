import crypto from 'node:crypto';
import { db } from './db.js';

export async function activeAdminForEmail(email) {
  return await db.prepare('SELECT * FROM admin_users WHERE lower(email) = ? AND is_active = 1').
  get(String(email || '').trim().toLowerCase());
}

export async function hasAdminClassroomAccess(student) {
  return Boolean(student?.email_verified && !student.is_suspended && (await activeAdminForEmail(student.email)));
}

export async function adminFromSession(token) {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret && [process.env.NODE_ENV, process.env.APP_ENV].includes('production')) return null;
  const hash = crypto.createHmac('sha256', secret || 'local-development-session-secret-change-before-production').update(token).digest('hex');
  return await db.prepare(`SELECT a.* FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND a.is_active = 1`).
  get(hash, new Date().toISOString());
}

// Called only after OTP/Google verification or validation of an opaque admin session.
export async function ensureAdminLearner(admin) {
  let student = await db.prepare('SELECT * FROM students WHERE lower(email) = ?').get(admin.email.toLowerCase());
  if (!student) {
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO students (id,email,password_hash,full_name,phone,auth_provider,email_verified,onboarding_state,role,created_at,updated_at)
      VALUES (?,?,'',?,?,'admin',1,'completed','student',?,?)`).
    run(`admin_learner_${crypto.randomUUID()}`, admin.email.toLowerCase(), admin.full_name, admin.phone || '', now, now);
    student = await db.prepare('SELECT * FROM students WHERE lower(email) = ?').get(admin.email.toLowerCase());
  } else if (!student.email_verified) {
    await db.prepare('UPDATE students SET email_verified = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), student.id);
    student = { ...student, email_verified: 1 };
  }
  return student;
}
