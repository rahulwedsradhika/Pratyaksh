import { db } from './db.js';
import {findUnexpiredMembership} from './membershipDates.js';

export const ACTIVE_MEMBERSHIP_MESSAGE = 'This email already has an active membership. Sign in to use your existing membership. You can renew after it expires.';

export async function findActiveMembership(email, database = db) {
  return findUnexpiredMembership(database,email,{activeOnly:true});
}

export async function assertMembershipEligible(student) {
  const unexpired = await findUnexpiredMembership(db,student.email);
  if (unexpired) {
    const error = new Error(ACTIVE_MEMBERSHIP_MESSAGE);
    error.code = 'ACTIVE_MEMBERSHIP_EXISTS';
    throw error;
  }
}
