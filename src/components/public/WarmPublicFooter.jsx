import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Mail, MapPin, Shield, CheckCircle2 } from 'lucide-react';

export default function WarmPublicFooter() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="v3-footer" role="contentinfo">
      {/* Invisible anchor buffer for smooth scrolling clearance */}
      <div className="v3-footer-anchor-buffer" aria-hidden="true" />

      <div className="v3-container">
        <div className="v3-footer-grid">
          {/* Col 1: Brand & Academic Mission */}
          <div className="v3-footer-brand-col">
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '0.9rem' }}>
              <img
                src="/assets/website-assets/img/logo.svg" width="240" height="60" loading="lazy" decoding="async"
                alt="Pratyaksh Ayurveda"
                className="v3-footer-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/images/logo-dark-text.png';
                }}
              />
            </Link>
            <p className="v3-footer-desc">
              Premier educational technology platform dedicated to classical Ayurveda scholarship, 
              BAMS curriculum mastery, and national AIAPGET entrance excellence.
            </p>
            <div className="v3-footer-badge-pill">
              <CheckCircle2 size={13} color="#16A34A" />
              <span>NCISM Curriculum & AIAPGET High-Yield Verified</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="v3-footer-nav-col">
            <div className="v3-footer-col-title">Navigation</div>
            <ul className="v3-footer-links">
              <li>
                <button type="button" onClick={() => scrollTo('hero')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                  Membership Plans
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('pillars')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                  Platform Pillars
                </button>
              </li>
              <li>
                <Link to="/login">Student Sign In</Link>
              </li>
              <li>
                <Link to="/register">Create Account</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Academic Policies */}
          <div className="v3-footer-policy-col">
            <div className="v3-footer-col-title">Policies & Terms</div>
            <ul className="v3-footer-links">
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
              <li>
                <Link to="/terms#refund">Refund Policy</Link>
              </li>
              <li>
                <Link to="/login">Student Code of Conduct</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Verified Admissions & Support */}
          <div className="v3-footer-support-col">
            <div className="v3-footer-col-title">Admissions & Support</div>
            <ul className="v3-footer-links">
              <li>
                <a href="tel:+918795776006" className="v3-footer-contact-link">
                  <Phone size={14} color="#FCD82E" />
                  <span>+91 8795776006</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/918795776006"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v3-footer-contact-link v3-footer-wa-link"
                >
                  <MessageCircle size={14} color="#25D366" />
                  <span>WhatsApp Counseling Desk</span>
                </a>
              </li>
              <li className="v3-footer-contact-item">
                <Mail size={14} color="#94A3B8" />
                <span>support@pratyakshayurveda.com</span>
              </li>
              <li className="v3-footer-contact-item" style={{ alignItems: 'flex-start' }}>
                <MapPin size={14} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>Varanasi / Lucknow, Uttar Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="v3-footer-bottom">
          <div>
            © {new Date().getFullYear()} Pratyaksh Ayurveda. All classical wisdom and digital rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={13} color="#FCD82E" />
            <span>Secure Student Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
