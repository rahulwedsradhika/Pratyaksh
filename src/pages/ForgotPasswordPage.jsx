import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import '../styles/editorialHomepage.css';
import '../styles/passwordRecovery.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid student email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setLoading(false);
      if (data.status) {
        setSent(true);
      } else {
        setError(data.message || 'Failed to dispatch reset instructions.');
      }
    } catch (err) {
      setLoading(false);
      setError('Network communication failed. Please check your connection.');
    }
  };

  return (
    <div className="v3-public-root recovery-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 500 }}>
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </Link>

        <button type="button" onClick={toggleTheme} className="v3-theme-btn" aria-label="Toggle theme">
          {resolvedTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '2.5rem 2rem', boxShadow: '0 16px 40px rgba(33, 31, 28, 0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Link to="/">
              <img
                src="/assets/website-assets/img/logo.svg"
                alt="Pratyaksh Ayurveda"
                style={{ height: '30px', marginBottom: '1rem' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/logo-dark-text.png'; }}
              />
            </Link>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Reset Password
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Enter your registered email to receive a 6-digit recovery code.
            </p>
          </div>

          {error && (
            <div style={{ background: '#FAEBEA', border: '1px solid #F3C2BF', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#C24136', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EBF5EF', color: '#2D7A4D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle2 size={24} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Recovery Code Sent
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                A 6-digit password recovery code was sent to <strong>{email}</strong>. It expires in 10 minutes.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)}
                className="v3-btn-primary"
                style={{ width: '100%', padding: '0.65rem', textDecoration: 'none' }}
              >
                <span>Enter Code & Reset Password</span>
                <ArrowRight size={15} />
              </button>
              <Link to="/login" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label htmlFor="recovery-email" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scholar@pratyakshayurveda.com"
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="v3-btn-primary"
                style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem' }}
              >
                <span>{loading ? 'Sending Code...' : 'Send Recovery Code'}</span>
                <ArrowRight size={15} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <Link to="/login" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Remembered your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

