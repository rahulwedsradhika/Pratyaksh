import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function StudentLogout() {
  const { logout } = useAuth();
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      if (localStorage.getItem('ayur_admin_token')) await adminLogout().catch(() => {});
      await logout();
      navigate('/login', { replace: true });
    } finally { setBusy(false); }
  }
  return <section className="editorial-card p-4 mt-4 d-flex align-items-center justify-content-between gap-3 flex-wrap">
    <div><h2 style={{ fontSize: '1rem', fontWeight: 650 }}>Sign out</h2><p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Your tasks, saved questions and history stay in your account.</p></div>
    <button type="button" className="editorial-btn editorial-btn-secondary" style={{ color: 'var(--status-incorrect)' }} disabled={busy} onClick={signOut}><LogOut size={16} />{busy ? 'Signing out…' : 'Log out'}</button>
  </section>;
}
