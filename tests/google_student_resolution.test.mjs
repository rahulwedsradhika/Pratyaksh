import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {resolveGoogleStudent} from '../server/googleAuthService.js';

function fixture(t) {
  const database=new DatabaseSync(':memory:');t.after(()=>database.close());
  database.exec(`CREATE TABLE students(id TEXT PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT,full_name TEXT,phone TEXT,academic_status TEXT,exam_goal TEXT,auth_provider TEXT,email_verified INTEGER,onboarding_state TEXT,role TEXT,avatar_url TEXT,created_at TEXT,updated_at TEXT);
    CREATE TABLE user_auth_identities(id TEXT PRIMARY KEY,student_id TEXT NOT NULL,provider TEXT,provider_subject TEXT UNIQUE,provider_email TEXT,avatar_url TEXT,linked_at TEXT,last_login_at TEXT);`);
  const entries=[];const options={database,logActivity:async entry=>entries.push(entry)};
  const profile={sub:'verified-google-fixture',email:'learner@example.invalid',fullName:'Fixture Learner',picture:'https://example.invalid/avatar.jpg',phone:'9876543210'};
  return {database,entries,options,profile};
}

test('a returning linked Google account resolves a student before creating a session',async t=>{
  const {database,options,profile,entries}=fixture(t);
  database.prepare('INSERT INTO students(id,email,full_name,phone,email_verified) VALUES (?,?,?,?,1)').run('learner',profile.email,'Saved Name','');
  database.prepare("INSERT INTO user_auth_identities(id,student_id,provider,provider_subject) VALUES ('identity','learner','google',?)").run(profile.sub);
  const result=await resolveGoogleStudent(profile,'127.0.0.1',options);
  assert.equal(result.student.id,'learner');assert.equal(result.student.phone,'+919876543210');assert.equal(result.student.full_name,'Saved Name');assert.equal(typeof result.student.then,'undefined');
  assert.equal(result.isNewUser,false);assert.equal(result.newlyLinked,false);assert.equal(entries[0].userId,'learner');
});

test('linking an existing email returns its real student ID and preserves an existing phone',async t=>{
  const {database,options,profile}=fixture(t);
  database.prepare('INSERT INTO students(id,email,full_name,phone,email_verified) VALUES (?,?,?,?,0)').run('existing',profile.email,'Saved Name','+919000000001');
  const result=await resolveGoogleStudent(profile,'127.0.0.1',options);
  assert.equal(result.student.id,'existing');assert.equal(result.student.phone,'+919000000001');assert.equal(result.student.email_verified,1);
  assert.equal(result.isNewUser,false);assert.equal(result.newlyLinked,true);
  assert.equal(database.prepare('SELECT student_id FROM user_auth_identities').get().student_id,'existing');
});

test('new Google registration and returning sign-in without a phone keep the same student identity',async t=>{
  const {database,options,profile}=fixture(t);
  const first=await resolveGoogleStudent(profile,'127.0.0.1',options);
  assert.ok(first.student.id);assert.equal(first.isNewUser,true);assert.equal(first.student.onboarding_state,'verified_pending_payment');
  const next=await resolveGoogleStudent({...profile,phone:''},'127.0.0.1',options);
  assert.equal(next.student.id,first.student.id);assert.equal(next.student.phone,'+919876543210');
  assert.equal(database.prepare('SELECT COUNT(*) AS n FROM students').get().n,1);
});
