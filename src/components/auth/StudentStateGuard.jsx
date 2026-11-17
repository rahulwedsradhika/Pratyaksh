import React from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, ShieldAlert, Sparkles, RefreshCw, Home, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentStateGuard({ children, allowExpired = false }) {
  const { user, membership, studentState, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <RefreshCw size={18} className="spin-animation" />
          <span>Verifying student membership state...</span>
        </div>
      </div>
    );
  }

  // 1. Anonymous Visitor -> Gated Access Screen
  if (studentState === 'anonymous' || !user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', backgroundColor: 'var(--bg-canvas)' }}>
        <div style={{ maxWidth: '460px', width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(169, 68, 47, 0.08)', color: 'var(--brand-terracotta)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Lock size={26} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Enrolled Student Classroom
          </h2>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.75rem' }}>
            This learning module is reserved for registered Pratyaksh Ayurveda scholars. 
            Please sign in to your student account or activate a membership to access the full curriculum.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login" className="v3-btn-primary" style={{ width: '100%', padding: '0.65rem', textDecoration: 'none', justifyContent: 'center' }}>
              <span>Sign In to Classroom</span>
              <ArrowRight size={15} />
            </Link>

            <Link to="/onboarding" className="v3-btn-secondary" style={{ width: '100%', padding: '0.65rem', textDecoration: 'none', justifyContent: 'center' }}>
              <span>Get Membership / Register</span>
            </Link>

            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none', marginTop: '0.5rem' }}>
              <Home size={14} />
              <span>Return to Public Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unpaid accounts may view payment recovery only, including profile/settings URLs.
  if (studentState === 'awaiting_payment') return <Navigate to="/payment-status" replace />;

  // 2. Email Verification Pending
  if (studentState === 'email_verification_pending') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', backgroundColor: 'var(--bg-canvas)' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(169, 68, 47, 0.08)', color: 'var(--brand-terracotta)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Email Verification Required
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            A 6-digit verification code was sent to <strong>{user.email}</strong>. Please verify your email to unlock your student profile.
          </p>
          <Link to="/onboarding?step=verify" className="v3-btn-primary" style={{ width: '100%', padding: '0.65rem', textDecoration: 'none', justifyContent: 'center' }}>
            <span>Enter Verification Code</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Awaiting Payment
  if (studentState === 'awaiting_payment') {
    // If accessing membership page itself, allow it
    if (location.pathname === '/membership' || allowExpired) {
      return children;
    }

    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', backgroundColor: 'var(--bg-canvas)' }}>
        <div style={{ maxWidth: '460px', width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(169, 68, 47, 0.08)', color: 'var(--brand-terracotta)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Membership Activation Needed
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Hello {user.full_name || user.name || 'Scholar'}, your student profile is verified. Complete your membership enrollment to begin learning.
          </p>
          <Link to="/membership" className="v3-btn-primary" style={{ width: '100%', padding: '0.65rem', textDecoration: 'none', justifyContent: 'center' }}>
            <span>Complete Membership Checkout</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Membership Expired -> Dignified Renewal Gate (allow /membership and /profile)
  if (studentState === 'membership_expired') {
    if (location.pathname === '/membership' || location.pathname === '/profile' || allowExpired) {
      return children;
    }

    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', backgroundColor: 'var(--bg-canvas)' }}>
        <div style={{ maxWidth: '480px', width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#FAEBEA', color: '#C24136', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <ShieldAlert size={26} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Membership Period Concluded
          </h2>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your Pratyaksh Ayurveda membership has expired. <strong>Your learning notes, saved questions, test results, and bookmarks are 100% safely preserved.</strong> Renew today to resume full video lectures and practice exams.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/membership" className="v3-btn-primary" style={{ width: '100%', padding: '0.65rem', textDecoration: 'none', justifyContent: 'center' }}>
              <span>Renew Membership Plan</span>
              <ArrowRight size={15} />
            </Link>

            <a
              href="https://wa.me/918795776006?text=Hello%20Pratyaksh%20Ayurveda,%20I%20would%20like%20to%20renew%20my%20student%20membership"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', color: '#25D366', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none', padding: '0.5rem' }}
            >
              <MessageCircle size={15} />
              <span>Contact Admissions Helpline (+91 8795776006)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 5. Account Suspended
  if (studentState === 'suspended') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#C24136', marginBottom: '0.5rem' }}>
            Account Under Administrative Review
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            Please contact the administration office at +91 8795776006 to resolve your account status.
          </p>
        </div>
      </div>
    );
  }

  // 6. Active Membership -> Access Granted!
  return children;
}
