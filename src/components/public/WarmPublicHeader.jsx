import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, Moon, Menu, X, ArrowRight, ShieldCheck, Sparkles, 
  Home, Compass, Award, Headphones, ChevronRight, Phone, MessageCircle 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function WarmPublicHeader() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    let frame=0;
    const updateScroll = () => {
      frame=0;
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      // Section detection
      const sections = ['hero', 'pricing', 'pillars', 'footer'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    const handleScroll=()=>{ if(!frame) frame=requestAnimationFrame(updateScroll); };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => { window.removeEventListener('scroll', handleScroll); cancelAnimationFrame(frame); };
  }, []);

  // Lock background body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header 
        className={`v3-header-wrapper ${scrolled ? 'is-floating-scrolled' : ''}`} 
        role="banner"
      >
        <nav className={`v3-header-pill ${scrolled ? 'is-scrolled' : ''}`} aria-label="Main Navigation">
          {/* Authentic Brand Lockup with Round Cropped Logo Mark */}
          <Link to="/" className="v3-brand-link" aria-label="Pratyaksh Ayurveda Homepage">
            <img
              src="/assets/website-assets/img/logo-round.svg" width="48" height="48"
              alt="Pratyaksh Ayurveda"
              className="v3-brand-logo-round"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/website-assets/img/logo.svg';
              }}
            />
            <span className="v3-brand-title d-none d-sm-inline-block">Pratyaksh</span>
          </Link>

          {/* Desktop Nav Links: Home -> Memberships -> Platform -> Support */}
          <ul className="v3-nav-links">
            <li className="v3-nav-item">
              <button 
                type="button" 
                onClick={() => scrollToSection('hero')}
                className={activeSection === 'hero' ? 'is-active' : ''}
              >
                Home
              </button>
            </li>
            <li className="v3-nav-item">
              <button 
                type="button" 
                onClick={() => scrollToSection('pricing')}
                className={activeSection === 'pricing' ? 'is-active' : ''}
              >
                Memberships
              </button>
            </li>
            <li className="v3-nav-item">
              <button 
                type="button" 
                onClick={() => scrollToSection('pillars')}
                className={activeSection === 'pillars' ? 'is-active' : ''}
              >
                Platform
              </button>
            </li>
            <li className="v3-nav-item">
              <button 
                type="button" 
                onClick={() => scrollToSection('footer')}
                className={activeSection === 'footer' ? 'is-active' : ''}
              >
                Support
              </button>
            </li>
          </ul>

          {/* Actions: Theme Toggle, Login, Register, Mobile/Tablet Menu */}
          <div className="v3-header-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="v3-theme-btn"
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <Link to="/login" className="v3-btn-secondary v3-header-signin-btn">
              Sign In
            </Link>

            <Link to="/register" className="v3-btn-primary v3-btn-shimmer v3-header-cta">
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>

            {/* Mobile/Tablet Hamburger Toggle */}
            <button
              type="button"
              className="v3-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </nav>
      </header>

      {/* Slide-in Mobile & iPad Drawer */}
      {mobileMenuOpen && (
        <div className="v3-drawer-container">
          <div 
            className="v3-drawer-backdrop" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside 
            className="v3-mobile-drawer" 
            role="dialog" 
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            {/* Drawer Header */}
            <div className="v3-mobile-drawer-header">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="v3-drawer-brand">
                <img
                  src="/assets/website-assets/img/logo-round.svg" width="48" height="48"
                  alt="Pratyaksh Ayurveda"
                  className="v3-drawer-logo-round"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/website-assets/img/logo.svg';
                  }}
                />
                <span className="v3-drawer-brand-title">Pratyaksh</span>
                <span className="v3-drawer-badge">V3 Academic</span>
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="v3-theme-btn"
                  title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="v3-drawer-close-btn"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Navigation Cards List */}
            <div className="v3-drawer-body">
              <div className="v3-drawer-section-label">Navigation Menu</div>
              <nav className="v3-drawer-nav">
                <button
                  type="button"
                  onClick={() => scrollToSection('hero')}
                  className={`v3-drawer-item ${activeSection === 'hero' ? 'is-active' : ''}`}
                >
                  <div className="v3-drawer-item-icon">
                    <Home size={18} />
                  </div>
                  <div className="v3-drawer-item-content">
                    <div className="v3-drawer-item-title">Home</div>
                    <div className="v3-drawer-item-sub">Classical wisdom for modern scholars</div>
                  </div>
                  <ChevronRight size={16} className="v3-drawer-item-arrow" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('pricing')}
                  className={`v3-drawer-item ${activeSection === 'pricing' ? 'is-active' : ''}`}
                >
                  <div className="v3-drawer-item-icon">
                    <Award size={18} />
                  </div>
                  <div className="v3-drawer-item-content">
                    <div className="v3-drawer-item-title">Membership Plans</div>
                    <div className="v3-drawer-item-sub">1, 3, 6 & 12 month uncompromised access</div>
                  </div>
                  <ChevronRight size={16} className="v3-drawer-item-arrow" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('pillars')}
                  className={`v3-drawer-item ${activeSection === 'pillars' ? 'is-active' : ''}`}
                >
                  <div className="v3-drawer-item-icon">
                    <Compass size={18} />
                  </div>
                  <div className="v3-drawer-item-content">
                    <div className="v3-drawer-item-title">Platform Pillars</div>
                    <div className="v3-drawer-item-sub">Brihattrayi lectures & Samhita engine</div>
                  </div>
                  <ChevronRight size={16} className="v3-drawer-item-arrow" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('footer')}
                  className={`v3-drawer-item ${activeSection === 'footer' ? 'is-active' : ''}`}
                >
                  <div className="v3-drawer-item-icon">
                    <Headphones size={18} />
                  </div>
                  <div className="v3-drawer-item-content">
                    <div className="v3-drawer-item-title">Admissions Helpline</div>
                    <div className="v3-drawer-item-sub">Direct student counseling & admissions desk</div>
                  </div>
                  <ChevronRight size={16} className="v3-drawer-item-arrow" />
                </button>
              </nav>

              {/* Direct Student Counseling Card */}
              <div className="v3-drawer-counseling-card">
                <div className="v3-drawer-counseling-header">
                  <span className="v3-counseling-dot" />
                  <span>Admissions Helpline Available</span>
                </div>
                <div className="v3-drawer-counseling-actions">
                  <a href="tel:+918795776006" className="v3-counseling-btn-call">
                    <Phone size={13} />
                    <span>Call Helpline</span>
                  </a>
                  <a
                    href="https://wa.me/918795776006"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v3-counseling-btn-wa"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="v3-drawer-footer">
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="v3-btn-primary v3-btn-shimmer"
                style={{ width: '100%', height: '46px', textDecoration: 'none' }}
              >
                <span>Create Account / Get Started</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="v3-btn-secondary"
                style={{ width: '100%', height: '44px', textDecoration: 'none' }}
              >
                Student Classroom Login
              </Link>
              <div className="v3-drawer-legal-note">
                © 2026 Pratyaksh Ayurveda • Secure Student Learning Infrastructure
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
