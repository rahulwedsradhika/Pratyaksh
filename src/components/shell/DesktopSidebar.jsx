import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  House, 
  BookOpenText, 
  GraduationCap, 
  Radio, 
  Bookmark, 
  ChartNoAxesColumnIncreasing, 
  ListTodo, 
  UserRound, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen,
  CreditCard
} from 'lucide-react';

const groups = [
  {
    label: 'LEARNING',
    items: [
      { name: 'Dashboard', to: '/app', icon: House },
      { name: 'My Courses', to: '/courses', icon: BookOpenText },
      { name: 'Test Series', to: '/tests', icon: GraduationCap },
      { name: 'Learn Live', to: '/learn-live', icon: Radio }
    ]
  },
  {
    label: 'STUDY TOOLS',
    items: [
      { name: 'Saved Questions', to: '/bookmarks', icon: Bookmark },
      { name: 'Performance', to: '/performance', icon: ChartNoAxesColumnIncreasing },
      { name: 'My Tasks', to: '/tasks', icon: ListTodo }
    ]
  }
];

const account = [
  { name: 'Membership', to: '/membership', icon: CreditCard },
  { name: 'Profile', to: '/profile', icon: UserRound },
  { name: 'Settings', to: '/settings', icon: Settings }
];

function isSectionActive(pathname, to) {
  if (to === '/app') return ['/app', '/dashboard', '/student', '/student/dashboard'].includes(pathname);
  if (to === '/courses') return /^\/(courses|course|learn|subjects|chapters|lesson|course-category)(\/|$)/.test(pathname) ||
    /^\/student\/(chapter-details|mycourse|mysubject|mychapter)(\/|$)/.test(pathname);
  if (to === '/tests') return /^\/(tests|practice|exam)(\/|$)/.test(pathname);
  if (to === '/learn-live') return /^\/(learn-live|student\/learn-live)(\/|$)/.test(pathname);
  return pathname === to || pathname.startsWith(to + '/');
}

function Item({ item, pathname }) {
  const Icon = item.icon;
  const active = isSectionActive(pathname, item.to);
  return (
    <NavLink to={item.to} end={item.to === '/app'}
      className={`sidebar-nav-item ${active ? 'active' : ''}`}
      title={item.name} aria-label={item.name}
      aria-current={active ? 'page' : undefined}>
      <span className="sidebar-link-icon" aria-hidden="true"><Icon size={18} strokeWidth={active ? 2.25 : 1.8}/></span>
      <span className="nav-text-label">{item.name}</span>
    </NavLink>
  );
}

export default function DesktopSidebar({ collapsed, onToggleCollapse }) {
  const { pathname } = useLocation();
  return (
    <aside className="app-shell-sidebar" aria-label="Student sidebar">
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '0.5rem' }}>
        {groups.map(group => (
          <section key={group.label} className="sidebar-nav-section">
            <h2 className="sidebar-heading">{group.label}</h2>
            <nav aria-label={group.label === 'LEARNING' ? 'Learning' : 'Study tools'}>
              {group.items.map(item => <Item key={item.to} item={item} pathname={pathname}/>)}
            </nav>
          </section>
        ))}
      </div>
      <div className="sidebar-bottom-section">
        <nav aria-label="Account settings">
          {account.map(item => <Item key={item.to} item={item} pathname={pathname}/>)}
        </nav>
        <button type="button" onClick={onToggleCollapse}
          className="sidebar-nav-item sidebar-collapse-button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <span className="sidebar-link-icon" aria-hidden="true">
            {collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}
          </span>
          <span className="nav-text-label">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
        </button>
      </div>
    </aside>
  );
}
