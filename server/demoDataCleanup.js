const demoAdmins = new Set(['admin_super_01','admin_fin_01','admin_admit_01','adm_super_01']);
export function isDemoEmail(value) {
  const email = String(value || '').toLowerCase();
  return ['scholar@pratyakshayurveda.com','expired@pratyakshayurveda.com','test.scholar@pratyakshayurveda.com','google.scholar@pratyakshayurveda.com','verify@test.local','test.admin@ayurvedasidhi.com','test@ayurvedasidhi.com'].includes(email)
    || /^scholar_\d+@(pratyakshayurveda|ayurvedasidhi)\.com$/.test(email)
    || /^scholar\.qa\.\d+@bams\.edu\.in$/.test(email)
    || /^(scholar\.google|traditional\.student)\.\d+@test\.ayurvedasidhi\.com$/.test(email);
}

export function cleanupDemoData(db, { apply = false } = {}) {
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t=>t.name));
  const rows = table => tables.has(table) ? db.prepare(`SELECT rowid AS __cleanup_rowid, * FROM "${table}"`).all() : [];
  const students = new Set(rows('students').filter(r=>isDemoEmail(r.email) || ['student-active-demo','student-expired-demo'].includes(r.id)).map(r=>r.id));
  const admins = new Set(rows('admin_users').filter(r=>demoAdmins.has(r.id) && r.email !== 'mukeshk65018@gmail.com').map(r=>r.id));
  const orders = new Set(rows('payment_orders').filter(r=>students.has(r.student_id) || r.provider === 'sandbox' || r.id === 'ord_upi_demo_01').map(r=>r.id));
  const matches = [];
  const predicates = {
    payment_events:r=>orders.has(r.order_id),
    transactional_notifications:r=>isDemoEmail(r.recipient_email)||orders.has(r.related_order_id),
    bank_credit_alerts:r=>r.connection_id==='conn_demo_01'||r.connection_id==='sim_conn'||orders.has(r.matched_order_id),
    email_logs:r=>isDemoEmail(r.recipient),
    email_drafts:r=>admins.has(r.admin_user_id)||isDemoEmail(r.recipient),
    student_otps:r=>isDemoEmail(r.email),
    auth_activity_logs:r=>students.has(r.user_id)||admins.has(r.user_id)||isDemoEmail(r.email),
    admin_sessions:r=>admins.has(r.admin_id),
    bank_email_connections:r=>admins.has(r.admin_id),
    admin_audit_logs:r=>admins.has(r.admin_id)||students.has(r.entity_id)||orders.has(r.entity_id),
    membership_plan_price_history:r=>admins.has(r.changed_by_admin_id),
    inquiries:r=>isDemoEmail(r.email),
    coupons:r=>['coup_01','coup_02','coup_03'].includes(r.id)&&['AYURVEDA2026','SCHOLAR1000','AIAPGETAIR1'].includes(r.code),
    payment_orders:r=>orders.has(r.id),
    students:r=>students.has(r.id),
    admin_users:r=>admins.has(r.id)
  };
  // Child records are archived before their parent accounts.
  for (const table of ['memberships','test_attempts','student_progress','cart_items','user_auth_identities','lecture_history','student_exam_history','student_saved_questions','student_tasks']) predicates[table]=r=>students.has(r.student_id);
  const sequence = [...Object.keys(predicates).filter(t=>!['students','admin_users'].includes(t)),'students','admin_users'];
  for (const table of sequence) for (const row of rows(table)) if(predicates[table](row)) matches.push({table,row});
  const counts = {}; for(const {table} of matches) counts[table]=(counts[table]||0)+1;
  if (!apply || matches.length===0) return {applied:false,counts};
  const runId = `demo-cleanup-${new Date().toISOString()}`;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('CREATE TABLE IF NOT EXISTS demo_cleanup_archive (sequence INTEGER PRIMARY KEY, run_id TEXT NOT NULL, table_name TEXT NOT NULL, record_json TEXT NOT NULL, archived_at TEXT NOT NULL, restored_at TEXT)');
    const archive=db.prepare('INSERT INTO demo_cleanup_archive (run_id,table_name,record_json,archived_at) VALUES (?,?,?,?)');
    for(const {table,row} of matches) {
      const {__cleanup_rowid,...record}=row;
      archive.run(runId,table,JSON.stringify(record),new Date().toISOString());
      db.prepare(`DELETE FROM "${table}" WHERE rowid = ?`).run(__cleanup_rowid);
    }
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
  return {applied:true,runId,counts};
}

export function restoreCleanup(db,runId) {
  const archived=db.prepare('SELECT * FROM demo_cleanup_archive WHERE run_id=? AND restored_at IS NULL ORDER BY sequence DESC').all(runId);
  db.exec('BEGIN IMMEDIATE');
  try {
    for(const item of archived){
      if(!/^[a-z_]+$/.test(item.table_name))throw Error('Invalid archived table');
      const record=JSON.parse(item.record_json),cols=Object.keys(record);
      if(cols.some(c=>!/^\w+$/.test(c)))throw Error('Invalid archived column');
      db.prepare(`INSERT INTO "${item.table_name}" (${cols.map(c=>`"${c}"`).join(',')}) VALUES (${cols.map(()=>'?').join(',')})`).run(...Object.values(record));
      db.prepare('UPDATE demo_cleanup_archive SET restored_at=? WHERE sequence=?').run(new Date().toISOString(),item.sequence);
    }
    db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  return archived.length;
}
