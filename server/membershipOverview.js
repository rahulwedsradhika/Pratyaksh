import {membershipExpiryTime,newestMembershipsFirst} from './membershipDates.js';

export function membershipEligibility(student, memberships, now = Date.now()) {
  if (student.is_suspended) return 'suspended';
  if (!student.email_verified) return 'unverified';
  if (student.classroomAccess) return 'administrator';
  if (memberships.some((item) => membershipExpiryTime(item.expiry_date) > now)) return 'active';
  if (memberships.some((item) => Number.isFinite(membershipExpiryTime(item.expiry_date)) && membershipExpiryTime(item.expiry_date) <= now)) return 'expired';
  return 'no_membership';
}

export function installMembershipOverview(app, db, authenticate, hasAdminAccess, gatewaySettings) {
  app.get('/api/membership/overview', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false, message: 'Sign in to view your membership.' });
    const memberships = newestMembershipsFirst(await db.prepare('SELECT m.*, p.name AS plan_title FROM memberships m LEFT JOIN membership_plans p ON p.id = m.plan_id WHERE m.student_id = ?').all(student.id));
    const state = membershipEligibility({ ...student, classroomAccess: await hasAdminAccess(student) }, memberships);
    const current = memberships[0];
    const settings = await gatewaySettings();
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: {
        state, canRenew: state === 'expired',
        membership: current ? { id: current.id, name: current.plan_name_snapshot || current.plan_title, startDate: current.start_date, expiryDate: current.expiry_date, status: current.status, daysRemaining: Math.max(0, Math.ceil((membershipExpiryTime(current.expiry_date) - Date.now()) / 86400000)) } : null,
        gateway: { enabled: settings.gatewayEnabled, mode: settings.mode },
        history: await db.prepare('SELECT o.id, p.name AS planName, o.amount, o.currency, o.status, o.created_at AS createdAt, o.razorpay_payment_id AS paymentId FROM payment_orders o LEFT JOIN membership_plans p ON p.id = o.plan_id WHERE o.student_id = ? ORDER BY o.created_at DESC').all(student.id)
      } });
  });
}
