import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminOnboardingPage() {
  const { adminUser, isAuthenticated, loading, completeAdminProfile } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading secure profile…</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (adminUser?.onboardingComplete) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const result = await completeAdminProfile(form);
    setBusy(false);
    if (result.success) navigate('/admin', { replace: true }); else setError(result.error);
  };

  const field = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', border: '1px solid #ded8d0', borderRadius: 10, background: '#fff', font: 'inherit', color: '#222' };
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'linear-gradient(145deg,#fffaf4,#f4f5f9)' }}>
    <section style={{ width: '100%', maxWidth: 540, background: '#fff', border: '1px solid #eee7de', borderRadius: 22, padding: 'clamp(24px,6vw,40px)', boxShadow: '0 18px 60px rgba(35,48,72,.08)' }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: '#eef2ff', color: '#2445b6', display: 'grid', placeItems: 'center', marginBottom: 20 }}><ShieldCheck size={23} /></div>
      <div style={{ color: '#af4a27', fontSize: 12, letterSpacing: '.08em', fontWeight: 800 }}>ADMINISTRATOR PROFILE · REQUIRED</div>
      <h1 style={{ fontSize: 'clamp(1.7rem,6vw,2.1rem)', margin: '8px 0 8px', color: '#202124' }}>Set up your profile</h1>
      <p style={{ color: '#62666f', lineHeight: 1.55, marginTop: 0 }}>Add your contact details once to finish securing your administrator access.</p>
      <div style={{ padding: '11px 13px', borderRadius: 10, background: '#f7f7f8', color: '#5c6069', fontSize: 14, marginBottom: 20, overflowWrap: 'anywhere' }}>Signed in as <strong>{adminUser?.email}</strong></div>
      {error && <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 9, background: '#fff0ee', color: '#9a3024' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 15 }}>
        <label style={{ display: 'grid', gap: 7, color: '#41444a', fontWeight: 650 }}>Full name<input style={field} autoComplete="name" required minLength={2} maxLength={100} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" /></label>
        <label style={{ display: 'grid', gap: 7, color: '#41444a', fontWeight: 650 }}>Mobile number<input style={field} type="tel" autoComplete="tel" required minLength={7} maxLength={20} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></label>
        <label style={{ display: 'grid', gap: 7, color: '#41444a', fontWeight: 650 }}>Address<textarea style={{ ...field, minHeight: 90, resize: 'vertical' }} autoComplete="street-address" required minLength={8} maxLength={300} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full mailing address" /></label>
        <button type="submit" disabled={busy} className="admin-btn admin-btn-primary" style={{ width: '100%', minHeight: 50, marginTop: 4 }}>{busy ? <><LoaderCircle size={17} /> Saving profile…</> : <>Complete setup <Check size={17} /></>}</button>
      </form>
    </section>
  </main>;
}
