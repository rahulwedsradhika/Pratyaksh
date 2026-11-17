import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import '../styles/editorialHomepage.css';
import '../styles/passwordRecovery.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setEmail(searchParams.get('email') || '');
  }, [searchParams]);

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passedCriteria = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const isStrong = passedCriteria >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatusMessage({
        type: 'error',
        text: 'Enter the email address for the account requesting a password reset.'
      });
      return;
    }

    if (!/^[0-9]{6}$/.test(token.trim())) {
      setStatusMessage({ type: 'error', text: 'Enter the 6-digit recovery code from your email.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match. Please re-enter.' });
      return;
    }

    if (!hasMinLength) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: token.trim(), newPassword: password })
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setIsSuccess(true);
        setStatusMessage({
          type: 'success',
          text: data.message || 'Password successfully updated! You can now sign in.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to reset password. The recovery code may have expired.'
        });
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Unable to reach the server. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="v3-public-root recovery-page editorial-auth-page">
      {/* Background Ambience */}
      <div className="editorial-hero-glow" style={{ top: '10%', left: '50%', transform: 'translateX(-50%)', opacity: 0.15 }} />

      <div className="editorial-auth-container">
        {/* Header Branding */}
        <div className="editorial-auth-header">
          <Link to="/" className="editorial-auth-logo" title="Return to Homepage">
            <img
              src="/assets/website-assets/img/logo.svg"
              alt="Pratyaksh Ayurveda"
              style={{ height: '38px', width: 'auto', maxWidth: '260px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/logo-dark-text.png'; }}
            />
          </Link>
          <div className="editorial-badge" style={{ marginTop: '0.75rem' }}>
            <span className="editorial-badge-dot" />
            Secure account recovery
          </div>
        </div>

        {/* Reset Password Card */}
        <div className="editorial-auth-card">
          <div className="editorial-auth-card-title">
            <div className="editorial-icon-badge" style={{ margin: '0 auto 1rem', width: 44, height: 44, borderRadius: 12, background: 'rgba(169,68,47,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A9442F' }}>
              <Lock size={22} />
            </div>
            <h2>Create New Password</h2>
            <p className="editorial-auth-card-sub">
              Enter the 6-digit code sent to your registered email, then choose a new password.
            </p>
          </div>

          {/* Feedback Banner */}
          {statusMessage.text && (
            <div
              className={`editorial-status-banner ${statusMessage.type === 'error' ? 'editorial-status-banner-error' : 'editorial-status-banner-success'}`}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                backgroundColor: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                color: statusMessage.type === 'error' ? '#DC2626' : '#15803D',
                border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
              }}
            >
              {statusMessage.type === 'error' ? <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} /> : <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--editorial-primary)', marginBottom: '0.5rem' }}>Password Secured</h3>
              <p style={{ color: 'var(--editorial-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Your password has been securely updated. You can now log into your student dashboard with your new credentials.
              </p>
              <Link to="/login" className="editorial-btn editorial-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Sign In to Platform <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="editorial-auth-form">
              <div className="editorial-form-field">
                <label htmlFor="recovery-email">Registered Email Address</label>
                <input
                  id="recovery-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="editorial-input"
                />
              </div>

              <div className="editorial-form-field">
                <label htmlFor="reset-token">6-Digit Recovery Code</label>
                <input
                  id="reset-token"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  placeholder="Enter the code from your email"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="editorial-input"
                />
              </div>

              {/* New Password */}
              <div className="editorial-form-field">
                <label htmlFor="new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Enter new password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="editorial-input"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--editorial-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Checklist */}
              {password.length > 0 && (
                <div style={{ backgroundColor: 'var(--editorial-subtle)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid var(--editorial-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasMinLength ? '#15803D' : 'var(--editorial-muted)' }}>
                    <span style={{ fontSize: '10px' }}>{hasMinLength ? '●' : '○'}</span> At least 8 characters
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (hasUpper && hasLower) ? '#15803D' : 'var(--editorial-muted)' }}>
                    <span style={{ fontSize: '10px' }}>{(hasUpper && hasLower) ? '●' : '○'}</span> Uppercase and lowercase letters
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (hasNumber || hasSpecial) ? '#15803D' : 'var(--editorial-muted)' }}>
                    <span style={{ fontSize: '10px' }}>{(hasNumber || hasSpecial) ? '●' : '○'}</span> Number or special character
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="editorial-form-field">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="editorial-input"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--editorial-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !password || !confirmPassword}
                className="editorial-btn editorial-btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="editorial-auth-footer">
            <Link to="/login" className="editorial-auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

