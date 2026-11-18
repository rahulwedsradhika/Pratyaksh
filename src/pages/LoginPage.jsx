import {useGoogleButtonWidth} from '../components/auth/useGoogleButtonWidth';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../styles/editorialHomepage.css';

export default function LoginPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { 
    user,
    studentState,
    loginWithPassword, 
    loginWithGoogle, 
    sendEmailOtp, 
    verifyEmailOtp 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const planParam = searchParams.get('plan');
  const returnTo = location.state?.from || searchParams.get('returnTo') || (planParam ? `/onboarding?step=payment&plan=${encodeURIComponent(planParam)}` : '/app');
  const isSwitching = searchParams.get('switch') === 'true';

  // Automatically redirect already authenticated students
  useEffect(() => {
    if (user && !isSwitching) {
      navigate(studentState === 'awaiting_payment' ? '/payment-status' : returnTo, { replace: true });
    }
  }, [user, studentState, isSwitching, navigate, returnTo]);

  // Mode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');

  // Google Identity Services (GIS) State
  const [googleConfig, setGoogleConfig] = useState({ enabled: false, clientId: null });
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleButtonWidth=useGoogleButtonWidth('google-student-signin-slot',googleConfig.enabled && Boolean(googleConfig.clientId));
  const googleLoginRef=useRef(loginWithGoogle);googleLoginRef.current=loginWithGoogle;

  // Fetch Public Authentication Providers Configuration
  useEffect(() => {
    fetch('/api/public/auth/providers')
      .then(r => r.json())
      .then(d => {
        if (d?.status && d?.providers?.google) {
          setGoogleConfig(d.providers.google);
        }
      })
      .catch(err => console.warn('[Auth] Providers config fetch error:', err));
  }, []);

  // Dynamically Load Google Identity Services Script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Render Official Google Sign-In Button when Enabled
  useEffect(() => {
    if (!googleButtonWidth || !gisLoaded || !googleConfig.enabled || !googleConfig.clientId || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleConfig.clientId,
        callback: async (response) => {
          if (!response?.credential) return;
          setLoading(true);
          setStatusMessage({ type: '', text: '' });
          const res = await googleLoginRef.current(response.credential);
          if (res.success) {
            setStatusMessage({ type: 'success', text: 'Welcome! Signed in with Google. Entering classroom...' });
            setTimeout(() => navigate(returnTo, { replace: true }), 400);
          } else {
            setStatusMessage({ type: 'error', text: res.error || 'Google authentication failed.' });
          }
          setLoading(false);
        },
        auto_select: false
      });

      const container = document.getElementById('google-student-signin-slot');
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: googleButtonWidth
        });
      }
    } catch (err) {
      console.error('[GoogleGIS] Initialization error:', err);
    }
  }, [gisLoaded, googleConfig, resolvedTheme, navigate, returnTo, googleButtonWidth]);

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login State
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Loading State
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Handle Password Submit
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const result = await loginWithPassword({ email: email.trim(), password });
      if (result.success) {
        setStatusMessage({ type: 'success', text: 'Welcome back! Redirecting to classroom...' });
        setTimeout(() => navigate(returnTo, { replace: true }), 400);
      } else {
        setStatusMessage({ 
          type: 'error', 
          text: result.error || 'Invalid email or password. Please try again.'
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setStatusMessage({ 
        type: 'error', 
        text: 'Connection failed. Please check your network and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) {
      setStatusMessage({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await sendEmailOtp(email.trim(), 'login');
      if (res.success) {
        setOtpSent(true);
        setResendCooldown(45);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setStatusMessage({ 
          type: 'success', 
          text: `Verification code sent to ${email}. Check your inbox!` 
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to send OTP.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Could not send verification code.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Input Change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Please enter the full 6-digit verification code.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await verifyEmailOtp({ email: email.trim(), otp: code, purpose: 'login' });
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Verified successfully! Entering classroom...' });
        setTimeout(() => navigate(returnTo, { replace: true }), 400);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Invalid or expired OTP code.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Signed in with Google! Entering classroom...' });
        setTimeout(() => navigate(returnTo, { replace: true }), 400);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Google authentication could not be completed.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Google sign-in encountered an error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v3-public-root auth-form-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'transparent' }}>
      {/* Mini Header */}
      <header style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 500 }}>
          <ArrowLeft size={16} />
          <span>Back to Homepage</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="v3-theme-btn"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem' }}>
        <div className="auth-form-card" style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '2.25rem 2rem', boxShadow: '0 16px 40px rgba(33, 31, 28, 0.06)' }}>
          {/* Logo & Headline */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem', textDecoration: 'none' }} title="Return to Homepage">
              <img
                src="/assets/website-assets/img/logo.svg"
                alt="Pratyaksh Ayurveda"
                style={{ height: '42px', width: 'auto', maxWidth: '270px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/logo-dark-text.png'; }}
              />
            </Link>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Student Classroom Sign In
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Access AIAPGET video lectures, samhita notes, and mock tests
            </p>
          </div>

          {/* Selected Plan Notice */}
          {planParam && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: 'rgba(30, 64, 175, 0.08)',
                color: 'var(--admin-primary, #1E40AF)',
                border: '1px solid rgba(30, 64, 175, 0.2)'
              }}
            >
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Enrolment in progress:</strong> Sign in to proceed to checkout with your selected plan intact.
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {statusMessage.text && (
            <div
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                backgroundColor: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                color: statusMessage.type === 'error' ? '#DC2626' : '#15803D',
                border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
              }}
            >
              {statusMessage.type === 'error' ? <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} /> : <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Tab Selector: Password vs Fast OTP */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setStatusMessage({ type: '', text: '' }); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '7px',
                border: 'none',
                background: authMode === 'password' ? 'var(--bg-surface)' : 'transparent',
                color: authMode === 'password' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: authMode === 'password' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('otp'); setStatusMessage({ type: '', text: '' }); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '7px',
                border: 'none',
                background: authMode === 'otp' ? 'var(--bg-surface)' : 'transparent',
                color: authMode === 'otp' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: authMode === 'otp' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Fast OTP Login
            </button>
          </div>

          {/* Social Sign-In (Official Google Identity Services) */}
          {googleConfig.enabled && googleConfig.clientId && (
            <>
              <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
                <div id="google-student-signin-slot" style={{ minHeight: '44px', width: '100%', display: 'flex', justifyContent: 'center' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ padding: '0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or with email</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>
            </>
          )}

          {/* Form 1: Password Login */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scholar@pratyakshayurveda.com"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Password
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--brand-terracotta)', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="v3-btn-primary"
                style={{ width: '100%', padding: '0.7rem', marginTop: '0.5rem', justifyContent: 'center' }}
              >
                <span>{loading ? 'Authenticating...' : 'Sign In with Password'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Form 2: OTP Login */}
          {authMode === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Registered Email Address
                </label>
                <div className="auth-email-row" style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      disabled={otpSent}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar@pratyakshayurveda.com"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || !email}
                      className="v3-btn-secondary"
                      style={{ whiteSpace: 'nowrap', padding: '0.65rem 1rem', fontSize: '0.82rem' }}
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Enter 6-Digit Code
                    </label>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleSendOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--brand-terracotta)',
                        fontSize: '0.78rem',
                        cursor: resendCooldown > 0 ? 'default' : 'pointer',
                        padding: 0
                      }}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <div className="auth-otp-digits" style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '0.75rem 0' }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`login-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        style={{
                          width: '42px',
                          height: '46px',
                          textAlign: 'center',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: digit ? '2px solid var(--brand-terracotta)' : '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpDigits.join('').length !== 6}
                    className="v3-btn-primary"
                    style={{ width: '100%', padding: '0.7rem', marginTop: '0.5rem', justifyContent: 'center' }}
                  >
                    <span>{loading ? 'Verifying Code...' : 'Verify & Enter Classroom'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Navigation */}
          <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Not enrolled yet?{' '}
            <Link to="/onboarding" style={{ color: 'var(--brand-terracotta)', fontWeight: 600, textDecoration: 'none' }}>
              Choose a Membership Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
