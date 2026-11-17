import React, { useState } from 'react';

export default function StudentAvatar({ user, size = 40 }) {
  const source = user?.avatarUrl || user?.avatar_url || '';
  const [failed, setFailed] = useState('');
  const name = user?.fullName || user?.full_name || user?.name || 'Student';
  return <span style={{ width: size, height: size, flexShrink: 0, borderRadius: '50%', background: 'var(--brand-terracotta)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontWeight: 700, fontSize: size * .36 }}>
    {source && failed !== source ? <img src={source} alt={`${name}'s profile`} referrerPolicy="no-referrer" onError={() => setFailed(source)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.trim().charAt(0).toUpperCase()}
  </span>;
}
