import React, { useCallback, useEffect, useState } from 'react';
import { MailPlus, RefreshCw, ShieldCheck, UserRoundX } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminAccessPage() {
  const { request, adminUser } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('support_staff');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const owner = adminUser?.email?.toLowerCase() === 'mukeshk65018@gmail.com' && adminUser?.role === 'super_admin';

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { const data = await request('/api/admin/admins'); setAdmins(data.admins || []); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }, [request]);
  useEffect(() => { if (owner) load(); }, [owner, load]);

  const invite = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const data = await request('/api/admin/admins', { method: 'POST', body: JSON.stringify({ email, role }) });
      setNotice(data.message || 'Administrator invited.'); setEmail(''); await load();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  const revoke = async (admin) => {
    if (!window.confirm(`Revoke administrator access for ${admin.email}? Their active sessions will end immediately.`)) return;
    setBusy(true); setError(''); setNotice('');
    try { const data = await request(`/api/admin/admins/${encodeURIComponent(admin.id)}`, { method: 'DELETE' }); setNotice(data.message); await load(); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  if (!owner) return <div className="admin-card" style={{ padding: 28 }}>Only the superadmin can manage administrator access.</div>;
  return <div style={{ maxWidth: 1150, margin: '0 auto' }}>
    <div style={{ marginBottom: 24 }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#2445b6', fontWeight: 750, fontSize: 13 }}><ShieldCheck size={17} /> SUPERADMIN CONTROL</div><h1 style={{ margin: '8px 0', color: 'var(--admin-text-primary)' }}>Administrator access</h1><p style={{ margin: 0, color: 'var(--admin-text-secondary)' }}>Invite staff by Gmail. Each invited admin signs in with OTP or Google and completes their profile before accessing the portal.</p></div>
    {error && <div role="alert" style={{ padding: 12, marginBottom: 14, color: '#9a3024', background: '#fff0ee', borderRadius: 9 }}>{error}</div>}
    {notice && <div role="status" style={{ padding: 12, marginBottom: 14, color: '#21623c', background: '#effaf2', borderRadius: 9 }}>{notice}</div>}
    <section className="admin-card" style={{ padding: 22, marginBottom: 20 }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Invite an administrator</h2>
      <form onSubmit={invite} style={{ display: 'grid', gridTemplateColumns: 'minmax(190px,1fr) minmax(170px,.6fr) auto', gap: 12, alignItems: 'end' }}>
        <label style={{ display: 'grid', gap: 7, color: 'var(--admin-text-secondary)', fontWeight: 650 }}>Gmail address<input className="admin-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@gmail.com" /></label>
        <label style={{ display: 'grid', gap: 7, color: 'var(--admin-text-secondary)', fontWeight: 650 }}>Role<select className="admin-input" value={role} onChange={e => setRole(e.target.value)}><option value="support_staff">Support staff</option><option value="admissions_staff">Admissions staff</option><option value="finance_staff">Finance staff</option></select></label>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy} style={{ minHeight: 44 }}><MailPlus size={17} /> Invite admin</button>
      </form>
    </section>
    <section className="admin-card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 18 }}>Administrators ({admins.length})</h2><button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={load} disabled={busy}><RefreshCw size={15} /> Refresh</button></div>
      <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760, fontSize: 13 }}><thead><tr style={{ textAlign: 'left', color: 'var(--admin-text-muted)' }}>{['Administrator', 'Role', 'Contact profile', 'Access status', 'Last sign in', ''].map(item => <th key={item} style={{ padding: '10px 9px', borderBottom: '1px solid var(--admin-border-subtle)' }}>{item}</th>)}</tr></thead>
        <tbody>{admins.map(admin => <tr key={admin.id}>
          <td style={{ padding: '13px 9px', borderBottom: '1px solid var(--admin-border-subtle)' }}><strong>{admin.full_name || 'Profile setup required'}</strong><div style={{ color: 'var(--admin-text-muted)', marginTop: 3, overflowWrap: 'anywhere' }}>{admin.email}</div></td>
          <td style={{ padding: 9, borderBottom: '1px solid var(--admin-border-subtle)', textTransform: 'capitalize' }}>{admin.role.replaceAll('_', ' ')}</td>
          <td style={{ padding: 9, borderBottom: '1px solid var(--admin-border-subtle)', maxWidth: 260 }}><div>{admin.phone || 'Mobile pending'}</div><div style={{ color: 'var(--admin-text-muted)', marginTop: 3, overflowWrap: 'anywhere' }}>{admin.address || 'Address pending'}</div></td>
          <td style={{ padding: 9, borderBottom: '1px solid var(--admin-border-subtle)' }}><span className={`admin-badge ${admin.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}>{admin.is_active ? (admin.onboarding_complete ? 'Active' : 'Onboarding required') : 'Revoked'}</span></td>
          <td style={{ padding: 9, borderBottom: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-muted)' }}>{admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Never'}</td>
          <td style={{ padding: 9, borderBottom: '1px solid var(--admin-border-subtle)', textAlign: 'right' }}>{admin.is_active && admin.email.toLowerCase() !== 'mukeshk65018@gmail.com' && <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => revoke(admin)} disabled={busy} title="Revoke access"><UserRoundX size={15} /> Revoke</button>}</td>
        </tr>)}</tbody></table></div>
      {!admins.length && !busy && <p style={{ color: 'var(--admin-text-muted)' }}>No administrator accounts found.</p>}
    </section>
  </div>;
}
