import React, { useState } from 'react';
import { Check, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import MembershipSelectionModal from './MembershipSelectionModal';

export default function WarmPricingSection() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: '1m',
      duration: '1 Month',
      tierName: 'Intensive Sprint',
      validityDays: 30,
      badge: 'Rapid Revision',
      featured: false,
      summary: 'Ideal for final-month AIAPGET drills or targeted BAMS university exam preparation.'
    },
    {
      id: '3m',
      duration: '3 Months',
      tierName: 'Semester Foundation',
      validityDays: 90,
      badge: 'Subject Focus',
      featured: false,
      summary: 'Comprehensive module-by-module coverage with active testing across core Samhitas.'
    },
    {
      id: '6m',
      duration: '6 Months',
      tierName: 'Competitive Complete',
      validityDays: 180,
      badge: 'Most Comprehensive',
      featured: false,
      summary: 'Deep conceptual mastery of Brihattrayi & Laghuttrayi with cumulative mock series.'
    },
    {
      id: '12m',
      duration: '12 Months',
      tierName: 'Annual Academic Mastery',
      validityDays: 365,
      badge: 'Full Academic Year',
      featured: true,
      summary: 'Year-long unfettered access. Complete curriculum with continuous live sync updates.'
    }
  ];

  return (
    <section id="pricing" className="v3-pricing-section" aria-label="Membership Plans">
      <div className="v3-container">
        <h2 className="v3-section-heading">
          Four Disciplined Durations. Uncompromised Access.
        </h2>
        <p className="v3-section-desc">
          Every membership tier includes identical access to all video lectures, question banks, and clinical notes. Select the duration that matches your academic horizon.
        </p>

        {/* 4 Cards Grid */}
        <div className="v3-pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`v3-pricing-card ${plan.featured ? 'featured' : ''}`}
            >
              {plan.featured && (
                <div className="v3-featured-pill">
                  Recommended Tier
                </div>
              )}

              <div>
                <div className="v3-plan-duration">
                  {plan.duration}
                </div>
                <div className="v3-plan-subtitle">
                  {plan.tierName}
                </div>
                <div className="v3-plan-badge">
                  {plan.badge} • {plan.validityDays} Days Validity
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5', minHeight: '52px', marginBottom: '1.25rem' }}>
                  {plan.summary}
                </p>

                <ul className="v3-plan-bullets">
                  <li className="v3-plan-bullet-item">
                    <Check size={14} />
                    <span>Complete Video Lectures</span>
                  </li>
                  <li className="v3-plan-bullet-item">
                    <Check size={14} />
                    <span>Full Question Bank & Mocks</span>
                  </li>
                  <li className="v3-plan-bullet-item">
                    <Check size={14} />
                    <span>Downloadable Study Notes</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={plan.featured ? 'v3-btn-primary' : 'v3-btn-secondary'}
                  style={{ width: '100%', padding: '0.55rem' }}
                >
                  <span>Choose Membership</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Shared Inclusions Matrix */}
        <div className="v3-shared-inclusions">
          <div className="v3-inclusion-item">
            <ShieldCheck size={16} color="var(--brand-terracotta)" />
            <span>Full Brihattrayi & Laghuttrayi Video Archive</span>
          </div>
          <div className="v3-inclusion-item">
            <ShieldCheck size={16} color="var(--brand-terracotta)" />
            <span>Timed AIAPGET Tests with Negative Marking</span>
          </div>
          <div className="v3-inclusion-item">
            <ShieldCheck size={16} color="var(--brand-terracotta)" />
            <span>Cross-Device Compatibility (Desktop, iPad, Phone)</span>
          </div>
          <div className="v3-inclusion-item">
            <ShieldCheck size={16} color="var(--brand-terracotta)" />
            <span>Verified Admissions Assistance (+91 8795776006)</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedPlan && (
        <MembershipSelectionModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </section>
  );
}

