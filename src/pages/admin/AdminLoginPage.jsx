import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, Mail, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/adminDesignSystem.css';

const OWNER_EMAIL = 'mukeshk65018@gmail.com';

export default function AdminLoginPage() {
  const { requestAdminOtp, verifyAdminOtp, loginWithGoogle, isAuthenticated, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const googleLoginRef = useRef(loginWithGoogle);
  googleLoginRef.current = loginWithGoogle;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [step, setStep] = useState('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate(adminUser?.onboardingComplete ? '/admin' : '/admin/onboarding', { replace: true });
  }, [isAuthenticated, adminUser, navigate]);

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) return;
    setBusy(true); setError('');
    const result = await googleLoginRef.current(response.credential);
    setBusy(false);
    if (result.success) navigate(result.admin?.onboardingComplete ? '/admin' : '/admin/onboarding', { replace: true });
    else setError(result.error);
  }, [navigate]);

  useEffect(() => {
    let active = true;
    fetch('/api/public/auth/providers').then(r => r.json()).then(data => {
      const google = data?.providers?.google;
      if (active) { setGoogleEnabled(Boolean(google?.enabled)); setGoogleClientId(google?.clientId || ''); }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!googleEnabled || !googleClientId || !googleButtonRef.current) return undefined;
    let stopped = false;
    const draw = () => {
      if (stopped || !window.google?.accounts?.id || !googleButtonRef.current) return false;
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential, ux_mode: 'popup' });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular',
        width: Math.min(380, googleButtonRef.current.clientWidth || 380), logo_alignment: 'left'
      });
      return true;
    };
    if (draw()) return () => { stopped = true; };
    let script = document.querySelector('script[data-google-identity]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.dataset.googleIdentity = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', draw);
    return () => { stopped = true; script.removeEventListener('load', draw); };
  }, [googleEnabled, googleClientId, handleGoogleCredential]);

  const sendCode = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const result = await requestAdminOtp(email.trim().toLowerCase());
    setBusy(false);
    if (result.success) { setStep('code'); setNotice(result.message || 'Check your inbox for the sign-in code.'); }
    else setError(result.error);
  };

  const submitCode = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const result = await verifyAdminOtp(email.trim().toLowerCase(), code.trim());
    setBusy(false);
    if (result.success) navigate(result.admin?.onboardingComplete ? '/admin' : '/admin/onboarding', { replace: true });
    else setError(result.error);
  };

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 18px', background: 'radial-gradient(circle at 50% 0%, #fff8ef 0, var(--admin-bg-base) 48%)' }}>
    <section style={{ width: '100%', maxWidth: 470 }}>
      <header style={{ textAlign: 'center', marginBottom: 25 }}>
        <Link to="/" aria-label="Pratyaksh Ayurveda home"><img src="/assets/website-assets/img/logo.svg" alt="Pratyaksh Ayurveda" style={{ height: 48, maxWidth: '100%', objectFit: 'contain', marginBottom: 22 }} /></Link>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: '#2042b5', border: '1px solid #c8d5ff', background: '#f2f5ff', borderRadius: 99, padding: '7px 13px', fontSize: 12, fontWeight: 750, letterSpacing: '.05em' }}><ShieldCheck size={15} /> ADMINISTRATOR PORTAL</span></div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.6rem, 6vw, 2rem)', color: 'var(--admin-text-primary)', fontWeight: 800 }}>Secure sign in</h1>
        <p style={{ margin: 0, color: 'var(--admin-text-secondary)', lineHeight: 1.55 }}>Authorized administrators only. Sign in with your invited Gmail account.</p>
      </header>

      <div className="admin-card" style={{ padding: 'clamp(22px, 6vw, 34px)', borderRadius: 22, boxShadow: '0 18px 60px rgba(35,48,72,.09)' }}>
        {error && <div role="alert" style={{ padding: '12px 14px', marginBottom: 18, borderRadius: 10, color: 'var(--admin-danger-text)', background: 'var(--admin-danger-bg)', border: '1px solid var(--admin-danger-border)', lineHeight: 1.45 }}>{error}</div>}
        {notice && <div role="status" style={{ display: 'flex', gap: 8, padding: '12px 14px', marginBottom: 18, borderRadius: 10, color: '#21623c', background: '#effaf2', border: '1px solid #ccebd4', lineHeight: 1.45 }}><CheckCircle2 size={18} />{notice}</div>}

        {step === 'email' ? <form onSubmit={sendCode}>
          <label htmlFor="admin-email" style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: 'var(--admin-text-secondary)' }}>Administrator Gmail address</label>
          <div style={{ position: 'relative', marginBottom: 18 }}><Mail size={17} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--admin-text-muted)' }} /><input id="admin-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={OWNER_EMAIL} className="admin-input" style={{ paddingLeft: 42, minHeight: 48 }} /></div>
          <button type="submit" disabled={busy} className="admin-btn admin-btn-primary" style={{ width: '100%', minHeight: 50, fontSize: 15 }}>{busy ? <><LoaderCircle size={17} className="spin" /> Sending code…</> : <>Send a sign-in code <ArrowRight size={17} /></>}</button>
        </form> : <form onSubmit={submitCode}>
          <div style={{ marginBottom: 14, fontSize: 14, color: 'var(--admin-text-secondary)' }}>Enter the 6-digit code sent to <strong style={{ overflowWrap: 'anywhere' }}>{email}</strong>.</div>
          <label htmlFor="admin-code" style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: 'var(--admin-text-secondary)' }}>Email verification code</label>
          <input id="admin-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="admin-input" style={{ minHeight: 52, textAlign: 'center', fontSize: 22, letterSpacing: '.35em', marginBottom: 16 }} />
          <button type="submit" disabled={busy || code.length !== 6} className="admin-btn admin-btn-primary" style={{ width: '100%', minHeight: 50 }}>{busy ? 'Verifying…' : <>Verify and continue <ArrowRight size={17} /></>}</button>
          <button type="button" disabled={busy} onClick={() => { setStep('email'); setCode(''); setNotice(''); setError(''); }} style={{ border: 0, background: 'none', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: 7, margin: '14px auto 0', cursor: 'pointer' }}><ArrowLeft size={15} /> Change email</button>
        </form>}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '22px 0', color: 'var(--admin-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}><span style={{ height: 1, background: 'var(--admin-border-subtle)', flex: 1 }} /> or continue with <span style={{ height: 1, background: 'var(--admin-border-subtle)', flex: 1 }} /></div>
        {googleEnabled ? <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 42, width: '100%' }} /> : <>
          <button type="button" disabled className="admin-btn admin-btn-secondary" style={{ width: '100%', minHeight: 46, justifyContent: 'center', gap: 10, opacity: .78 }}>
            <span aria-hidden="true" style={{ fontWeight: 800, fontSize: 18, color: '#4285f4' }}>G</span> Continue with Google
          </button>
          <p style={{ margin: '9px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
            Google sign-in needs a valid Web Client ID. The superadmin can finish this in Admin → Google Login after OTP sign-in.
          </p>
        </>}
      </div>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--admin-text-muted)' }}>Admin access is issued by the superadmin. <Link to="/login" style={{ color: '#2042b5' }}>Student sign in</Link></p>
    </section>
  </main>;
}
