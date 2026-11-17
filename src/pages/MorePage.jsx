import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  Bookmark, 
  BarChart3, 
  Moon, 
  Sun, 
  HelpCircle, 
  Receipt, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function MorePage() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <StudentAppShell>
      <PageContainer maxWidth="800px">
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="editorial-badge editorial-badge-terracotta mb-2">
            <Settings size={13} />
            <span>Academic Tools</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            Settings &amp; Resources
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0 }}>
            Manage your study environment, appearance, offline configurations, and mentor communications.
          </p>
        </div>

        {/* Section 1: Study Tools */}
        <div className="editorial-card p-4 mb-4">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Academic Revision
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to="/bookmarks"
              className="sidebar-nav-item"
              style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}
            >
              <Bookmark size={18} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Saved Questions &amp; Verses</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Flagged classical verses for targeted revision</div>
              </div>
            </Link>

            <Link
              to="/performance"
              className="sidebar-nav-item"
              style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}
            >
              <BarChart3 size={18} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Performance Analytics</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Detailed scorecards and accuracy breakdown</div>
              </div>
            </Link>

            <Link
              to="/student/purchaseHistory"
              className="sidebar-nav-item"
              style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}
            >
              <Receipt size={18} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Purchase &amp; Enrollment History</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active subscriptions and course validity</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Section 2: Appearance */}
        <div className="editorial-card p-4 mb-4">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Display &amp; Theme
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Switch between the warm editorial parchment light theme and deep obsidian dark theme.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {resolvedTheme === 'dark' ? <Moon size={20} color="var(--brand-terracotta)" /> : <Sun size={20} color="var(--brand-terracotta)" />}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Current Mode: {theme.charAt(0).toUpperCase() + theme.slice(1)} ({resolvedTheme})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Optimized for long reading and shloka dissection sessions
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="editorial-btn editorial-btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
            >
              Toggle Mode
            </button>
          </div>
        </div>

        {/* Section 3: Academic Support */}
        <div className="editorial-card p-4">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Faculty &amp; Mentor Support
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Have a question regarding Samhita commentaries or technical access? Chat directly with an authorized faculty mentor.
          </p>

          <a
            href="https://wa.me/918795776006"
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-btn"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              fontWeight: 600,
              padding: '0.6rem 1.25rem'
            }}
          >
            <HelpCircle size={16} />
            <span>Chat on WhatsApp (+91 87957 76006)</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </PageContainer>
    </StudentAppShell>
  );
}

