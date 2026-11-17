export async function getAdminOverview(db, now = new Date()) {
  const iso = now.toISOString(),since = new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10),week = new Date(now.getTime() - 7 * 86400000).toISOString();
  const count = async (sql, ...args) => (await db.prepare(sql).get(...args)).n || 0;
  const totalStudents = await count('SELECT COUNT(*) AS n FROM students');
  const activeMemberships = await count("SELECT COUNT(*) AS n FROM memberships WHERE status='active' AND expiry_date>?", iso);
  const expiredMemberships = await count("SELECT COUNT(*) AS n FROM memberships WHERE status='expired' OR (status='active' AND expiry_date<=?)", iso);
  const paid = "status IN ('completed','paid')";
  const totalRevenue = await count(`SELECT COALESCE(SUM(amount),0) AS n FROM payment_orders WHERE ${paid}`);
  const daily = await db.prepare(`SELECT substr(created_at,1,10) AS date,SUM(amount) AS revenue,COUNT(*) AS orders FROM payment_orders WHERE ${paid} AND created_at>=? GROUP BY substr(created_at,1,10)`).all(since);
  const admissions = await db.prepare('SELECT substr(created_at,1,10) AS date,COUNT(*) AS admissions FROM students WHERE created_at>=? GROUP BY substr(created_at,1,10)').all(since);
  const revenue30DaysTrend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.parse(since + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);
    return { date, revenue: daily.find((r) => r.date === date)?.revenue || 0, orders: daily.find((r) => r.date === date)?.orders || 0, admissions: admissions.find((r) => r.date === date)?.admissions || 0 };
  });
  const tierBreakdown = (await db.prepare("SELECT p.id,p.name,p.tier_code,COUNT(m.id) AS count FROM membership_plans p LEFT JOIN memberships m ON m.plan_id=p.id AND m.status='active' AND m.expiry_date>? GROUP BY p.id ORDER BY p.duration_months").all(iso)).map((p, i) => ({ ...p, share: activeMemberships ? Math.round(p.count * 100 / activeMemberships) : 0, color: ['#2344c5', '#a9442f', '#059669', '#9b6500'][i % 4] }));
  const recentAuditLogs = (await db.prepare('SELECT l.*,a.email AS admin_email FROM admin_audit_logs l LEFT JOIN admin_users a ON a.id=l.admin_id ORDER BY l.created_at DESC LIMIT 10').all()).map((r) => {let details = {};try {details = JSON.parse(r.details_json || '{}');} catch {}return { ...r, details };});
  const pendingList = await db.prepare("SELECT o.id,o.id AS order_id,o.amount,o.status,o.provider,o.payment_method,o.created_at,s.full_name AS student_name,s.email AS student_email,p.name AS plan_name FROM payment_orders o LEFT JOIN students s ON s.id=o.student_id LEFT JOIN membership_plans p ON p.id=o.plan_id WHERE o.status IN ('pending','processing','awaiting_verification') ORDER BY o.created_at DESC LIMIT 10").all();
  return { totalStudents, activeMemberships, expiredMemberships, totalRevenue, revenue30Days: revenue30DaysTrend.reduce((sum, r) => sum + r.revenue, 0), recentAdmissions: await count('SELECT COUNT(*) AS n FROM students WHERE created_at>=?', week), pendingOrders: await count("SELECT COUNT(*) AS n FROM payment_orders WHERE status IN ('pending','processing','awaiting_verification')"), failedOrders: await count("SELECT COUNT(*) AS n FROM payment_orders WHERE status IN ('failed','cancelled','rejected')"), unmatchedCredits: await count("SELECT COUNT(*) AS n FROM bank_credit_alerts WHERE match_status='unmatched'"), revenue30DaysTrend, tierBreakdown, recentAuditLogs, pendingList, revenueTrend: revenue30DaysTrend, plansDistribution: tierBreakdown, recentActivity: recentAuditLogs };
}
