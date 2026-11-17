import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import ThemeSwitcher from './ThemeSwitcher';
import StudentProfileMenu from './StudentProfileMenu';

export default function AppHeader() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="app-shell-header">
      {/* Left: Exactly ONE authentic brand identity (no duplicate text) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link 
          to="/" 
          className="app-shell-brand" 
          aria-label="Pratyaksh Ayurveda"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <img
            src="/assets/website-assets/img/logo.svg"
            alt="Pratyaksh Ayurveda"
            style={{ 
              height: '34px', 
              maxHeight: '34px', 
              width: 'auto', 
              display: 'block' 
            }}
            onError={(e) => { e.target.src = '/assets/images/logo-dark-text.png'; }}
          />
        </Link>
      </div>

      {/* Center: Global Search (Desktop & Tablet) */}
      <div className="d-none d-md-block">
        <GlobalSearch />
      </div>

      {/* Right: Mobile Search Toggle, Theme Switcher, Student Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button
          type="button"
          onClick={() => setMobileSearchOpen(prev => !prev)}
          className="editorial-btn editorial-btn-secondary d-md-none"
          style={{
            width: '36px',
            height: '36px',
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Search"
        >
          {mobileSearchOpen ? <X size={16} /> : <Search size={16} />}
        </button>

        <ThemeSwitcher />
        <StudentProfileMenu />
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div
          className="d-md-none"
          style={{
            position: 'absolute',
            top: 'var(--app-header-height)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0.75rem 1rem',
            zIndex: 110,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <GlobalSearch isMobile onClose={() => setMobileSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}
