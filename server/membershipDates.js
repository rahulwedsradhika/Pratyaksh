// SQLite interprets timestamps without an offset as UTC. Preserve that behaviour
// without MySQL string/date functions or connection-collation assumptions.
export function membershipExpiryTime(value) {
  if (typeof value !== 'string' || !value.trim()) return NaN;
  let date = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) date += 'T00:00:00Z';
  else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(date)) date = date.replace(' ', 'T') + 'Z';
  return Date.parse(date);
}

export function newestMembershipsFirst(rows) {
  return [...rows].sort((a,b) => {
    const left=membershipExpiryTime(a.expiry_date),right=membershipExpiryTime(b.expiry_date);
    const l=Number.isFinite(left)?left:-Infinity,r=Number.isFinite(right)?right:-Infinity;
    return l===r?0:r-l;
  });
}

export async function findUnexpiredMembership(database,email,{activeOnly=false,now=Date.now()}={}) {
  const rows=await database.prepare(`SELECT m.id,m.expiry_date FROM memberships m
    JOIN students s ON s.id=m.student_id
    WHERE lower(trim(s.email))=?${activeOnly?" AND m.status='active'":''}
  `).all(String(email||'').trim().toLowerCase());
  return newestMembershipsFirst(rows.filter(row=>membershipExpiryTime(row.expiry_date)>now))[0];
}
