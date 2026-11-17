import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Layers, 
  Receipt, 
  Sliders, 
  Mail, 
  Database, 
  BarChart3, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  ExternalLink,
  Shield,
  Sparkles,
  Command,
  Radio,
  ArrowRight
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/adminDesignSystem.css';

export default function AdminProtectedLayout({ children, title = 'Administration' }) {
  const { adminUser, isAuthenticated, loading, adminLogout } = useAdminAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [statsBadge, setStatsBadge] = useState({ pending: 0, unmatched: 0 });

  // Route protection
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    } else if (!loading && isAuthenticated && !adminUser?.onboardingComplete && location.pathname !== '/admin/onboarding') {
      navigate('/admin/onboarding', { replace: true });
    }
  }, [loading, isAuthenticated, adminUser, location.pathname, navigate]);

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch quick badges and notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/admin/analytics/overview', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ayur_admin_token')}` }
      })
        .then(r => r.json())
        .then(d => {
          if (d?.status && d?.data) {
            setStatsBadge({
              pending: d.data.pendingOrders || 0,
              unmatched: d.data.unmatchedCredits || 0
            });
          }
        })
        .catch(console.error);

      fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ayur_admin_token')}` }
      })
        .then(r => r.json())
        .then(d => {
          if (d?.status && d?.data) {
            setNotifications(d.data || []);
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--admin-bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="admin-brand-icon" style={{ width: 48, height: 48, fontSize: '1.4rem', margin: '0 auto 1rem' }}>P</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Loading Pratyaksh Administration...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const quickNavItems = [
    { name: 'Dashboard Overview', path: '/admin', group: 'Navigation', icon: LayoutDashboard },
    { name: 'Student Directory', path: '/admin/students', group: 'Students', icon: Users },
    { name: 'Membership Plans & Coupons', path: '/admin/plans', group: 'Plans', icon: Layers },
    { name: 'Razorpay Payment Gateway', path: '/admin/payments/gateway', group: 'Payments', icon: CreditCard },
    { name: 'Revenue & Admission Reports', path: '/admin/reports', group: 'Reports', icon: BarChart3 },
    { name: 'Email Center (Hostinger SMTP)', path: '/admin/email', group: 'Communications', icon: Mail },
    { name: 'Google Login & Auth Settings', path: '/admin/auth/google', group: 'Security', icon: Shield }
  ];
  if (adminUser?.email?.toLowerCase() === 'mukeshk65018@gmail.com' && adminUser?.role === 'super_admin') {
    quickNavItems.push({ name: 'Administrator Access', path: '/admin/admins', group: 'Security', icon: Users });
  }

  if (adminUser?.role === 'super_admin') quickNavItems.push({ name: 'Live Classes & Updates', path: '/admin/live-classes', group: 'Academics', icon: Radio });

  const filteredCommandItems = quickNavItems.filter(item =>
    item.name.toLowerCase().includes(commandQuery.toLowerCase()) ||
    item.group.toLowerCase().includes(commandQuery.toLowerCase())
  );

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-sidebar-brand" title="Pratyaksh Administration">
            <img 
              src="/assets/website-assets/img/logo-round.svg" 
              alt="Pratyaksh Ayurved Logo" 
              className="admin-brand-logo-img" 
            />
            {!sidebarCollapsed && (
              <div className="admin-brand-text">
                <span className="admin-brand-name">Pratyaksh Ayurved</span>
                <span className="admin-brand-subtitle">Administration</span>
              </div>
            )}
          </Link>
          <button 
            type="button" 
            className="admin-icon-btn d-none d-md-flex" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight size={18} style={{ transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s ease' }} />
          </button>
          <button 
            type="button" 
            className="admin-icon-btn d-md-none" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="admin-sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <div className="admin-nav-item-left">
              <LayoutDashboard size={18} />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </div>
          </NavLink>

          {!sidebarCollapsed && <div className="admin-nav-group-label">Academics &amp; Scholars</div>}
          <NavLink to="/admin/students" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <div className="admin-nav-item-left">
              <Users size={18} />
              {!sidebarCollapsed && <span>Student Directory</span>}
            </div>
          </NavLink>

          {adminUser?.role === 'super_admin' && <NavLink to="/admin/live-classes" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><div className="admin-nav-item-left"><Radio size={18}/>{!sidebarCollapsed && <span>Live Classes &amp; Updates</span>}</div></NavLink>}
          <NavLink to="/admin/plans" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <div className="admin-nav-item-left">
              <Layers size={18} />
              {!sidebarCollapsed && <span>Membership Plans</span>}
            </div>
          </NavLink>

          {!sidebarCollapsed && <div className="admin-nav-group-label">Finances &amp; Payments</div>}
          <NavLink to="/admin/payments/gateway" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <div className="admin-nav-item-left">
              <CreditCard size={18} />
              {!sidebarCollapsed && <span>Payment Gateway</span>}
            </div>
            {!sidebarCollapsed && (
              <span className="admin-badge admin-badge-success" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                Razorpay
              </span>
            )}
          </NavLink>

          <NavLink to="/admin/reports" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <div className="admin-nav-item-left">
              <BarChart3 size={18} />
              {!sidebarCollapsed && <span>Reports &amp; Ledgers</span>}
            </div>
          </NavLink>

          {!sidebarCollapsed && <div className="admin-nav-group-label">Communications</div>}
          <NavLink to="/admin/email" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <div className="admin-nav-item-left">
              <Mail size={18} />
              {!sidebarCollapsed && <span>Email Center</span>}
            </div>
            {!sidebarCollapsed && (
              <span className="admin-badge admin-badge-info" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                Hostinger
              </span>
            )}
          </NavLink>

          {!sidebarCollapsed && <div className="admin-nav-group-label">Security &amp; Auth</div>}
          <NavLink to="/admin/auth/google" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <div className="admin-nav-item-left">
              <Shield size={18} />
              {!sidebarCollapsed && <span>Google Login</span>}
            </div>
            {!sidebarCollapsed && (
              <span className="admin-badge admin-badge-success" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                Google GIS
              </span>
            )}
          </NavLink>
          {adminUser?.email?.toLowerCase() === 'mukeshk65018@gmail.com' && adminUser?.role === 'super_admin' && (
            <NavLink to="/admin/admins" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              <div className="admin-nav-item-left">
                <Users size={18} />
                {!sidebarCollapsed && <span>Administrator Access</span>}
              </div>
            </NavLink>
          )}
        </nav>

        {/* Footer Admin User Card */}
        <div className="admin-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
              <div className="admin-avatar">
                {adminUser?.full_name ? adminUser.full_name[0] : 'A'}
              </div>
              {!sidebarCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {adminUser?.full_name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>
                    {adminUser?.role?.replace('_', ' ')}
                  </span>
                  {!sidebarCollapsed && <span style={{ fontSize: '0.66rem', color: 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminUser?.email}</span>}
                  {!sidebarCollapsed && adminUser?.phone && <span style={{ fontSize: '0.66rem', color: 'var(--admin-text-muted)' }}>{adminUser.phone}</span>}
                  {!sidebarCollapsed && adminUser?.address && <span title={adminUser.address} style={{ fontSize: '0.64rem', color: 'var(--admin-text-muted)', maxWidth: 155, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminUser.address}</span>}
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button 
                type="button" 
                onClick={adminLogout} 
                className="admin-icon-btn" 
                title="Sign Out of Admin"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="admin-main-wrapper">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-icon-btn d-md-none"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Section indicator */}
            <div className="d-none d-lg-flex" style={{ alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--admin-text-muted)', marginRight: '0.5rem' }}>
              <span>Admin</span>
              <span style={{ opacity: 0.5 }}>/</span>
              <span style={{ color: 'var(--admin-text-primary)', fontWeight: 600 }}>{title}</span>
            </div>

            {/* Global Search / Command Palette Trigger */}
            <div 
              className="admin-search-trigger"
              onClick={() => setCommandPaletteOpen(true)}
              title="Open keyboard command palette (Ctrl+K)"
            >
              <Search size={15} />
              <span className="admin-search-text">Search scholars, plans, UTRs...</span>
              <kbd className="admin-kbd-shortcut">Ctrl K</kbd>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* Quick Link to Student Classroom */}
            <Link
              to="/app"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary admin-btn-sm d-none d-sm-inline-flex"
              title="Open Student Classroom portal in new tab"
            >
              <span>Classroom View</span>
              <ExternalLink size={13} />
            </Link>

            {/* Notification Bell */}
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => setNotificationOpen(!notificationOpen)}
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.length > 0 && <span className="admin-notif-dot" />}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              className="admin-icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Admin Profile Pill */}
            <div className="admin-user-menu" onClick={adminLogout} title="Click to Sign Out">
              <div className="admin-avatar" style={{ width: 26, height: 26, fontSize: '0.72rem' }}>
                {adminUser?.full_name ? adminUser.full_name[0] : 'A'}
              </div>
              <span className="d-none d-md-inline" style={{ fontSize: '0.82rem', fontWeight: 650 }}>
                {adminUser?.full_name?.split(' ')[0]}
              </span>
              <LogOut size={13} style={{ color: 'var(--admin-text-muted)' }} />
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="admin-page-content">
          {children}
        </main>
      </div>

      {/* ==========================================================
          COMMAND PALETTE MODAL (Ctrl+K / Cmd+K)
          ========================================================== */}
      {commandPaletteOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCommandPaletteOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.95rem 1.25rem', borderBottom: '1px solid var(--admin-border-subtle)' }}>
              <Command size={18} color="var(--admin-primary)" />
              <input
                type="text"
                autoFocus
                placeholder="Type a destination, student name, or transaction UTR..."
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--admin-text-primary)'
                }}
              />
              <span className="admin-kbd-shortcut">ESC</span>
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto', padding: '0.5rem' }}>
              {filteredCommandItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.86rem' }}>
                  No matching admin destinations found.
                </div>
              ) : (
                filteredCommandItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setCommandPaletteOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--admin-bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--admin-blue-bg)', color: 'var(--admin-blue-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{item.group}</div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--admin-text-muted)' }} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          NOTIFICATION CENTER MODAL / DRAWER
          ========================================================== */}
      {notificationOpen && (
        <div className="admin-modal-backdrop" onClick={() => setNotificationOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: 440, position: 'fixed', top: 76, right: 24, margin: 0 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={16} color="var(--admin-primary)" />
                <h3 className="admin-modal-title" style={{ fontSize: '1rem' }}>Transactional Notifications</h3>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setNotificationOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: '0.75rem 1rem' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                  No recent notifications recorded.
                </div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <div key={n.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: '0.2rem' }}>
                      {n.subject}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-secondary)', marginBottom: '0.3rem' }}>
                      To: {n.recipient_name} ({n.recipient_email})
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                      {new Date(n.sent_at).toLocaleDateString()} • {new Date(n.sent_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

