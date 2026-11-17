export async function consumeOneTimeCode(db,id,now=new Date().toISOString()) {
  const result=await db.prepare('UPDATE student_otps SET used_at=? WHERE id=? AND used_at IS NULL AND attempts<5 AND expires_at>?').run(now,id,now);
  return result.changes===1;
}
