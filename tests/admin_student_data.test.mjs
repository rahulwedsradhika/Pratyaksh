import test from 'node:test';
import assert from 'node:assert/strict';
import { studentSummary, studentDetail } from '../server/adminStudentData.js';
const student = { id: 'student', full_name: 'Asha Sharma', email: 'asha@example.test', email_verified: 1, is_suspended: 0, password_hash: 'private', invitation_token: 'private' };
test('directory exposes the fields consumed by the UI without authentication secrets', () => {
  const result = studentSummary(student);
  assert.equal(result.name, 'Asha Sharma');assert.equal(result.is_verified, true);assert.equal(result.status, 'active');
  assert.equal(result.password_hash, undefined);assert.equal(result.invitation_token, undefined);
  assert.equal(studentSummary({ ...student, is_suspended: 1 }).status, 'suspended');
});
test('Inspect returns the nested student contract, correct active membership and safe payment fields', () => {
  const memberships = [{ id: 'expired', status: 'active', expiry_date: '2025-01-01', start_date: '2024-01-01' }, { id: 'valid', status: 'active', expiry_date: '2027-01-01', start_date: '2026-01-01', plan_name_snapshot: 'Annual plan' }];
  const result = studentDetail(student, memberships, [{ id: 'order', provider: 'razorpay', provider_payment_id: 'payment', provider_signature: 'secret' }], new Date('2026-11-17'));
  assert.equal(result.student.name, 'Asha Sharma');assert.equal(result.activeMembership.id, 'valid');
  assert.equal(result.activeMembership.plan_name, 'Annual plan');assert.equal(result.activeMembership.expires_at, '2027-01-01');
  assert.equal(result.orders[0].utr_number, 'payment');assert.equal(result.orders[0].provider_signature, undefined);
  assert.equal(studentDetail(student, [], []).activeMembership, null);
});
