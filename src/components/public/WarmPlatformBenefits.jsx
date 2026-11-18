import React from 'react';
import { 
  BookOpen, 
  CheckSquare, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Brain,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function WarmPlatformBenefits() {
  const scrollToPricing = () => {
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const pillars = [
    {
      img: '/assets/home/ayur-mortar-emblem.webp',
      badge: 'Samhita Authenticity',
      title: 'Classical Brihattrayi Vault',
      description: 'Systematic, chapter-by-chapter clinical video lectures decoding Charaka, Sushruta, and Vagbhata with authentic commentary and clinical shloka pronunciation.'
    },
    {
      img: '/assets/home/aiapget-seal.webp',
      badge: 'National Testing Standard',
      title: 'AIAPGET NTA Mock Simulations',
      description: 'Extensive 10,000+ question bank structured with official negative marking (-1 / +4), percentile ranking algorithms, and instant shloka rationales.'
    },
    {
      icon: <FileText size={28} color="#D97706" />,
      badge: 'High-Yield Retention',
      title: 'Synoptic Revision Notes',
      description: 'Precision revision keys, comparative Samhita tables, and shloka mnemonics crafted specifically for fast recall during intense university exams and AIAPGET.'
    }
  ];

  return (
    <section id="pillars" className="v3-pillars-section" aria-label="Platform Pillars">
      <div className="v3-container">
        {/* Section Heading */}
        <h2 className="v3-section-heading">
          Engineered for Deep Yukti.<br />
          Beyond Superficial Memorization.
        </h2>
        <p className="v3-section-desc">
          Most students struggle with thousands of disconnected Ayurvedic shlokas. Pratyaksh Ayurveda
          connects every formulation to root classical principles, creating permanent understanding.
        </p>

        {/* Feature Spotlight: The Modern Ayurvedic Doctor + Shloka Banner */}
        <div className="v3-yukti-showcase-card">
          <div className="v3-yukti-grid">
            
            {/* Left: Doctor on Laptop Image with Floating Animations */}
            <div className="v3-yukti-image-col">
              <div className="v3-doctor-image-wrapper">
                <img
                  src="/assets/home/doctor-laptop.webp"
                srcSet="/assets/home/doctor-laptop-320.webp 320w, /assets/home/doctor-laptop.webp 640w"
                sizes="(max-width: 767px) calc(100vw - 64px), 380px"
                  width="954" height="914" loading="lazy" decoding="async"
                  alt="Ayurvedic Doctor Working on Modern Laptop"
                  className="v3-doctor-image v3-floating-gentle"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/website-assets/img/object.png';
                  }}
                />

                {/* Floating Metrics Badge */}
                <div className="v3-doctor-badge-floating">
                  <div className="v3-doctor-badge-icon">
                    <Brain size={18} color="#2563EB" />
                  </div>
                  <div className="v3-doctor-badge-text">
                    <span className="v3-doc-title">Applied Clinical Yukti</span>
                    <span className="v3-doc-desc">From Shloka to Outpatient Care</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: The Shloka Banner & Comparative Analysis */}
            <div className="v3-yukti-content-col">
              
              {/* Shloka Graphic Banner with Glow */}
              <div className="v3-shloka-banner-wrapper">
                <img
                  src="/assets/home/shloka-banner.webp" width="800" height="205" loading="lazy" decoding="async"
                  alt="The Future of Ayurveda is: तिष्ठत्युपरि युक्तिज्ञो द्रव्यज्ञानवतां सदा ॥"
                  className="v3-shloka-banner-img"
                />
                <div className="v3-shloka-banner-glow" aria-hidden="true" />
              </div>

              {/* Side-by-Side Comparison: Traditional Cramming vs Pratyaksh Method */}
              <div className="v3-comparison-container">
                <div className="v3-comparison-row v3-row-traditional">
                  <div className="v3-comp-icon">
                    <XCircle size={18} color="#EF4444" />
                  </div>
                  <div className="v3-comp-text">
                    <strong>Traditional Rote Learning:</strong> Memorizing thousands of names and shlokas mechanically without rationale, leading to high error rates and quick exam burnout.
                  </div>
                </div>

                <div className="v3-comparison-row v3-row-pratyaksh">
                  <div className="v3-comp-icon">
                    <CheckCircle2 size={18} color="#16A34A" />
                  </div>
                  <div className="v3-comp-text">
                    <strong>The Pratyaksh Yukti Methodology:</strong> Understand the exact Tridoshic causation, Dravya pharmacodynamics, and patient constitution logic—producing instinctive recall and top national ranks.
                  </div>
                </div>
              </div>

              {/* CTA button inside spotlight */}
              <div style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={scrollToPricing}
                  className="v3-btn-primary"
                  style={{ padding: '0.65rem 1.6rem', fontSize: '0.92rem' }}
                >
                  <span>Select Membership & Begin Learning</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* 3 Core Educational Pillars Grid */}
        <div className="v3-pillars-grid" style={{ marginTop: '3.5rem' }}>
          {pillars.map((item, idx) => (
            <div key={idx} className="v3-pillar-card v3-card-hover-fx">
              <div className="v3-pillar-top-row">
                <div className="v3-pillar-icon-box">
                  {item.img ? (
                    <img loading="lazy" decoding="async" width="64" height="64" src={item.img} alt={item.title} className="v3-pillar-emblem-img" />
                  ) : (
                    item.icon
                  )}
                </div>
                <span className="v3-pillar-tag-badge">{item.badge}</span>
              </div>

              <h3 className="v3-pillar-title">
                {item.title}
              </h3>
              <p className="v3-pillar-text">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
