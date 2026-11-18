import crypto from 'node:crypto';

export function requireStudentSuperadmin(req, res, next) {
  if (req.admin?.role !== 'super_admin') return res.status(403).json({status:false,error:'Only a superadmin can change student access or permanently delete a student.'});
  return next();
}

// Session creation and access both check current account state, including requests
// racing a deactivation. Reactivation never revives a previously revoked token.
export async function storeStudentSession(db, {studentId,tokenHash,expiresAt,createdAt}) {
  const inserted=await db.prepare('INSERT INTO student_sessions(token_hash,student_id,expires_at,created_at) SELECT ?,id,?,? FROM students WHERE id=? AND COALESCE(is_suspended,0)=0').run(tokenHash,expiresAt,createdAt,studentId);
  if(!inserted.changes)throw Error('This student account is unavailable. Contact support.');
}
export async function activeSessionStudent(db, {studentId,tokenHash,now=new Date().toISOString()}) {
  return await db.prepare(`SELECT s.* FROM students s JOIN student_sessions t ON t.student_id=s.id
    WHERE s.id=? AND t.token_hash=? AND t.revoked_at IS NULL AND t.expires_at>? AND COALESCE(s.is_suspended,0)=0`).get(studentId,tokenHash,now) || null;
}

async function transaction(db, work) {
  if (db.withTransaction) return db.withTransaction(work);
  await db.exec('BEGIN IMMEDIATE');
  try { const value=await work(); await db.exec('COMMIT'); return value; }
  catch(error) { await db.exec('ROLLBACK'); throw error; }
}

export function installStudentLifecycle(router, db, authenticate) {
  async function audit(req, action) {
    await db.prepare(`INSERT INTO admin_audit_logs (id,admin_id,admin_name,action,entity_type,entity_id,details_json,ip_address,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(crypto.randomUUID(),req.admin.id,req.admin.full_name || '',action,'students',req.params.id,'{}',req.ip || '',new Date().toISOString());
  }
  router.put('/students/:id/access', authenticate, requireStudentSuperadmin, async(req,res)=>{
    if (typeof req.body?.deactivated !== 'boolean') return res.status(400).json({status:false,error:'Choose deactivate or reactivate.'});
    try {
      await transaction(db,async()=>{
        const student=await db.prepare('SELECT id FROM students WHERE id=?').get(req.params.id);
        if(!student)throw Object.assign(new Error('Student not found.'),{status:404});
        await db.prepare('UPDATE students SET is_suspended=?,updated_at=? WHERE id=?').run(req.body.deactivated?1:0,new Date().toISOString(),student.id);
        // Both transitions revoke old sessions. Reactivation requires a fresh sign-in.
        await db.prepare('DELETE FROM student_sessions WHERE student_id=?').run(student.id);
        await audit(req,req.body.deactivated?'STUDENT_DEACTIVATED':'STUDENT_REACTIVATED');
      });
      res.json({status:true,message:req.body.deactivated?'Student deactivated and signed out.':'Student reactivated. They can sign in again.'});
    } catch(error) { res.status(error.status || 500).json({status:false,error:error.status?error.message:'Unable to change student access. No changes were saved.'}); }
  });

  router.delete('/students/:id', authenticate, requireStudentSuperadmin, async(req,res)=>{
    try {
      await transaction(db,async()=>{
        const student=await db.prepare('SELECT id,email FROM students WHERE id=?').get(req.params.id);
        if(!student)throw Object.assign(new Error('Student not found.'),{status:404});
        if(typeof req.body?.confirmEmail!=='string' || req.body.confirmEmail.trim().toLowerCase()!==student.email.toLowerCase())throw Object.assign(new Error('Type the student email to confirm permanent deletion.'),{status:400});
        // Delete dependants before the profile. No foreign-key checks are disabled.
        const orders='SELECT id FROM payment_orders WHERE student_id=?';
        await db.prepare(`DELETE FROM coupon_reservations WHERE order_id IN (${orders})`).run(student.id);
        await db.prepare(`DELETE FROM payment_events WHERE order_id IN (${orders})`).run(student.id);
        await db.prepare(`DELETE FROM transactional_notifications WHERE related_order_id IN (${orders})`).run(student.id);
        await db.prepare(`UPDATE bank_credit_alerts SET matched_order_id=NULL WHERE matched_order_id IN (${orders})`).run(student.id);
        for(const table of ['student_sessions','user_auth_identities','student_tasks','lecture_history','student_saved_questions','student_progress','student_exam_history','test_attempts','cart_items','memberships','payment_orders']) {
          await db.prepare(`DELETE FROM ${table} WHERE student_id=?`).run(student.id);
        }
        await db.prepare("DELETE FROM auth_activity_logs WHERE user_type='student' AND (user_id=? OR lower(email)=?)").run(student.id,student.email.toLowerCase());
        for(const [table,column] of [['student_otps','email'],['transactional_notifications','recipient_email'],['email_logs','recipient']]) {
          await db.prepare(`DELETE FROM ${table} WHERE lower(${column})=?`).run(student.email.toLowerCase());
        }
        await db.prepare("UPDATE admin_audit_logs SET details_json='{}' WHERE entity_type='students' AND entity_id=?").run(student.id);
        await db.prepare('DELETE FROM students WHERE id=?').run(student.id);
        // Retain only the administrative action and old ID, not the deleted profile.
        await audit(req,'STUDENT_PERMANENTLY_DELETED');
      });
      res.json({status:true,message:'Student permanently deleted. A later registration will create a fresh account.'});
    } catch(error) { res.status(error.status || 500).json({status:false,error:error.status?error.message:'Unable to delete student. No changes were saved.'}); }
  });
}
