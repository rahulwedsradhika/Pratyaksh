import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {installStudentLifecycle,storeStudentSession,activeSessionStudent} from '../server/studentLifecycle.js';
import {resolveGoogleStudent} from '../server/googleAuthService.js';

function fixture(t) {
  const db=new DatabaseSync(':memory:');t.after(()=>db.close());
  db.exec('PRAGMA foreign_keys=ON');
  const schema=fs.readFileSync(new URL('../database/migrations/mysql/001_current_application.sql',import.meta.url),'utf8');
  for(const match of schema.matchAll(/CREATE TABLE IF NOT EXISTS `[\w]+` \([\s\S]*?\) ENGINE=[^;]+;/g)) {
    let sql=match[0].replace(/\) ENGINE=[^;]+;/,');').replace(/^\s*(?:UNIQUE )?KEY `[^`]+`[^\n]*\n/gm,'').replace(/,\s*\);/,');');
    // Exercise real dependent relationships without disabling foreign keys.
    sql=sql.replace(/(`student_id` VARCHAR\(191\) (?:NOT NULL|NULL))/g,'$1 REFERENCES students(id)');
    db.exec(sql);
  }
  db.exec('CREATE TABLE student_sessions(token_hash TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES students(id),expires_at TEXT,created_at TEXT,revoked_at TEXT)');
  const routes=new Map(),router={put:(path,...handlers)=>routes.set('put '+path,handlers),delete:(path,...handlers)=>routes.set('delete '+path,handlers)};
  installStudentLifecycle(router,db,(req,res,next)=>req.admin?next():res.status(401).json({status:false}));
  function insert(table,values) {
    const required=db.prepare(`PRAGMA table_info(${table})`).all().filter(c=>c.notnull && c.dflt_value===null);
    const row=Object.fromEntries(required.map(c=>[c.name,/INT|DECIMAL|DOUBLE/.test(c.type)?0:'fixture-'+c.name]));Object.assign(row,values);
    const keys=Object.keys(row);db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>row[k]));
  }
  insert('students',{id:'learner',email:'learner@example.invalid',full_name:'Learner',is_suspended:0});
  insert('students',{id:'other',email:'other@example.invalid',full_name:'Other',is_suspended:0});
  async function call(method,body={},role='super_admin',id='learner') {
    const req={admin:role?{id:'admin',full_name:'Admin',role}:null,body,params:{id},ip:'127.0.0.1'};
    const res={code:200,status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
    const handlers=routes.get(method);let i=0;const next=()=>handlers[i++]?.(req,res,next);await next();return res;
  }
  return {db,insert,call};
}

test('student lifecycle requires authenticated superadmin and an exact deletion confirmation',async t=>{
  const {db,call}=fixture(t);
  for(const route of ['put /students/:id/access','delete /students/:id']) {
    assert.equal((await call(route,{},null)).code,401);
    for(const role of ['admissions_staff','finance_staff','support_staff']) assert.equal((await call(route,{deactivated:true,confirmEmail:'learner@example.invalid'},role)).code,403);
  }
  assert.equal((await call('delete /students/:id',{confirmEmail:'other@example.invalid'})).code,400);
  assert.equal((await call('put /students/:id/access',{deactivated:'false'})).code,400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM students').get().n,2);
  assert.equal((await call('delete /students/:id',{confirmEmail:'learner@example.invalid'},'super_admin','missing')).code,404);
});

test('deactivation revokes sessions immediately and reactivation preserves membership and saved work',async t=>{
  const {db,insert,call}=fixture(t);
  insert('student_sessions',{token_hash:'session',student_id:'learner'});
  insert('student_tasks',{id:'task',student_id:'learner'});
  insert('memberships',{id:'membership',student_id:'learner'});
  assert.equal((await call('put /students/:id/access',{deactivated:true})).code,200);
  assert.equal(db.prepare('SELECT is_suspended FROM students WHERE id=?').get('learner').is_suspended,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM student_sessions').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM memberships').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM student_tasks').get().n,1);
  assert.equal((await call('put /students/:id/access',{deactivated:false})).code,200);
  assert.equal(db.prepare('SELECT is_suspended FROM students WHERE id=?').get('learner').is_suspended,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM student_sessions').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM admin_audit_logs').get().n,2);
});

test('permanent deletion clears dependants and Google re-registration creates a fresh identity without affecting others',async t=>{
  const {db,insert,call}=fixture(t);
  for(const id of ['learner','other']) {
    for(const table of ['student_tasks','lecture_history','student_saved_questions','student_progress','student_exam_history','test_attempts','cart_items','memberships','payment_orders','user_auth_identities']) insert(table,{...(table==='lecture_history'||table==='student_saved_questions'?{}:{id:table+'-'+id}),student_id:id,...(table==='user_auth_identities'?{provider:'google',provider_subject:'google-'+id}:{})});
    insert('student_sessions',{token_hash:'token-'+id,student_id:id});
    insert('student_otps',{id:'otp-'+id,email:id+'@example.invalid'});
  }
  insert('coupon_reservations',{order_id:'payment_orders-learner',coupon_id:'coupon',state:'reserved'});
  insert('payment_events',{id:'event',order_id:'payment_orders-learner'});
  insert('transactional_notifications',{id:'notice',recipient_email:'learner@example.invalid',related_order_id:'payment_orders-learner'});
  insert('email_logs',{id:'email',recipient:'learner@example.invalid'});
  assert.equal((await call('delete /students/:id',{confirmEmail:'learner@example.invalid'})).code,200);
  assert.equal(db.prepare('SELECT * FROM students WHERE id=?').get('learner'),undefined);
  for(const table of ['student_sessions','user_auth_identities','student_tasks','lecture_history','student_saved_questions','student_progress','student_exam_history','test_attempts','cart_items','memberships','payment_orders']) assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE student_id=?`).get('learner').n,0,table);
  for(const table of ['coupon_reservations','payment_events','transactional_notifications','email_logs'])assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n,0,table);
  assert.ok(db.prepare('SELECT * FROM students WHERE id=?').get('other'));
  const result=await resolveGoogleStudent({sub:'google-learner',email:'learner@example.invalid',fullName:'Fresh Learner',picture:'',phone:'9876543210'},'127.0.0.1',{database:db,logActivity:async()=>{}});
  assert.equal(result.isNewUser,true);assert.notEqual(result.student.id,'learner');
  assert.equal(result.student.onboarding_state,'verified_pending_payment');
});

test('failure rolls back deletion and session revocation instead of leaving a partial account',async t=>{
  const {db,insert,call}=fixture(t);
  insert('student_sessions',{token_hash:'session',student_id:'learner'});
  db.exec("CREATE TRIGGER refuse_delete BEFORE DELETE ON students BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
  assert.equal((await call('delete /students/:id',{confirmEmail:'learner@example.invalid'})).code,500);
  assert.ok(db.prepare('SELECT * FROM students WHERE id=?').get('learner'));
  assert.ok(db.prepare('SELECT * FROM student_sessions WHERE token_hash=?').get('session'));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM admin_audit_logs').get().n,0);
});

test('all existing student sessions and new session attempts are blocked while deactivated',async t=>{
  const {db,call}=fixture(t);
  const session={studentId:'learner',tokenHash:'old-token',expiresAt:'2099-01-01T00:00:00.000Z',createdAt:new Date().toISOString()};
  await storeStudentSession(db,session);
  assert.equal((await activeSessionStudent(db,session)).id,'learner');
  assert.equal(await activeSessionStudent(db,{...session,studentId:'other'}),null);
  await call('put /students/:id/access',{deactivated:true});
  assert.equal(await activeSessionStudent(db,session),null);
  await assert.rejects(()=>storeStudentSession(db,{...session,tokenHash:'new-token'}),/unavailable/);
  await call('put /students/:id/access',{deactivated:false});
  assert.equal(await activeSessionStudent(db,session),null);
  await storeStudentSession(db,{...session,tokenHash:'fresh-token'});
  assert.equal((await activeSessionStudent(db,{...session,tokenHash:'fresh-token'})).id,'learner');
  await call('delete /students/:id',{confirmEmail:'learner@example.invalid'});
  assert.equal(await activeSessionStudent(db,{...session,tokenHash:'fresh-token'}),null);
});
