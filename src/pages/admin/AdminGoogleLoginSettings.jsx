import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  Users, 
  Activity, 
  Mail, 
  Info, 
  Sparkles, 
  Clock, 
  Play, 
  ArrowRight,
  HelpCircle,
  Sliders,
  Database,
  FileText
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/adminDesignSystem.css';

export default function AdminGoogleLoginSettings() {
  const { adminUser } = useAdminAuth();
  const token = localStorage.getItem('ayur_admin_token');

  // Sub-navigation: 'overview' | 'google' | 'otp' | 'activity' | 'security'
  const [activeTab, setActiveTab] = useState('google');

  // Settings State
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [inputClientId, setInputClientId] = useState('');
  const [inputClientSecret, setInputClientSecret] = useState('');
  const [inputIsEnabled, setInputIsEnabled] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState('development');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }

  // Validation State
  const [formatError, setFormatError] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Live Test State
  const [gisScriptLoaded, setGisScriptLoaded] = useState(false);
  const [testVerifying, setTestVerifying] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const testButtonRef = useRef(null);

  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  // Fetch Settings from Backend
  const fetchSettings = async (env = selectedEnv) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/auth/google/settings?env=${env}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status && data.data) {
        setSettings(data.data);
        setInputClientId(data.data.clientId || '');
        setInputClientSecret(data.data.clientSecret || '');
        setInputIsEnabled(Boolean(data.data.isEnabled));
        setSelectedEnv(data.data.environment || 'development');
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to load authentication settings.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Network error loading authentication settings.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Activity Logs
  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const res = await fetch('/api/admin/auth/activity?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status) {
        setActivityLogs(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchActivity();
  }, [token]);

  // Dynamically load Google Identity Services Script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGisScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGisScriptLoaded(true);
    };
    script.onerror = () => {
      console.warn('Could not load Google Identity Services library. Check CSP or adblock.');
    };
    document.body.appendChild(script);

    return () => {
      // Keep script for application lifecycle
    };
  }, []);

  // Initialize and render Google button in Admin Test Section
  useEffect(() => {
    if (!gisScriptLoaded || !window.google?.accounts?.id) return;
    const activeId = inputClientId.trim() || settings?.clientId;
    if (!activeId || !activeId.endsWith('.apps.googleusercontent.com')) return;

    try {
      window.google.accounts.id.initialize({
        client_id: activeId,
        callback: handleAdminTestCredentialResponse,
        auto_select: false
      });

      const container = document.getElementById('admin-google-test-btn-slot');
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 280
        });
      }
    } catch (err) {
      console.error('Error rendering Google test button:', err);
    }
  }, [gisScriptLoaded, inputClientId, settings?.clientId, activeTab]);

  // Handle Real Google Credential Callback from Test Button
  const handleAdminTestCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setTestResult({
        success: false,
        error: 'No credential token received from Google Identity Services popup.'
      });
      return;
    }

    setTestVerifying(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/auth/google/test-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          credential: response.credential,
          clientId: inputClientId.trim() || settings?.clientId
        })
      });

      const data = await res.json();
      if (data.status) {
        setTestResult({
          success: true,
          message: data.message,
          data: data.data
        });
        fetchSettings(selectedEnv);
        fetchActivity();
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Server rejected Google credential.'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: 'Network failure verifying credential with backend.'
      });
    } finally {
      setTestVerifying(false);
    }
  };

  // Format Validator
  const validateFormat = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      setFormatError('Google Client ID cannot be empty.');
      return false;
    }
    if (!trimmed.endsWith('.apps.googleusercontent.com')) {
      setFormatError('Client ID must end with ".apps.googleusercontent.com".');
      return false;
    }
    const regex = /^[0-9]+-[a-zA-Z0-9_\-]+\.apps\.googleusercontent\.com$/;
    if (!regex.test(trimmed)) {
      setFormatError('Expected format: 1234567890-abcdef.apps.googleusercontent.com');
      return false;
    }
    setFormatError('');
    return true;
  };

  // Handle Save Configuration
  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setFeedback(null);

    const cleanId = inputClientId.trim();
    if (cleanId && !validateFormat(cleanId)) {
      setFeedback({ type: 'error', text: 'Please resolve the Client ID format error before saving.' });
      return;
    }

    if (inputIsEnabled && !cleanId) {
      setFeedback({ type: 'error', text: 'You cannot enable Google Login without providing a valid Google Client ID.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/auth/google/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId: cleanId,
          clientSecret: inputClientSecret,
          isEnabled: inputIsEnabled,
          environment: selectedEnv
        })
      });

      const data = await res.json();
      if (data.status) {
        setSettings(data.data);
        setFeedback({ type: 'success', text: 'Google authentication settings successfully saved to MySQL!' });
        fetchActivity();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save configuration.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Network error saving settings to MySQL.' });
    } finally {
      setSaving(false);
    }
  };

  // Copy to Clipboard Helper
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered Activity
  const filteredActivity = activityLogs.filter(log => {
    const matchesSearch = 
      log.email?.toLowerCase().includes(activitySearch.toLowerCase()) ||
      log.action?.toLowerCase().includes(activitySearch.toLowerCase()) ||
      log.error_reason?.toLowerCase().includes(activitySearch.toLowerCase());
    
    if (activityFilter === 'all') return matchesSearch;
    if (activityFilter === 'google') return matchesSearch && log.provider === 'google';
    if (activityFilter === 'success') return matchesSearch && log.status === 'success';
    if (activityFilter === 'failed') return matchesSearch && (log.status === 'failed' || log.status === 'rejected');
    return matchesSearch;
  });

  return (
    <div className="admin-page-container">
      {/* Top Breadcrumb & Title Bar */}
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              System &amp; Security Settings
            </span>
            <span style={{ color: 'var(--admin-text-muted)' }}>/</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-primary)', fontWeight: 600 }}>
              Authentication &amp; Google Login
            </span>
          </div>
          <h1 className="admin-page-title" style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck size={26} style={{ color: 'var(--admin-primary)' }} />
            <span>Authentication &amp; Login Management</span>
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.35rem 0 0', color: 'var(--admin-text-secondary)', fontSize: '0.88rem' }}>
            Configure official Google Identity Services (GIS), review authorized web origins, test real credentials, and inspect student login activity.
          </p>
        </div>

        {/* Global Environment Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.85rem', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border)', borderRadius: '8px' }}>
            <Globe size={14} style={{ color: 'var(--admin-text-muted)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
              Environment:
            </span>
            <span className="admin-badge admin-badge-info" style={{ textTransform: 'uppercase', fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
              {settings?.environment || 'development'}
            </span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div 
          style={{
            padding: '0.85rem 1.15rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : feedback.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : feedback.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
            color: feedback.type === 'success' ? 'var(--admin-success)' : feedback.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-info)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.88rem', fontWeight: 500 }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : feedback.type === 'error' ? <XCircle size={18} /> : <Info size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Primary Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--admin-border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('google')}
          style={{
            padding: '0.65rem 1.1rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'google' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            color: activeTab === 'google' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Google Login (GIS)</span>
          {settings?.isEnabled && (
            <span className="admin-badge admin-badge-success" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
              Active
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.65rem 1.1rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'overview' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Sliders size={16} />
          <span>Providers Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('otp')}
          style={{
            padding: '0.65rem 1.1rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'otp' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            color: activeTab === 'otp' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Mail size={16} />
          <span>Email OTP Integration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '0.65rem 1.1rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'activity' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            color: activeTab === 'activity' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Activity size={16} />
          <span>Login Activity Logs</span>
          <span className="admin-badge admin-badge-neutral" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
            {activityLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          style={{
            padding: '0.65rem 1.1rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'security' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            color: activeTab === 'security' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Lock size={16} />
          <span>Security &amp; Sessions</span>
        </button>
      </div>

      {/* TAB 1: GOOGLE LOGIN (PRIMARY FEATURE) */}
      {activeTab === 'google' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section A — Google Integration Overview Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(66, 133, 244, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="admin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                    Section A — Google Integration Overview
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Provider: Google | Library: Google Identity Services (GIS) | OAuth Application: Ayurvedasidhi Web Login
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Status:</span>
                <span 
                  className={`admin-badge ${
                    settings?.status === 'Enabled' ? 'admin-badge-success' : 
                    settings?.status === 'Configured (Disabled)' ? 'admin-badge-warning' : 
                    'admin-badge-neutral'
                  }`}
                  style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}
                >
                  {settings?.status || 'Not Configured'}
                </span>
              </div>
            </div>

            <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Target Google Project
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                  {settings?.googleCloudProject || 'Ayurvedasidhi Authentication'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Target Environment
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--admin-text-primary)', textTransform: 'capitalize' }}>
                  {selectedEnv} (MySQL Storage)
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Client Secret Requirement
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} />
                  <span>Not Required (GIS Flow)</span>
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Last Verification Test
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: settings?.lastTestStatus === 'Verified' ? 'var(--admin-success)' : 'var(--admin-text-muted)' }}>
                  {settings?.lastTestStatus || 'Never Tested'}
                </div>
              </div>
            </div>
          </div>

          {/* Section B & C — Google Client ID & Enable Toggle Form */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  Section B &amp; C — Google Client ID &amp; Provider Activation
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                  The running server uses the Web Client ID configured for its environment. A server `GOOGLE_CLIENT_ID` takes precedence over the database value.
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Field: Client ID */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label htmlFor="google-client-id-input" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                    Google OAuth Client ID <span style={{ color: 'var(--admin-danger)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setInputClientId(text.trim());
                            validateFormat(text.trim());
                          }
                        } catch (e) {
                          alert('Please grant clipboard permission or paste manually.');
                        }
                      }}
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Copy size={13} />
                      <span>Paste from Clipboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => validateFormat(inputClientId)}
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem' }}
                    >
                      Validate Format
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    id="google-client-id-input"
                    type="text"
                    value={inputClientId}
                    onChange={(e) => {
                      setInputClientId(e.target.value);
                      if (formatError) validateFormat(e.target.value);
                    }}
                    placeholder="1234567890-example.apps.googleusercontent.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.88rem',
                      borderRadius: '8px',
                      border: `1px solid ${formatError ? 'var(--admin-danger)' : 'var(--admin-border)'}`,
                      background: 'var(--admin-bg-base)',
                      color: 'var(--admin-text-primary)'
                    }}
                  />
                </div>

                {formatError ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-danger)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={14} />
                    <span>{formatError}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', marginTop: '0.4rem' }}>
                    Must be a valid Google Web Client ID ending in <code>.apps.googleusercontent.com</code>.
                  </div>
                )}
                {settings?.clientIdSource === 'environment' && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-secondary)', marginTop: '0.45rem' }}>
                    Runtime source: server environment variable <code>GOOGLE_CLIENT_ID</code>. Update that value and restart the server to change the ID used by student sign-in.
                  </div>
                )}
              </div>

              {/* Field: Client Secret */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label htmlFor="google-client-secret-input" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                    Google OAuth Client Secret
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {settings?.clientSecretConfigured && (
                      <span className="admin-badge admin-badge-success" style={{ fontSize: '0.66rem', padding: '0.15rem 0.4rem' }}>
                        {settings.clientSecretMasked}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) setInputClientSecret(text.trim());
                        } catch (e) {
                          alert('Please grant clipboard permission or paste manually.');
                        }
                      }}
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Copy size={13} />
                      <span>Paste Secret</span>
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    id="google-client-secret-input"
                    type="password"
                    value={inputClientSecret}
                    onChange={(e) => setInputClientSecret(e.target.value)}
                    placeholder={settings?.clientSecretConfigured ? "Secret configured in server ENV (re-enter to update)" : "Enter secret privately on the server"}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.88rem',
                      borderRadius: '8px',
                      border: '1px solid var(--admin-border)',
                      background: 'var(--admin-bg-base)',
                      color: 'var(--admin-text-primary)'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', marginTop: '0.4rem' }}>
                  Not required for this app’s Google Identity Services ID-token flow. Keep any value server-side; the browser only receives the Client ID.
                </div>
              </div>

              {/* Section C: Enable/Disable Switch */}
              <div style={{ padding: '1rem', background: 'var(--admin-bg-base)', borderRadius: '10px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                    Enable Google Sign-In
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', maxWidth: '580px' }}>
                    When enabled, the official Google Sign-In button will appear on the student login &amp; registration pages. When disabled, the public button is hidden and backend authentication attempts are rejected.
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={inputIsEnabled}
                    onChange={(e) => setInputIsEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: inputIsEnabled ? 'var(--admin-success)' : 'var(--admin-border)',
                      borderRadius: '26px',
                      transition: '0.3s'
                    }}
                  >
                    <span 
                      style={{
                        position: 'absolute',
                        height: '20px',
                        width: '20px',
                        left: inputIsEnabled ? '26px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: '0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setInputClientId(settings?.clientId || '');
                    setInputIsEnabled(Boolean(settings?.isEnabled));
                    setFormatError('');
                  }}
                  className="admin-btn admin-btn-secondary"
                  disabled={saving}
                >
                  Cancel Changes
                </button>

                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {saving ? <RefreshCw size={16} className="admin-spin" /> : <Save size={16} />}
                  <span>{saving ? 'Saving to MySQL...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section D — Authorized Origins */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  Section D — Authorized JavaScript Origins
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                  Origins authorized in Google Cloud Console for the <strong>Ayurvedasidhi Web Login</strong> client.
                </div>
              </div>

              <a
                href={settings?.googleCloudConsoleUrl || 'https://console.cloud.google.com/apis/credentials'}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Google Cloud Credentials</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--admin-primary)' }}>Important Google Cloud Note:</strong> The administration panel cannot automatically modify your Google Cloud Console project settings. You must register these exact URLs under <em>"Authorized JavaScript origins"</em> in Google Cloud Console.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {settings?.registeredOrigins?.map((origin, idx) => (
                  <div key={idx} style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span>{origin.name}</span>
                        {origin.isCurrent && (
                          <span className="admin-badge admin-badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                            Current Host
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--admin-primary)', marginTop: '0.2rem' }}>
                        {origin.url}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(origin.url, `origin_${idx}`)}
                      className="admin-icon-btn"
                      title="Copy URL"
                    >
                      {copiedField === `origin_${idx}` ? <Check size={16} style={{ color: 'var(--admin-success)' }} /> : <Copy size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section E — Test Google Login */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  Section E — Test Google Sign-In
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                  Authenticate using a real Google account in Google Identity Services popup to verify credentials and server-side token validation.
                </div>
              </div>

              {testVerifying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--admin-primary)' }}>
                  <RefreshCw size={14} className="admin-spin" />
                  <span>Verifying with Google backend...</span>
                </div>
              )}
            </div>

            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem', background: 'var(--admin-bg-base)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                    Live Google Identity Services Button
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', maxWidth: '480px' }}>
                    Click the official button to test popup authorization. The returned credential will be verified by our Node.js backend using Google's public cryptographic keys.
                  </div>
                </div>

                <div id="admin-google-test-btn-slot" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                  {!inputClientId ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                      Configure a valid Client ID above to render test button.
                    </div>
                  ) : !gisScriptLoaded ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <RefreshCw size={14} className="admin-spin" />
                      <span>Loading Google Identity Services SDK...</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Real Test Output Display */}
              {testResult && (
                <div 
                  style={{
                    padding: '1.15rem',
                    borderRadius: '10px',
                    border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    background: testResult.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                    {testResult.success ? (
                      <CheckCircle2 size={20} style={{ color: 'var(--admin-success)' }} />
                    ) : (
                      <XCircle size={20} style={{ color: 'var(--admin-danger)' }} />
                    )}
                    <span style={{ fontSize: '0.96rem', fontWeight: 700, color: testResult.success ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                      {testResult.success ? 'Google Authentication Test Passed (100% Verified)' : 'Google Authentication Test Failed'}
                    </span>
                  </div>

                  {testResult.success ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Authenticated Email:</span>{' '}
                        <strong style={{ color: 'var(--admin-text-primary)' }}>{testResult.data?.email}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Account Name:</span>{' '}
                        <strong style={{ color: 'var(--admin-text-primary)' }}>{testResult.data?.fullName}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Email Verified by Google:</span>{' '}
                        <strong style={{ color: 'var(--admin-success)' }}>Yes (Confirmed)</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Google Subject ID:</span>{' '}
                        <code style={{ fontSize: '0.76rem' }}>{testResult.data?.sub?.slice(0, 10)}...</code>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: 'var(--admin-danger)' }}>
                      {testResult.error}
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                    Note: Testing in this administrative console verifies token cryptography and origin authorization without altering student subscription records.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section F — Configuration History & Audit */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  Section F — Configuration History
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                  Audit trail of configuration updates and administrator modifications.
                </div>
              </div>
            </div>

            <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Last Configuration Update
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginTop: '0.25rem' }}>
                  {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never Updated'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Updated By Administrator
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginTop: '0.25rem' }}>
                  {settings?.updatedByName || 'System Default'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Latest Test Timestamp
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginTop: '0.25rem' }}>
                  {settings?.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleString() : 'No Tests Executed'}
                </div>
              </div>
            </div>
          </div>

          {/* Section G — Help and Troubleshooting */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={18} style={{ color: 'var(--admin-primary)' }} />
                <h3 className="admin-card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                  Section G — Help &amp; Troubleshooting Guide
                </h3>
              </div>
            </div>

            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  1. Error 400: redirect_uri_mismatch or origin_mismatch
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  Google blocks requests if the exact URL origin in the browser address bar is not listed in Google Cloud Console. For local testing, ensure <code>http://localhost:3001</code> is added under <em>"Authorized JavaScript origins"</em> (note: no trailing slash).
                </div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  2. Google OAuth "Testing Mode" Restrictions
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  While the Google Cloud project is in <strong>Testing Mode</strong>, only Google accounts explicitly added to the <em>"Test Users"</em> list in Google Cloud Console can sign in. Attempting to sign in with an unlisted account will return an access denied error.
                </div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  3. Google Popup Blocked
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  If the Google sign-in window does not open when clicking "Continue with Google", check whether your browser's popup blocker has blocked <code>accounts.google.com</code>.
                </div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  4. Token Audience Mismatch Error
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  Occurs if the Client ID in the database does not match the Client ID used to generate the Google ID token. Ensure the Client ID saved in this settings panel matches the one from your Google Cloud Console project.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PROVIDERS OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Supported Authentication Providers</h3>
            </div>
            <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Google */}
              <div style={{ padding: '1.25rem', background: 'var(--admin-bg-base)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--admin-text-primary)' }}>Google Sign-In</span>
                  <span className={`admin-badge ${settings?.isEnabled ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                    {settings?.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Single-click popup login using Google Identity Services. Verified via backend cryptographic keys and mapped to internal student IDs.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('google')}
                  className="admin-btn admin-btn-secondary"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  Configure Google Settings
                </button>
              </div>

              {/* Email & Password */}
              <div style={{ padding: '1.25rem', background: 'var(--admin-bg-base)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--admin-text-primary)' }}>Email &amp; Password</span>
                  <span className="admin-badge admin-badge-success">Standard</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Traditional credential authentication with salted password hashes and self-service password reset links.
                </p>
                <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                  Always enabled as core fallback.
                </div>
              </div>

              {/* Fast Email OTP */}
              <div style={{ padding: '1.25rem', background: 'var(--admin-bg-base)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--admin-text-primary)' }}>Fast Email OTP</span>
                  <span className="admin-badge admin-badge-success">Hostinger SMTP</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  Passwordless authentication dispatching 6-digit one-time codes via Hostinger Business Email.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('otp')}
                  className="admin-btn admin-btn-secondary"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  View OTP Templates &amp; Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL OTP INTEGRATION */}
      {activeTab === 'otp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Email OTP Integration Status</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                  Managed through the centralized Hostinger Email Center.
                </div>
              </div>

              <a
                href="#/admin/email"
                className="admin-btn admin-btn-primary"
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Open Email Center</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  Canonical OTP Email Templates Active:
                </div>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.84rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>email_verification_otp:</strong> Dispatches code for new student registration verification.</li>
                  <li><strong>login_otp:</strong> Dispatches 6-digit fast login authorization code.</li>
                  <li><strong>password_recovery_otp:</strong> Dispatches password reset security codes.</li>
                </ul>
              </div>

              <div style={{ padding: '0.9rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.82rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--admin-success)' }}>Unified Identity Policy:</strong> A student who signs in with Email OTP shares the exact same student profile, membership records, and course progress if they subsequently connect their Google Account.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY LOGS */}
      {activeTab === 'activity' && (
        <div className="admin-card">
          <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="admin-card-title">Authentication Activity Audit Trail</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                Real-time security logs tracking Google logins, account links, and verification attempts.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search email, action..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: '1px solid var(--admin-border)',
                  background: 'var(--admin-bg-base)',
                  color: 'var(--admin-text-primary)'
                }}
              />
              <button
                type="button"
                onClick={fetchActivity}
                className="admin-icon-btn"
                title="Refresh Activity"
              >
                <RefreshCw size={15} className={activityLoading ? 'admin-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Email</th>
                  <th>Provider</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>Details / Error</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-muted)' }}>
                      No authentication events recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredActivity.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--admin-text-primary)', fontSize: '0.82rem' }}>
                        {log.email}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-neutral" style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>
                          {log.provider}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>
                        {log.action?.replace('_', ' ')}
                      </td>
                      <td>
                        <span 
                          className={`admin-badge ${
                            log.status === 'success' ? 'admin-badge-success' : 
                            log.status === 'failed' ? 'admin-badge-danger' : 
                            'admin-badge-warning'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: log.error_reason ? 'var(--admin-danger)' : 'var(--admin-text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.error_reason || (log.details_json ? log.details_json : 'OK')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & SESSIONS */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Session &amp; Token Security Policy</h3>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  1. Server-Side Google Token Verification
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  The backend verifies every Google ID token with Google's public certificates via <code>google-auth-library</code>. Client IDs supplied in the request body are never trusted; verification strictly enforces the active Client ID saved in MySQL.
                </div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  2. Membership Gate Isolation
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  Google authentication verifies student identity only. Membership entitlements (1 Month, 3 Months, 6 Months, 12 Months) are loaded exclusively from authoritative MySQL records in the <code>memberships</code> table. Google login never unlocks premium content without an active paid subscription.
                </div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                  3. Emergency Administrator Recovery
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  Administrator access relies on independent credentials stored in <code>admin_users</code>. Disabling or modifying Google Login settings cannot cause administrative lockouts.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

