import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Settings, 
  Eye, 
  Trash2, 
  Edit3, 
  Plus, 
  ExternalLink, 
  Shield, 
  Search, 
  Filter, 
  Inbox, 
  Save, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Copy, 
  Sparkles,
  Server,
  Key,
  Check,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/adminDesignSystem.css';

export default function AdminEmailCenter() {
  const { adminUser } = useAdminAuth();
  const token = localStorage.getItem('ayur_admin_token');

  // Sub-navigation state: 'overview' | 'compose' | 'sent' | 'drafts' | 'templates' | 'settings' | 'logs'
  const [activeTab, setActiveTab] = useState('overview');

  // Overview Data
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);

  // Compose State
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeTemplateKey, setComposeTemplateKey] = useState('');
  const [composeVariables, setComposeVariables] = useState({});
  const [composeMode, setComposeMode] = useState('rich'); // 'rich' | 'preview'
  const [composeSending, setComposeSending] = useState(false);
  const [composeFeedback, setComposeFeedback] = useState(null);

  // Sent Emails State
  const [sentPage, setSentPage] = useState(1);
  const [sentStatusFilter, setSentStatusFilter] = useState('all');
  const [sentSearch, setSentSearch] = useState('');
  const [sentData, setSentData] = useState({ items: [], pagination: { total: 0, totalPages: 1 } });
  const [sentLoading, setSentLoading] = useState(false);
  const [selectedEmailDetail, setSelectedEmailDetail] = useState(null);

  // Drafts State
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(null);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [previewTemplateData, setPreviewTemplateData] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [editingTemplate, setEditingTemplate] = useState(null);

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState(null);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [testConnectionRunning, setTestConnectionRunning] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState(null);

  // Send Test Email Modal State
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState(adminUser?.email || '');
  const [testSending, setTestSending] = useState(false);
  const [testSendResult, setTestSendResult] = useState(null);

  // Toast / Global Notification
  const [toastMessage, setToastMessage] = useState(null);
  const senderEmail = smtpSettings?.fromEmail || overviewData?.smtpStatus?.senderEmail || 'Not configured';
  const senderName = smtpSettings?.fromName || overviewData?.smtpStatus?.senderName || 'Pratyaksh Ayurveda';
  const smtpHost = smtpSettings?.host || overviewData?.smtpStatus?.host || 'Not configured';
  const smtpPort = smtpSettings?.port || overviewData?.smtpStatus?.port || '';
  const previewValues = { ...composeVariables, ...(templates.find(t => t.template_key === composeTemplateKey)?.system_variables || {}) };
  const composePreviewHtml = composeBody.replace(/\{\{\s*(\w+)\s*\}\}/g, (token, key) => previewValues[key] === undefined ? token : String(previewValues[key]).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])));

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper Headers
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // =========================================================================
  // DATA FETCHING FUNCTIONS
  // =========================================================================

  const fetchOverview = async () => {
    setOverviewLoading(true);
    try {
      const res = await fetch('/api/admin/email/overview', { headers: authHeaders });
      const json = await res.json();
      if (json.status && json.data) {
        setOverviewData(json.data);
      }
    } catch (err) {
      console.error('Error fetching email overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchSentEmails = async (page = 1) => {
    setSentLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        status: sentStatusFilter,
        search: sentSearch
      });
      const res = await fetch(`/api/admin/email/sent?${params.toString()}`, { headers: authHeaders });
      const json = await res.json();
      if (json.status && json.data) {
        setSentData(json.data);
      }
    } catch (err) {
      console.error('Error fetching sent emails:', err);
    } finally {
      setSentLoading(false);
    }
  };

  const fetchDrafts = async () => {
    setDraftsLoading(true);
    try {
      const res = await fetch('/api/admin/email/drafts', { headers: authHeaders });
      const json = await res.json();
      if (json.status && json.data) {
        setDrafts(json.data);
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    } finally {
      setDraftsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch('/api/admin/email/templates', { headers: authHeaders });
      const json = await res.json();
      if (json.status && json.data) {
        setTemplates(json.data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchSmtpSettings = async () => {
    setSmtpLoading(true);
    try {
      const res = await fetch('/api/admin/email/settings', { headers: authHeaders });
      const json = await res.json();
      if (json.status && json.data) {
        setSmtpSettings(json.data);
      }
    } catch (err) {
      console.error('Error fetching SMTP settings:', err);
    } finally {
      setSmtpLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchTemplates();
    fetchDrafts();
  }, []);

  useEffect(() => {
    if (activeTab === 'sent' || activeTab === 'logs') {
      fetchSentEmails(sentPage);
    } else if (activeTab === 'drafts') {
      fetchDrafts();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'settings') {
      fetchSmtpSettings();
    } else if (activeTab === 'overview') {
      fetchOverview();
    }
  }, [activeTab, sentPage, sentStatusFilter]);

  // =========================================================================
  // ACTIONS: TEST CONNECTION & SEND TEST
  // =========================================================================

  const handleTestConnection = async () => {
    setTestConnectionRunning(true);
    setTestConnectionResult(null);
    try {
      const res = await fetch('/api/admin/email/test-connection', {
        method: 'POST',
        headers: authHeaders
      });
      const json = await res.json();
      if (json.status && json.data) {
        setTestConnectionResult(json.data);
        if (json.data.success) {
          showToast('Hostinger SMTP connection and credentials verified successfully!', 'success');
        } else {
          showToast(json.data.message || 'SMTP Connection check returned an issue', 'error');
        }
        fetchOverview();
        fetchSmtpSettings();
      } else {
        setTestConnectionResult({ success: false, message: json.error || 'Connection failed' });
        showToast(json.error || 'Connection failed', 'error');
      }
    } catch (err) {
      setTestConnectionResult({ success: false, message: err.message });
      showToast(err.message, 'error');
    } finally {
      setTestConnectionRunning(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    if (e) e.preventDefault();
    if (!testRecipient) {
      alert('Please enter a recipient email address for testing.');
      return;
    }

    setTestSending(true);
    setTestSendResult(null);
    try {
      const res = await fetch('/api/admin/email/send-test', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ recipientEmail: testRecipient })
      });
      const json = await res.json();
      if (json.status && json.data) {
        setTestSendResult(json.data);
        if (json.data.success) {
          showToast(`Test message successfully accepted by Hostinger SMTP for ${testRecipient}`, 'success');
        } else {
          showToast(`SMTP rejected: ${json.data.error}`, 'error');
        }
        fetchOverview();
      } else {
        setTestSendResult({ success: false, error: json.error || 'Transmission failed' });
        showToast(json.error || 'Transmission failed', 'error');
      }
    } catch (err) {
      setTestSendResult({ success: false, error: err.message });
      showToast(err.message, 'error');
    } finally {
      setTestSending(false);
    }
  };

  // =========================================================================
  // ACTIONS: COMPOSE & DRAFTS
  // =========================================================================

  const handleApplyTemplate = (tplKey) => {
    setComposeTemplateKey(tplKey);
    if (!tplKey) return;
    const tpl = templates.find(t => t.template_key === tplKey);
    if (tpl) {
      setComposeVariables({});
      setComposeSubject(tpl.subject);
      setComposeBody(tpl.html_body || tpl.text_body);
      showToast(`Applied template "${tpl.name}"`, 'info');
    }
  };

  const handleSendCompose = async (e) => {
    if (e) e.preventDefault();
    if (!composeTo.trim()) {
      alert('Please specify a recipient email address.');
      return;
    }
    if (!composeSubject.trim()) {
      alert('Please specify a subject for the email.');
      return;
    }
    if (!composeBody.trim()) {
      alert('Please enter message content.');
      return;
    }

    setComposeSending(true);
    setComposeFeedback(null);
    try {
      const res = await fetch('/api/admin/email/compose', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          html: composeBody,
          text: templates.find(t => t.template_key === composeTemplateKey)?.text_body || composeBody.replace(/<[^>]+>/g, ' ').trim(),
          templateKey: composeTemplateKey || 'admin_compose',
          variables: composeVariables
        })
      });
      const json = await res.json();
      if (json.status && json.data) {
        setComposeFeedback(json.data);
        if (json.data.success) {
          showToast(`Email dispatched to ${composeTo} (Status: SMTP Accepted)`, 'success');
          // If this was a draft, delete the draft
          if (activeDraftId) {
            handleDeleteDraft(activeDraftId, false);
            setActiveDraftId(null);
          }
          // Reset form
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          setComposeTemplateKey('');
          fetchOverview();
        } else {
          showToast(`Sending failed: ${json.data.error}`, 'error');
        }
      } else {
        setComposeFeedback({ success: false, error: json.error || 'Failed to dispatch email' });
        showToast(json.error || 'Failed to dispatch email', 'error');
      }
    } catch (err) {
      setComposeFeedback({ success: false, error: err.message });
      showToast(err.message, 'error');
    } finally {
      setComposeSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!composeSubject && !composeBody && !composeTo) {
      alert('Cannot save an entirely blank draft.');
      return;
    }

    try {
      if (activeDraftId) {
        // Update existing draft
        await fetch(`/api/admin/email/drafts/${activeDraftId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            recipient: composeTo,
            subject: composeSubject,
            body: composeBody,
            templateKey: composeTemplateKey
          })
        });
        showToast('Draft updated', 'success');
      } else {
        // Create new draft
        const res = await fetch('/api/admin/email/drafts', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            recipient: composeTo,
            subject: composeSubject,
            body: composeBody,
            templateKey: composeTemplateKey
          })
        });
        const json = await res.json();
        if (json.status && json.data?.id) {
          setActiveDraftId(json.data.id);
          showToast('Draft saved to database', 'success');
        }
      }
      fetchDrafts();
    } catch (err) {
      showToast('Failed to save draft: ' + err.message, 'error');
    }
  };

  const handleOpenDraft = (draft) => {
    setActiveDraftId(draft.id);
    setComposeTo(draft.recipient || '');
    setComposeSubject(draft.subject || '');
    setComposeBody(draft.body || '');
    setComposeTemplateKey(draft.template_key || '');
    setActiveTab('compose');
    showToast('Loaded draft into composer', 'info');
  };

  const handleDeleteDraft = async (id, notify = true) => {
    if (notify && !window.confirm('Delete this draft permanently?')) return;
    try {
      await fetch(`/api/admin/email/drafts/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (notify) showToast('Draft deleted', 'success');
      if (activeDraftId === id) {
        setActiveDraftId(null);
      }
      fetchDrafts();
    } catch (err) {
      if (notify) showToast('Failed to delete draft: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // ACTIONS: TEMPLATES
  // =========================================================================

  const handlePreviewTemplate = async (templateId) => {
    try {
      const res = await fetch(`/api/admin/email/templates/${templateId}/preview`, {
        method: 'POST',
        headers: authHeaders
      });
      const json = await res.json();
      if (json.status && json.data) {
        setPreviewTemplateData(json.data);
        setPreviewMode('desktop');
      }
    } catch (err) {
      showToast('Error generating template preview: ' + err.message, 'error');
    }
  };

  const handleRestoreTemplateDefault = async (templateId) => {
    if (!window.confirm('Restore this template to canonical default text? Any custom edits will be replaced.')) return;
    try {
      const res = await fetch(`/api/admin/email/templates/${templateId}/restore-default`, {
        method: 'POST',
        headers: authHeaders
      });
      const json = await res.json();
      if (json.status) {
        showToast(json.message || 'Template restored to default', 'success');
        fetchTemplates();
        if (editingTemplate?.id === templateId) {
          setEditingTemplate(null);
        }
      }
    } catch (err) {
      showToast('Failed to restore template: ' + err.message, 'error');
    }
  };

  const handleSaveTemplateEdit = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    try {
      const res = await fetch(`/api/admin/email/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          subject: editingTemplate.subject,
          html_body: editingTemplate.html_body,
          text_body: editingTemplate.text_body,
          enabled: editingTemplate.enabled
        })
      });
      const json = await res.json();
      if (json.status) {
        showToast('Template saved successfully', 'success');
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        showToast(json.error || 'Template could not be saved.', 'error');
      }
    } catch (err) {
      showToast('Failed to save template: ' + err.message, 'error');
    }
  };

  return (
    <div className="admin-email-center-root">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`admin-toast ${toastMessage.type === 'error' ? 'toast-error' : 'toast-success'}`} style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? '#DC2626' : '#15803D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          {toastMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Gmail-Inspired 2-Area Inner Workspace (Navigation Left + Content Right) */}
      <div className="admin-email-layout">
        
        {/* ==========================================================
            AREA 1: INNER EMAIL NAVIGATION (Gmail-Inspired Compact Sidebar)
            ========================================================== */}
        <div className="admin-email-nav-col">
          
          {/* Quick Compose Action Button */}
          <div style={{ padding: '1rem 0.85rem 0.75rem' }}>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '99px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(30, 64, 175, 0.22)'
              }}
              onClick={() => {
                setActiveDraftId(null);
                setComposeTo('');
                setComposeSubject('');
                setComposeBody('');
                setComposeTemplateKey('');
                setActiveTab('compose');
              }}
            >
              <Plus size={18} />
              <span>Compose Email</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="admin-email-nav-list">
            <button
              type="button"
              className={`admin-email-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <div className="admin-email-nav-left">
                <Inbox size={17} />
                <span>Overview</span>
              </div>
              {overviewData?.activity?.totalSubmitted > 0 && (
                <span className="admin-email-badge">{overviewData.activity.totalSubmitted}</span>
              )}
            </button>

            <button
              type="button"
              className={`admin-email-nav-item ${activeTab === 'sent' ? 'active' : ''}`}
              onClick={() => setActiveTab('sent')}
            >
              <div className="admin-email-nav-left">
                <Send size={17} />
                <span>Sent Emails</span>
              </div>
              {overviewData?.activity?.smtpAccepted > 0 && (
                <span className="admin-email-badge badge-green">{overviewData.activity.smtpAccepted}</span>
              )}
            </button>

            <button
              type="button"
              className={`admin-email-nav-item ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => setActiveTab('drafts')}
            >
              <div className="admin-email-nav-left">
                <FileText size={17} />
                <span>Drafts</span>
              </div>
              {drafts.length > 0 && (
                <span className="admin-email-badge badge-amber">{drafts.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`admin-email-nav-item ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              <div className="admin-email-nav-left">
                <Sparkles size={17} />
                <span>Email Templates</span>
              </div>
              <span className="admin-email-badge">8</span>
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--admin-border-subtle)', margin: '0.65rem 0.85rem' }} />

            <button
              type="button"
              className={`admin-email-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <div className="admin-email-nav-left">
                <Settings size={17} />
                <span>SMTP Settings</span>
              </div>
              <span className="admin-badge admin-badge-info" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                465 SSL
              </span>
            </button>

            <button
              type="button"
              className={`admin-email-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <div className="admin-email-nav-left">
                <Clock size={17} />
                <span>Delivery Logs</span>
              </div>
            </button>
          </div>

          {/* Mailbox Status Card at Bottom of Nav */}
          <div className="admin-email-nav-footer">
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-muted)', marginBottom: '0.35rem', fontWeight: 700 }}>
              Sender Mailbox
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text-primary)', wordBreak: 'break-all' }}>
              {senderEmail}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem', fontSize: '0.74rem', color: '#16A34A' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
              <span>{smtpHost}:{smtpPort}</span>
            </div>
          </div>
        </div>

        {/* ==========================================================
            AREA 2: MAIN EMAIL WORKSPACE
            ========================================================== */}
        <div className="admin-email-workspace-col">

          {/* ==========================================================
              SUB-VIEW 1: OVERVIEW
              ========================================================== */}
          {activeTab === 'overview' && (
            <div className="admin-email-tab-pane">
              
              {/* Header Title Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                    Email Center Overview
                  </h1>
                  <p style={{ fontSize: '0.86rem', color: 'var(--admin-text-secondary)', margin: '0.25rem 0 0' }}>
                    Authoritative Hostinger SMTP management for Pratyaksh Ayurveda communications &amp; student notifications.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testConnectionRunning}
                    className="admin-btn admin-btn-secondary"
                    title="Verify socket connection and credentials with Hostinger SMTP"
                  >
                    <RefreshCw size={14} className={testConnectionRunning ? 'spin-animation' : ''} />
                    <span>{testConnectionRunning ? 'Verifying...' : 'Check SMTP Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestEmailModalOpen(true)}
                    className="admin-btn admin-btn-primary"
                  >
                    <Send size={14} />
                    <span>Send Test Email</span>
                  </button>
                </div>
              </div>

              {/* SMTP Connection Status Banner */}
              <div className="admin-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #1E40AF', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(30, 64, 175, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40AF' }}>
                      <Server size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                          Hostinger Business Email SMTP
                        </span>
                        <span className={`admin-badge ${overviewData?.smtpStatus?.passwordConfigured ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                          {overviewData?.smtpStatus?.passwordConfigured ? 'Credentials Configured' : 'Password Missing in ENV'}
                        </span>
                        {overviewData?.smtpStatus?.lastVerificationStatus && (
                          <span className={`admin-badge ${overviewData.smtpStatus.lastVerificationStatus === 'Connection Verified' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                            {overviewData.smtpStatus.lastVerificationStatus}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginTop: '0.2rem' }}>
                        Endpoint: <code>{smtpHost}:{smtpPort}</code> &bull; Security: <strong>{overviewData?.smtpStatus?.security || 'Not configured'}</strong> &bull; Mailbox: <code>{senderEmail}</code>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                      Last Verified: {overviewData?.smtpStatus?.lastVerifiedAt ? new Date(overviewData.smtpStatus.lastVerifiedAt).toLocaleTimeString() : 'Never'}
                    </div>
                    {overviewData?.smtpStatus?.lastVerificationError && (
                      <div style={{ fontSize: '0.76rem', color: '#DC2626', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {overviewData.smtpStatus.lastVerificationError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Total Submissions</div>
                  <div className="admin-stat-value" style={{ color: 'var(--admin-text-primary)' }}>
                    {overviewData?.activity?.totalSubmitted || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem' }}>
                    All-time recorded attempts
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-label">SMTP Accepted</div>
                  <div className="admin-stat-value" style={{ color: '#15803D' }}>
                    {overviewData?.activity?.smtpAccepted || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#15803D', marginTop: '0.35rem', fontWeight: 600 }}>
                    Accepted by Hostinger
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-label">Failed Submissions</div>
                  <div className="admin-stat-value" style={{ color: '#DC2626' }}>
                    {overviewData?.activity?.failed || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.35rem' }}>
                    Rejected or timeout errors
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-label">Sent Today</div>
                  <div className="admin-stat-value" style={{ color: '#2563EB' }}>
                    {overviewData?.activity?.sentToday || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem' }}>
                    Since 00:00 UTC
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-label">Pending Queue</div>
                  <div className="admin-stat-value" style={{ color: '#D97706' }}>
                    {overviewData?.activity?.pending || 0}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem' }}>
                    Awaiting dispatch
                  </div>
                </div>

              </div>

              {/* Delivery Disclaimer Card */}
              <div style={{ padding: '0.85rem 1.15rem', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', fontSize: '0.82rem', color: '#92400E', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Technical Delivery Note:</strong> "SMTP Accepted" indicates Hostinger's mail transport accepted the message into its transmission queue. Final delivery to a student's inbox depends on destination mailbox MX, SPF/DKIM verification, and spam filters.
                </span>
              </div>

              {/* Recent Activity Table */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-title">Recent Outgoing Submissions</div>
                    <div className="admin-card-subtitle">Real-time submissions recorded in MySQL</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sent')}
                    className="admin-btn admin-btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                  >
                    <span>View All Sent</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Template</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData?.recentLogs?.length > 0 ? (
                        overviewData.recentLogs.map((log) => (
                          <tr key={log.id}>
                            <td style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                              {log.recipient}
                            </td>
                            <td style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.subject}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontFamily: 'monospace' }}>
                                {log.template_key || 'custom'}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${log.submission_status === 'SMTP Accepted' ? 'admin-badge-success' : log.submission_status === 'Failed' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                                {log.submission_status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-text-muted)' }}>
                            No email activity recorded yet. Click "Send Test Email" to initiate the first Hostinger transmission.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================================
              SUB-VIEW 2: COMPOSE EMAIL
              ========================================================== */}
          {activeTab === 'compose' && (
            <div className="admin-email-tab-pane">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                    Compose Message
                  </h1>
                  <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginTop: '0.2rem' }}>
                    Sends through the configured mailbox: <code>{senderEmail}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {activeDraftId && (
                    <span className="admin-badge admin-badge-warning">Editing Draft #{activeDraftId.slice(-6)}</span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="admin-btn admin-btn-secondary"
                  >
                    <Save size={14} />
                    <span>Save Draft</span>
                  </button>
                </div>
              </div>

              {composeFeedback && (
                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  marginBottom: '1.25rem',
                  backgroundColor: composeFeedback.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${composeFeedback.success ? '#86EFAC' : '#FCA5A5'}`,
                  color: composeFeedback.success ? '#166534' : '#991B1B'
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {composeFeedback.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span>{composeFeedback.success ? 'Message Accepted by Hostinger SMTP' : 'Transmission Failure'}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', marginTop: '0.35rem' }}>
                    {composeFeedback.success 
                      ? `Message ID: ${composeFeedback.messageId || 'Accepted'} • Status: ${composeFeedback.status}`
                      : composeFeedback.error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSendCompose} className="admin-card" style={{ padding: '1.5rem' }}>
                
                {/* Template Selector Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--admin-border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--admin-text-secondary)' }}>
                    <Sparkles size={16} color="var(--admin-primary)" />
                    <span>Apply Pre-configured Template:</span>
                  </div>
                  <select
                    className="admin-form-select"
                    style={{ width: 'auto', minWidth: '240px', padding: '0.45rem 0.75rem', fontSize: '0.84rem' }}
                    value={composeTemplateKey}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                  >
                    <option value="">-- Custom Compose (No Template) --</option>
                    {templates.map(t => (
                      <option key={t.template_key} value={t.template_key}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Input */}
                {composeTemplateKey && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.75rem', marginBottom: '1rem' }}>
                  {(JSON.parse(templates.find(t => t.template_key === composeTemplateKey)?.variables_json || '[]')).filter(key => !['app_url','dashboard_url','membership_url','live_url','admin_url'].includes(key)).map(key => <label key={key} className="admin-form-label">{key.replaceAll('_', ' ')}<input className="admin-form-input" required value={composeVariables[key] || ''} onChange={event => setComposeVariables(prev => ({...prev,[key]:event.target.value}))}/></label>)}
                </div>}
                <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                  <label className="admin-form-label">To (Recipient Address):</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    className="admin-form-input"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                  />
                </div>

                {/* Subject Input */}
                <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                  <label className="admin-form-label">Subject:</label>
                  <input
                    type="text"
                    required
                    placeholder="Subject line..."
                    className="admin-form-input"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                </div>

                {/* Editor Tabs: Edit vs Preview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className={`admin-btn ${composeMode === 'rich' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => setComposeMode('rich')}
                    >
                      HTML &amp; Text Source
                    </button>
                    <button
                      type="button"
                      className={`admin-btn ${composeMode === 'preview' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => setComposeMode('preview')}
                    >
                      <Eye size={13} />
                      <span>Live Rendered Preview</span>
                    </button>
                  </div>

                  <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                    Supports full HTML email markup and CSS inlining
                  </span>
                </div>

                {/* Message Body Input */}
                {composeMode === 'rich' ? (
                  <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
                    <textarea
                      required
                      rows={14}
                      placeholder="Write your email content in HTML or plain text..."
                      className="admin-form-textarea"
                      style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                    />
                  </div>
                ) : (
                  <div style={{
                    minHeight: '280px',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    border: '1px solid var(--admin-border-subtle)',
                    borderRadius: 'var(--admin-radius-md)',
                    padding: '1.25rem',
                    backgroundColor: '#FFFFFF',
                    color: '#1F2937',
                    marginBottom: '1.25rem'
                  }}>
                    <iframe title="Composed email preview" sandbox="" referrerPolicy="no-referrer" srcDoc={composePreviewHtml || '<p>No content composed yet.</p>'} style={{ width: '100%', height: 500, border: 0 }}/>
                  </div>
                )}

                {/* Available Variables Helpers */}
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    Available Template Tokens:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {['{{student_name}}', '{{otp_code}}', '{{expiry_minutes}}', '{{membership_name}}', '{{membership_expiry}}', '{{payment_reference}}', '{{amount}}'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setComposeBody(prev => prev + ' ' + v)}
                        className="admin-badge admin-badge-info"
                        style={{ cursor: 'pointer', fontFamily: 'monospace' }}
                        title="Click to insert at end of body"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Sender: <strong>{senderName} &lt;{senderEmail}&gt;</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => {
                        if (window.confirm('Discard current composition?')) {
                          setComposeTo('');
                          setComposeSubject('');
                          setComposeBody('');
                          setActiveDraftId(null);
                        }
                      }}
                    >
                      Discard
                    </button>

                    <button
                      type="submit"
                      disabled={composeSending}
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '0.65rem 1.6rem', fontSize: '0.9rem', fontWeight: 700 }}
                    >
                      <Send size={16} />
                      <span>{composeSending ? 'Dispatching...' : 'Send Email'}</span>
                    </button>
                  </div>
                </div>

              </form>

            </div>
          )}

          {/* ==========================================================
              SUB-VIEW 3: SENT EMAILS
              ========================================================== */}
          {activeTab === 'sent' && (
            <div className="admin-email-tab-pane">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                    Sent Email Archive
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: '0.2rem 0 0' }}>
                    Authoritative transmission ledger stored in MySQL database with server-side pagination.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchSentEmails(sentPage)}
                  className="admin-btn admin-btn-secondary"
                >
                  <RefreshCw size={14} className={sentLoading ? 'spin-animation' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="admin-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                  <Search size={16} color="var(--admin-text-muted)" />
                  <input
                    type="text"
                    placeholder="Search recipient, subject, or message ID..."
                    className="admin-form-input"
                    style={{ padding: '0.45rem 0.75rem' }}
                    value={sentSearch}
                    onChange={(e) => setSentSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchSentEmails(1); }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={15} color="var(--admin-text-muted)" />
                  <select
                    className="admin-form-select"
                    style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    value={sentStatusFilter}
                    onChange={(e) => { setSentStatusFilter(e.target.value); setSentPage(1); }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="SMTP Accepted">SMTP Accepted</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="admin-card">
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Template Key</th>
                        <th>Status</th>
                        <th>Sent Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentLoading ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
                            <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.75rem' }} />
                            <div>Loading sent records from database...</div>
                          </td>
                        </tr>
                      ) : sentData.items.length > 0 ? (
                        sentData.items.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                              {item.recipient}
                            </td>
                            <td style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.subject}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: 'var(--admin-text-secondary)' }}>
                                {item.template_key || 'custom'}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${item.submission_status === 'SMTP Accepted' ? 'admin-badge-success' : item.submission_status === 'Failed' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                                {item.submission_status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                              {new Date(item.created_at).toLocaleString()}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => setSelectedEmailDetail(item)}
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
                            No email records match the selected filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {sentData.pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--admin-border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                      Showing Page {sentData.pagination.page} of {sentData.pagination.totalPages} ({sentData.pagination.total} total)
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        disabled={sentPage <= 1}
                        onClick={() => setSentPage(p => Math.max(1, p - 1))}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        <ChevronLeft size={14} />
                        <span>Prev</span>
                      </button>
                      <button
                        type="button"
                        disabled={sentPage >= sentData.pagination.totalPages}
                        onClick={() => setSentPage(p => p + 1)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==========================================================
              SUB-VIEW 4: DRAFTS
              ========================================================== */}
          {activeTab === 'drafts' && (
            <div className="admin-email-tab-pane">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                    Saved Drafts
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: '0.2rem 0 0' }}>
                    Personal composition drafts stored in MySQL and editable anytime.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchDrafts}
                  className="admin-btn admin-btn-secondary"
                >
                  <RefreshCw size={14} className={draftsLoading ? 'spin-animation' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="admin-card">
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Last Modified</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.length > 0 ? (
                        drafts.map((draft) => (
                          <tr key={draft.id}>
                            <td style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                              {draft.recipient || <em style={{ color: 'var(--admin-text-muted)' }}>(No Recipient)</em>}
                            </td>
                            <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {draft.subject || <em style={{ color: 'var(--admin-text-muted)' }}>(No Subject)</em>}
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                              {new Date(draft.updated_at).toLocaleString()}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.45rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDraft(draft)}
                                  className="admin-btn admin-btn-primary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  <Edit3 size={13} />
                                  <span>Resume</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDraft(draft.id)}
                                  className="admin-btn admin-btn-danger"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
                            No saved drafts found. When composing a message, click "Save Draft" to preserve your work.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================================
              SUB-VIEW 5: EMAIL TEMPLATES
              ========================================================== */}
          {activeTab === 'templates' && (
            <div className="admin-email-tab-pane">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                    Pratyaksh Ayurveda Email Templates
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: '0.2rem 0 0' }}>
                    {templates.length} branded templates with secure variables and mobile, desktop and plain-text previews.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchTemplates}
                  className="admin-btn admin-btn-secondary"
                >
                  <RefreshCw size={14} className={templatesLoading ? 'spin-animation' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="admin-card" style={{ padding: '1rem', marginBottom: '1rem', fontSize: '.85rem', lineHeight: 1.7 }}>
                <strong>Connected to the current system</strong><br/>
                Student verification, student sign-in, administrator sign-in and password reset use these templates automatically. Welcome, membership, payment and account updates are ready to use; storing or enabling a template does not schedule an email. Renewal wording follows the rule that renewal opens after expiry.
              </div>
              {/* Templates Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.15rem' }}>
                {templates.map((tpl) => (
                  <div key={tpl.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem 1.4rem', marginBottom: 0 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                            {tpl.name}
                          </div>
                          <code style={{ fontSize: '0.74rem', color: 'var(--admin-primary)', background: 'rgba(30, 64, 175, 0.08)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            {tpl.template_key}
                          </code>
                        </div>
                        <span className={`admin-badge ${tpl.category === 'authentication' ? 'admin-badge-warning' : tpl.category === 'payment' ? 'admin-badge-success' : 'admin-badge-info'}`}>
                          {tpl.category}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                        <strong>Default Subject:</strong> {tpl.subject}
                      </div>

                      {tpl.variables_json && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginBottom: '1rem' }}>
                          Variables: {JSON.parse(tpl.variables_json || '[]').map(v => `{{${v}}}`).join(', ')}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid var(--admin-border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() => handlePreviewTemplate(tpl.id)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>

                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() => handleRestoreTemplateDefault(tpl.id)}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                          title="Restore canonical default content"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTemplate({ ...tpl })}
                          className="admin-btn admin-btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ==========================================================
              SUB-VIEW 6: SMTP SETTINGS
              ========================================================== */}
          {activeTab === 'settings' && (
            <div className="admin-email-tab-pane">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                    Hostinger SMTP Configuration
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: '0.2rem 0 0' }}>
                    Production email dispatch settings configured through Hostinger Business Mailbox.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testConnectionRunning}
                    className="admin-btn admin-btn-secondary"
                  >
                    <RefreshCw size={14} className={testConnectionRunning ? 'spin-animation' : ''} />
                    <span>{testConnectionRunning ? 'Verifying...' : 'Check Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestEmailModalOpen(true)}
                    className="admin-btn admin-btn-primary"
                  >
                    <Send size={14} />
                    <span>Send Test Email</span>
                  </button>
                </div>
              </div>

              {testConnectionResult && (
                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  marginBottom: '1.25rem',
                  backgroundColor: testConnectionResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${testConnectionResult.success ? '#86EFAC' : '#FCA5A5'}`,
                  color: testConnectionResult.success ? '#166534' : '#991B1B'
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {testConnectionResult.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span>{testConnectionResult.status}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', marginTop: '0.35rem' }}>
                    {testConnectionResult.message}
                  </div>
                </div>
              )}

              <div className="admin-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  
                  <div>
                    <label className="admin-form-label">Email Provider:</label>
                    <input
                      type="text"
                      readOnly
                      className="admin-form-input"
                      value={smtpSettings?.provider || 'Hostinger Email'}
                      style={{ backgroundColor: 'var(--admin-bg-base)' }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">SMTP Host:</label>
                    <input
                      type="text"
                      readOnly
                      className="admin-form-input"
                      value={smtpSettings?.host || 'smtp.hostinger.com'}
                      style={{ backgroundColor: 'var(--admin-bg-base)' }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">SMTP Port:</label>
                    <input
                      type="text"
                      readOnly
                      className="admin-form-input"
                      value={smtpSettings?.port || 465}
                      style={{ backgroundColor: 'var(--admin-bg-base)' }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Encryption Protocol:</label>
                    <input
                      type="text"
                      readOnly
                      className="admin-form-input"
                      value={smtpSettings?.security || 'SSL/TLS (Implicit)'}
                      style={{ backgroundColor: 'var(--admin-bg-base)' }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">SMTP Username (Mailbox):</label>
                    <input
                      type="text"
                      readOnly
                      className="admin-form-input"
                      value={smtpSettings?.username || 'noreply@ayurvedasidhi.com'}
                      style={{ backgroundColor: 'var(--admin-bg-base)' }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Sender Display Name:</label>
                    <input
                      type="text"
                      readOnly
                      className="admin-form-input"
                      value={smtpSettings?.fromName || 'Pratyaksh Ayurveda'}
                      style={{ backgroundColor: 'var(--admin-bg-base)' }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Sender Email Address:</label>
                    <input
                      type="text"
                      readOnly
                      className="admin-form-input"
                      value={smtpSettings?.fromEmail || 'noreply@ayurvedasidhi.com'}
                      style={{ backgroundColor: 'var(--admin-bg-base)' }}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Mailbox Password Status:</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '38px', gap: '0.65rem' }}>
                      <span className={`admin-badge ${smtpSettings?.passwordConfigured ? 'admin-badge-success' : 'admin-badge-warning'}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.65rem' }}>
                        {smtpSettings?.passwordStatus || 'Configured'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                        (Protected server secret &bull; Never stored in plaintext)
                      </span>
                    </div>
                  </div>

                </div>

                {/* Instructions Box */}
                <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--admin-bg-base)', borderRadius: '10px', border: '1px solid var(--admin-border-subtle)', fontSize: '0.84rem', lineHeight: 1.55 }}>
                  <div style={{ fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Key size={16} color="var(--admin-primary)" />
                    <span>How to set or rotate your Hostinger Mailbox Password</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-secondary)' }}>
                    To ensure keep credentials out of the browser and source control, the mailbox password is held securely in the server environment file (<code>.env</code> or Hostinger Environment Secrets):
                  </p>
                  <code style={{ display: 'block', background: 'rgba(0,0,0,0.06)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--admin-text-primary)', marginBottom: '0.5rem' }}>
                    SMTP_HOST=smtp.hostinger.com<br />
                    SMTP_PORT=465<br />
                    SMTP_SECURE=true<br />
                    SMTP_USER=noreply@ayurvedasidhi.com<br />
                    SMTP_PASSWORD=YOUR_PRIVATE_HOSTINGER_PASSWORD_HERE<br />
                    SMTP_FROM_NAME=Pratyaksh Ayurveda<br />
                    SMTP_FROM_EMAIL=noreply@ayurvedasidhi.com
                  </code>
                </div>

              </div>

            </div>
          )}

          {/* ==========================================================
              SUB-VIEW 7: DELIVERY LOGS
              ========================================================== */}
          {activeTab === 'logs' && (
            <div className="admin-email-tab-pane">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                    SMTP Delivery Audit Logs
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: '0.2rem 0 0' }}>
                    Granular system audit records of all SMTP transmissions, response codes, and sanitized errors.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchSentEmails(1)}
                  className="admin-btn admin-btn-secondary"
                >
                  <RefreshCw size={14} className={sentLoading ? 'spin-animation' : ''} />
                  <span>Refresh Logs</span>
                </button>
              </div>

              <div className="admin-card">
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Log ID</th>
                        <th>Recipient</th>
                        <th>Status</th>
                        <th>Message ID / Error</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentData.items.length > 0 ? (
                        sentData.items.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <code style={{ fontSize: '0.74rem' }}>{log.id}</code>
                            </td>
                            <td style={{ fontWeight: 600 }}>{log.recipient}</td>
                            <td>
                              <span className={`admin-badge ${log.submission_status === 'SMTP Accepted' ? 'admin-badge-success' : log.submission_status === 'Failed' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                                {log.submission_status}
                              </span>
                            </td>
                            <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>
                              {log.submission_status === 'SMTP Accepted' ? (
                                <span style={{ color: '#15803D', fontFamily: 'monospace' }}>{log.message_id}</span>
                              ) : (
                                <span style={{ color: '#DC2626' }}>{log.sanitized_error || 'Unknown error'}</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
                            No delivery audit logs recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ==========================================================
          MODAL 1: SEND TEST EMAIL
          ========================================================== */}
      {testEmailModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setTestEmailModalOpen(false)}>
          <div className="admin-modal-dialog" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} color="var(--admin-primary)" />
                <span className="admin-modal-title">Send Real Hostinger SMTP Test Email</span>
              </div>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setTestEmailModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="admin-modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', marginBottom: '1.25rem' }}>
                Sends a test email through the configured mailbox (<code>{senderEmail}</code>) to the recipient you choose. SMTP acceptance is shown separately from delivery.
              </p>

              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Recipient Test Address:</label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  className="admin-form-input"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Enter an address you have access to so you can verify inbox arrival.
                </span>
              </div>

              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Subject:</label>
                <input
                  type="text"
                  readOnly
                  className="admin-form-input"
                  value="Pratyaksh Ayurveda SMTP Configuration Test"
                  style={{ backgroundColor: 'var(--admin-bg-base)' }}
                />
              </div>

              {testSendResult && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  backgroundColor: testSendResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${testSendResult.success ? '#86EFAC' : '#FCA5A5'}`,
                  color: testSendResult.success ? '#166534' : '#991B1B'
                }}>
                  <div style={{ fontWeight: 700 }}>
                    {testSendResult.success ? '✓ Hostinger SMTP Accepted Message' : '✗ Dispatch Failed'}
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    {testSendResult.success 
                      ? `Message ID: ${testSendResult.messageId}. Please check the recipient's inbox (and spam/junk folder) now.`
                      : testSendResult.error}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setTestEmailModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="admin-btn admin-btn-primary"
                >
                  <Send size={15} />
                  <span>{testSending ? 'Transmitting...' : 'Send Test Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 2: TEMPLATE PREVIEW
          ========================================================== */}
      {previewTemplateData && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewTemplateData(null)}>
          <div className="admin-modal-dialog" style={{ maxWidth: 650 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="admin-modal-title">Template Preview: {previewTemplateData.name}</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', marginTop: '0.2rem' }}>
                  Subject: <strong>{previewTemplateData.subject}</strong>
                </div>
              </div>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setPreviewTemplateData(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', background: 'var(--admin-bg-base)', borderRadius: '6px', fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                Sample Variables: {Object.entries(previewTemplateData.sampleVars || {}).map(([k, v]) => `${k}="${v}"`).join(', ')}
              </div>
              <div style={{ border: '1px solid var(--admin-border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '.5rem', padding: '.75rem', flexWrap: 'wrap' }}>
                  {['desktop', 'mobile', 'text'].map(mode => <button key={mode} type="button" className={`admin-btn ${previewMode === mode ? 'admin-btn-primary' : 'admin-btn-secondary'}`} aria-pressed={previewMode === mode} onClick={() => setPreviewMode(mode)}>{mode === 'text' ? 'Plain text' : mode === 'mobile' ? 'Mobile' : 'Desktop'}</button>)}
                </div>
                {previewMode === 'text' ? <pre style={{ whiteSpace: 'pre-wrap', padding: '1rem', fontFamily: 'inherit' }}>{previewTemplateData.text}</pre> : <iframe title={`${previewTemplateData.name} email preview`} sandbox="" referrerPolicy="no-referrer" srcDoc={previewTemplateData.html} style={{ display: 'block', width: previewMode === 'mobile' ? 'min(100%, 375px)' : '100%', height: 640, border: 0, margin: '0 auto', background: '#f5f2ed' }}/>}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setPreviewTemplateData(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 3: EDIT TEMPLATE
          ========================================================== */}
      {editingTemplate && (
        <div className="admin-modal-backdrop" onClick={() => setEditingTemplate(null)}>
          <div className="admin-modal-dialog" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span className="admin-modal-title">Edit Template: {editingTemplate.name}</span>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setEditingTemplate(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateEdit} className="admin-modal-body">
              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Subject:</label>
                <input
                  type="text"
                  required
                  className="admin-form-input"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">HTML Body Markup:</label>
                <textarea
                  required
                  rows={12}
                  className="admin-form-textarea"
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                  value={editingTemplate.html_body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, html_body: e.target.value })}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="admin-form-label">Plain Text Fallback:</label>
                <textarea
                  required
                  rows={4}
                  className="admin-form-textarea"
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                  value={editingTemplate.text_body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, text_body: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setEditingTemplate(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 4: SENT EMAIL DETAIL
          ========================================================== */}
      {selectedEmailDetail && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedEmailDetail(null)}>
          <div className="admin-modal-dialog" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="admin-modal-title">Sent Email Details</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', marginTop: '0.2rem' }}>
                  Log ID: <code>{selectedEmailDetail.id}</code>
                </div>
              </div>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setSelectedEmailDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <table style={{ width: '100%', fontSize: '0.86rem', borderCollapse: 'collapse', marginBottom: '1.25rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600, width: '120px' }}>Recipient:</td>
                    <td style={{ padding: '0.6rem 0' }}>{selectedEmailDetail.recipient}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Subject:</td>
                    <td style={{ padding: '0.6rem 0' }}>{selectedEmailDetail.subject}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Status:</td>
                    <td style={{ padding: '0.6rem 0' }}>
                      <span className={`admin-badge ${selectedEmailDetail.submission_status === 'SMTP Accepted' ? 'admin-badge-success' : selectedEmailDetail.submission_status === 'Failed' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                        {selectedEmailDetail.submission_status}
                      </span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Template:</td>
                    <td style={{ padding: '0.6rem 0', fontFamily: 'monospace' }}>{selectedEmailDetail.template_key || 'custom'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Message ID:</td>
                    <td style={{ padding: '0.6rem 0', fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedEmailDetail.message_id || 'N/A'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>Created At:</td>
                    <td style={{ padding: '0.6rem 0' }}>{new Date(selectedEmailDetail.created_at).toLocaleString()}</td>
                  </tr>
                  {selectedEmailDetail.sanitized_error && (
                    <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                      <td style={{ padding: '0.6rem 0', fontWeight: 600, color: '#DC2626' }}>Error Details:</td>
                      <td style={{ padding: '0.6rem 0', color: '#DC2626', fontSize: '0.82rem' }}>{selectedEmailDetail.sanitized_error}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                  Sanitized Body Preview (Security Redacted):
                </div>
                <div style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--admin-bg-base)',
                  borderRadius: '8px',
                  border: '1px solid var(--admin-border-subtle)',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  maxHeight: '160px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedEmailDetail.body_preview || 'No preview stored'}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedEmailDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

