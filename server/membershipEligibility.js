import { db } from './db.js';

export const ACTIVE_MEMBERSHIP_MESSAGE = 'This email already has an active membership. Sign in to use your existing membership. You can renew after it expires.';

export async function findActiveMembership(email, database = db) {
  return await database.prepare(`
    SELECT m.id, m.expiry_date FROM memberships m
    JOIN students s ON s.id = m.student_id
    WHERE lower(trim(s.email)) = ? AND m.status = 'active'
      AND julianday(m.expiry_date) > julianday(?)
    ORDER BY julianday(m.expiry_date) DESC LIMIT 1
  `).get(String(email || '').trim().toLowerCase(), new Date().toISOString());
}

export async function assertMembershipEligible(student) {
  const unexpired = await db.prepare(`SELECT m.id FROM memberships m JOIN students s ON s.id = m.student_id
    WHERE lower(trim(s.email)) = ? AND julianday(m.expiry_date) > julianday(?) LIMIT 1
  `).get(String(student.email || '').trim().toLowerCase(), new Date().toISOString());
  if (unexpired) {
    const error = new Error(ACTIVE_MEMBERSHIP_MESSAGE);
    error.code = 'ACTIVE_MEMBERSHIP_EXISTS';
    throw error;
  }
}
