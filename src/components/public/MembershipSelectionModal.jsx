import React from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle2, Phone, MessageCircle, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function MembershipSelectionModal({ plan, onClose }) {
  if (!plan) return null;

  return (
    <div className="v3-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="v3-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="v3-modal-close"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'inline-flex', padding: '0.5rem', background: 'var(--bg-accent-tint)', borderRadius: '50%', color: 'var(--brand-terracotta)', marginBottom: '1rem' }}>
          <CheckCircle2 size={28} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {plan.duration} Membership Selected
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {plan.tierName} • Full Access to Video Vault, Question Banks, and Notes for {plan.validityDays} days.
        </p>

        {/* Action Steps */}
        <div style={{ textAlign: 'left', background: 'var(--bg-subtle)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--button-primary-bg)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
              1
            </span>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
              <strong>Create or Sign In to your student account</strong> to register your learning profile.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--button-primary-bg)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
              2
            </span>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
              <strong>Official Activation & Verification</strong> via Admissions Counseling Desk.
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            to={`/register?plan=${encodeURIComponent(plan.id || plan.duration)}`}
            className="v3-btn-primary"
            style={{ width: '100%', padding: '0.65rem' }}
          >
            <UserPlus size={15} />
            <span>Register & Activate Plan</span>
          </Link>

          <Link
            to={`/login?plan=${encodeURIComponent(plan.id || plan.duration)}&returnTo=${encodeURIComponent(`/onboarding?step=payment&plan=${plan.id || plan.duration}`)}`}
            className="v3-btn-secondary"
            style={{ width: '100%', padding: '0.65rem' }}
          >
            <LogIn size={15} />
            <span>Already Enrolled? Sign In</span>
          </Link>

          <a
            href="https://wa.me/918795776006?text=Hello%20Pratyaksh%20Ayurveda,%20I%20am%20interested%20in%20the%20membership"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              color: '#25D366',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none',
              marginTop: '0.25rem'
            }}
          >
            <MessageCircle size={15} />
            <span>Inquire directly via WhatsApp (+91 8795776006)</span>
          </a>
        </div>
      </div>
    </div>
  );
}

