import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { House, BookOpenText, GraduationCap, Radio, Grid2X2 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', path: '/app', icon: House },
  { label: 'Courses', path: '/courses', icon: BookOpenText },
  { label: 'Tests', path: '/tests', icon: GraduationCap },
  { label: 'Live', path: '/learn-live', icon: Radio },
];

// The active item must follow deep links: course -> subject -> chapter ->
// classroom and series -> papers -> practice. The full-screen exam intentionally
// has no bottom navigation; it is not wrapped in the regular student shell.
function activeSection(pathname) {
  if (pathname === '/app' || pathname === '/' || pathname === '/student' || pathname === '/dashboard' ||
      pathname === '/student/dashboard') return 'Home';
  if (/^\/(courses|course|learn|subjects|chapters|lesson|course-category)(\/|$)/.test(pathname) ||
      /^\/student\/(chapter-details|mycourse|mysubject|mychapter)(\/|$)/.test(pathname)) return 'Courses';
  if (/^\/(tests|practice|exam)(\/|$)/.test(pathname)) return 'Tests';
  if (/^\/(learn-live|student\/learn-live)(\/|$)/.test(pathname)) return 'Live';
  return 'More';
}

export default function MobileBottomNavigation({ onOpenMore, isMoreOpen }) {
  const { pathname } = useLocation();
  const active = isMoreOpen ? 'More' : activeSection(pathname);

  return (
    <nav className="app-shell-bottom-nav" aria-label="Primary mobile navigation">
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const selected = active === label;
        return (
          <NavLink key={label} to={path} end={label === 'Home'}
            className={`bottom-nav-btn ${selected ? 'active' : ''}`}
            aria-current={selected ? 'page' : undefined}
            aria-label={label}>
            <span className="bottom-nav-icon" aria-hidden="true"><Icon size={20} strokeWidth={selected ? 2.3 : 1.9} /></span>
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        );
      })}
      <button type="button"
        onClick={onOpenMore}
        className={`bottom-nav-btn ${active === 'More' ? 'active' : ''}`}
        aria-label="More study tools and account options"
        aria-haspopup="dialog"
        aria-expanded={isMoreOpen}
        aria-controls="mobile-more-sheet">
        <span className="bottom-nav-icon" aria-hidden="true"><Grid2X2 size={20} strokeWidth={active === 'More' ? 2.3 : 1.9} /></span>
        <span className="bottom-nav-label">More</span>
      </button>
    </nav>
  );
}
