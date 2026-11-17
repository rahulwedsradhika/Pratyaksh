import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  ChartNoAxesColumnIncreasing, 
  ListTodo, 
  Moon, 
  Sun, 
  LifeBuoy, 
  Settings, 
  X, 
  UserRound, 
  ChevronRight,
  CreditCard,
  LogOut
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const studyLinks = [
  { to: '/bookmarks', icon: Bookmark, title: 'Saved Questions', description: 'Review the questions you bookmarked' },
  { to: '/performance', icon: ChartNoAxesColumnIncreasing, title: 'Performance', description: 'Scores, accuracy and test history' },
  { to: '/tasks', icon: ListTodo, title: 'My Tasks', description: 'Your personal study checklist' }
];

const accountLinks = [
  { to: '/membership', icon: CreditCard, title: 'My Membership', description: 'Plan validity, renewals & billing history' },
  { to: '/profile', icon: UserRound, title: 'Student Profile', description: 'Account and learning information' },
  { to: '/settings', icon: Settings, title: 'Settings', description: 'Appearance and learning preferences' }
];

function SheetLink({ item, onClose }) {
  const Icon = item.icon;
  return (
    <Link to={item.to} onClick={onClose} className="more-sheet-link">
      <span className="more-sheet-link-icon" aria-hidden="true"><Icon size={19}/></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="more-sheet-link-title" style={{ display: 'block' }}>{item.title}</span>
        <span className="more-sheet-link-desc" style={{ display: 'block' }}>{item.description}</span>
      </span>
      <ChevronRight size={16} color="var(--text-muted)" aria-hidden="true" />
    </Link>
  );
}

export default function MoreSheet({ isOpen, onClose }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const items = Array.from(document.querySelectorAll('#mobile-more-sheet a[href], #mobile-more-sheet button:not([disabled])'));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    onClose();
    await logout();
    if (showToast) showToast('Signed out of classroom.', 'info');
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="more-sheet-backdrop" onClick={onClose}>
      <section id="mobile-more-sheet" className="more-sheet-panel" role="dialog"
        aria-modal="true" aria-labelledby="more-sheet-title"
        onClick={event => event.stopPropagation()}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="more-sheet-handle" aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 6px 3px' }}>
          <div>
            <h2 id="more-sheet-title" style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '-0.025em' }}>Your workspace</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Study tools and account</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}
            className="editorial-btn editorial-btn-secondary" aria-label="Close menu"
            style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}>
            <X size={18}/>
          </button>
        </div>

        <div className="more-sheet-group-label">Study tools</div>
        <nav aria-label="Study tools">
          {studyLinks.map(item => <SheetLink key={item.to} item={item} onClose={onClose}/>)}
        </nav>

        <div className="more-sheet-group-label">Account &amp; Membership</div>
        <nav aria-label="Account navigation">
          {accountLinks.map(item => <SheetLink key={item.to} item={item} onClose={onClose}/>)}
        </nav>

        <div className="more-sheet-group-label">Appearance & support</div>
        <button type="button" onClick={toggleTheme} className="more-sheet-link"
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>
          <span className="more-sheet-link-icon" aria-hidden="true">
            {resolvedTheme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}
          </span>
          <span style={{ flex: 1 }}>
            <span className="more-sheet-link-title" style={{ display: 'block' }}>{resolvedTheme === 'dark' ? 'Switch to light' : 'Switch to dark'}</span>
            <span className="more-sheet-link-desc" style={{ display: 'block' }}>Change your reading environment</span>
          </span>
          <ChevronRight size={16} color="var(--text-muted)" aria-hidden="true" />
        </button>
        <a href="https://wa.me/918795776006" target="_blank" rel="noopener noreferrer" className="more-sheet-link">
          <span className="more-sheet-link-icon" aria-hidden="true"><LifeBuoy size={19}/></span>
          <span style={{ flex: 1 }}>
            <span className="more-sheet-link-title" style={{ display: 'block' }}>Academic support</span>
            <span className="more-sheet-link-desc" style={{ display: 'block' }}>Message the mentor on WhatsApp</span>
          </span>
          <ChevronRight size={16} color="var(--text-muted)" aria-hidden="true" />
        </a>

        {/* Mobile Logout Button */}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="more-sheet-link"
            style={{ width: '100%', background: 'none', border: 'none', color: '#DC2626', textAlign: 'left', cursor: 'pointer' }}
          >
            <span className="more-sheet-link-icon" aria-hidden="true" style={{ color: '#DC2626' }}>
              <LogOut size={19} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="more-sheet-link-title" style={{ display: 'block', color: '#DC2626', fontWeight: 600 }}>Sign Out</span>
              <span className="more-sheet-link-desc" style={{ display: 'block' }}>Log out of this device session</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
