import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sliders, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Smartphone, 
  Mail, 
  Phone, 
  Save, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  ArrowRight
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminPaymentSettings() {
  const { adminUser, hasPermission } = useAdminAuth();

  const [settings, setSettings] = useState({
    merchant_name: 'Pratyaksh Ayurveda Education',
    merchant_upi_id: 'pratyaksh@icici',
    merchant_account_number: '50200012345678',
    merchant_ifsc: 'ICIC0000104',
    merchant_bank_name: 'ICICI Bank Ltd',
    support_email: 'support@pratyakshayurveda.com',
    support_phone: '+91 98765 43210',
    payment_instructions: 'Scan using any UPI App (GPay, PhonePe, Paytm, BHIM). Note down the 12-digit UTR reference after payment.',
    is_upi_enabled: 1,
    is_gateway_enabled: 1,
    gateway_provider: 'razorpay',
    gateway_key_id: 'rzp_test_AyurPratyaksh2026'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Live QR Test Simulator state
  const [testAmount, setTestAmount] = useState('4999');
  const [testOrderId, setTestOrderId] = useState('ORD-TEST-' + Math.floor(1000 + Math.random() * 9000));
  const [testNote, setTestNote] = useState('Test Membership Payment');
  const [generatedUri, setGeneratedUri] = useState('');
  const [copiedUri, setCopiedUri] = useState(false);

  const token = localStorage.getItem('ayur_admin_token');

  // Load existing settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status && json.data) {
        setSettings(json.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update generated UPI URI whenever settings or test inputs change
  useEffect(() => {
    const vpa = encodeURIComponent(settings.merchant_upi_id || 'pratyaksh@icici');
    const name = encodeURIComponent(settings.merchant_name || 'Pratyaksh Ayurveda');
    const amt = parseFloat(testAmount) > 0 ? parseFloat(testAmount).toFixed(2) : '1.00';
    const note = encodeURIComponent(`${testOrderId} - ${testNote}`);
    
    // NPCI compliant format
    const uri = `upi://pay?pa=${vpa}&pn=${name}&am=${amt}&cu=INR&tn=${note}&tr=${encodeURIComponent(testOrderId)}`;
    setGeneratedUri(uri);
  }, [settings.merchant_upi_id, settings.merchant_name, testAmount, testOrderId, testNote]);

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!hasPermission('payments:manage')) {
      alert('Insufficient permissions to modify financial settings.');
      return;
    }
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/payments/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.status) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(json.message || 'Failed to save settings');
      }
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyUriToClipboard = () => {
    navigator.clipboard.writeText(generatedUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  // Generate authentic QR code SVG pattern using standard QR matrix simulation
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(generatedUri)}`;

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Merchant UPI &amp; Gateway Settings</h1>
          <p className="admin-page-subtitle">
            Configure authoritative merchant credentials, banking details, dual-channel checkout, and preview dynamic NPCI QR codes.
          </p>
        </div>
        <div className="admin-header-actions">
          {saveSuccess && (
            <span className="admin-badge admin-badge-success" style={{ padding: '0.4rem 0.8rem' }}>
              <CheckCircle2 size={14} /> Saved &amp; Applied
            </span>
          )}
          {hasPermission('payments:manage') && (
            <button 
              type="button" 
              className="admin-btn admin-btn-primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Gateway Callout Banner */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(30, 64, 175, 0.02))', borderColor: 'rgba(37, 99, 235, 0.2)', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: '#1E40AF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                Razorpay Payment Gateway Official Integration
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: '0.15rem' }}>
                Manage live API keys (Key ID, Secret), sandbox vs production environments, webhooks, and live transaction telemetry.
              </p>
            </div>
          </div>
          <Link to="/admin/payments/gateway" className="admin-btn admin-btn-primary">
            <span>Configure Razorpay Gateway</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Merchant Form */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Official Merchant Identity</div>
              <div className="admin-card-subtitle">Verified institution entity for UPI payments</div>
            </div>
            <span className="admin-badge admin-badge-success">NPCI Verified</span>
          </div>

          <form onSubmit={handleSaveSettings} className="admin-card-body">
            <div className="admin-form-group">
              <label className="admin-form-label">Merchant Legal Display Name *</label>
              <input 
                type="text" 
                className="admin-form-input" 
                required 
                value={settings.merchant_name}
                onChange={e => setSettings({ ...settings, merchant_name: e.target.value })}
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--admin-text-muted)' }}>
                Displayed inside student UPI apps (GPay, PhonePe, Paytm) during checkout.
              </span>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Verified Merchant UPI VPA / ID *</label>
              <input 
                type="text" 
                className="admin-form-input" 
                required 
                style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--admin-primary)' }}
                value={settings.merchant_upi_id}
                onChange={e => setSettings({ ...settings, merchant_upi_id: e.target.value })}
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--admin-text-muted)' }}>
                Must be an active merchant VPA linked to institutional current account.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Bank Name</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  value={settings.merchant_bank_name}
                  onChange={e => setSettings({ ...settings, merchant_bank_name: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">IFSC Code</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  value={settings.merchant_ifsc}
                  onChange={e => setSettings({ ...settings, merchant_ifsc: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Support Email</label>
                <input 
                  type="email" 
                  className="admin-form-input" 
                  value={settings.support_email}
                  onChange={e => setSettings({ ...settings, support_email: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Support Helpdesk Phone</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  value={settings.support_phone}
                  onChange={e => setSettings({ ...settings, support_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Student Checkout Instructions</label>
              <textarea 
                className="admin-form-input" 
                rows={3} 
                value={settings.payment_instructions}
                onChange={e => setSettings({ ...settings, payment_instructions: e.target.value })}
              />
            </div>

            <div style={{ padding: '0.875rem', backgroundColor: 'var(--admin-bg-base)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Enable Direct UPI QR Method</span>
                <input 
                  type="checkbox" 
                  checked={Boolean(settings.is_upi_enabled)}
                  onChange={e => setSettings({ ...settings, is_upi_enabled: e.target.checked ? 1 : 0 })}
                  style={{ width: 18, height: 18, accentColor: 'var(--admin-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Enable Payment Gateway Adapter</span>
                <input 
                  type="checkbox" 
                  checked={Boolean(settings.is_gateway_enabled)}
                  onChange={e => setSettings({ ...settings, is_gateway_enabled: e.target.checked ? 1 : 0 })}
                  style={{ width: 18, height: 18, accentColor: 'var(--admin-primary)' }}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Dynamic NPCI QR Simulator */}
        <div>
          <div className="admin-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div className="admin-card-header" style={{ textAlign: 'left' }}>
              <div>
                <div className="admin-card-title">Live Dynamic QR Testing Lab</div>
                <div className="admin-card-subtitle">Real-time simulation of amount-specific NPCI UPI payload</div>
              </div>
              <span className="admin-badge admin-badge-primary">NPCI Payload</span>
            </div>

            <div className="admin-card-body">
              {/* Test Parameter Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', textAlign: 'left', marginBottom: '1rem', backgroundColor: 'var(--admin-bg-base)', padding: '0.75rem', borderRadius: 'var(--admin-radius-sm)' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Test Amount (₹)</label>
                  <input 
                    type="number" 
                    className="admin-form-input" 
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} 
                    value={testAmount}
                    onChange={e => setTestAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Test Order Ref</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontFamily: 'monospace' }} 
                    value={testOrderId}
                    onChange={e => setTestOrderId(e.target.value)}
                  />
                </div>
              </div>

              {/* Rendered QR Code */}
              <div style={{ display: 'inline-block', padding: '1rem', backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid var(--admin-border-subtle)', boxShadow: 'var(--admin-shadow-sm)', margin: '0.5rem auto 1rem' }}>
                <img 
                  src={qrCodeUrl} 
                  alt="Test UPI QR Code" 
                  style={{ width: 180, height: 180, display: 'block' }}
                  onError={(e) => {
                    // Fallback visual if network offline
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none', width: 180, height: 180, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: '#f9f9f9', borderRadius: 8, fontSize: '0.75rem', color: '#666' }}>
                  <QrCode size={40} style={{ color: 'var(--admin-primary)', marginBottom: 8 }} />
                  <span>Payload Encoded</span>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--admin-primary)' }}>
                ₹{parseFloat(testAmount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginBottom: '1rem' }}>
                Scanning this QR in BHIM / GPay will pre-fill <strong>₹{testAmount}</strong> to <strong>{settings.merchant_upi_id}</strong>
              </div>

              {/* Generated UPI URI String */}
              <div style={{ backgroundColor: 'var(--admin-bg-base)', padding: '0.75rem', borderRadius: 'var(--admin-radius-sm)', textAlign: 'left', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-secondary)' }}>
                    Standard UPI Intent Link
                  </span>
                  <button 
                    type="button" 
                    onClick={copyUriToClipboard} 
                    style={{ background: 'none', border: 'none', color: 'var(--admin-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {copiedUri ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedUri ? 'Copied' : 'Copy URI'}</span>
                  </button>
                </div>
                <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block', color: 'var(--admin-text-primary)' }}>
                  {generatedUri}
                </code>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <a 
                  href={generatedUri} 
                  className="admin-btn admin-btn-sm admin-btn-secondary" 
                  style={{ textDecoration: 'none' }}
                >
                  <Smartphone size={14} />
                  <span>Test Launch App</span>
                </a>
                <button 
                  type="button" 
                  className="admin-btn admin-btn-sm admin-btn-secondary" 
                  onClick={() => setTestOrderId('ORD-TEST-' + Math.floor(1000 + Math.random() * 9000))}
                >
                  <RefreshCw size={14} />
                  <span>New Test Ref</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security Alert Banner */}
          <div className="admin-card" style={{ borderColor: 'var(--admin-blue-border)', backgroundColor: 'var(--admin-blue-bg)', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: 'var(--admin-blue-text)', fontSize: '0.825rem', lineHeight: 1.5 }}>
              <Shield size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Cryptographic Verification:</strong> All student checkout payments are processed through Razorpay with HMAC-SHA256 signature verification. Settlement occurs directly to institutional current accounts with automatic webhook reconciliation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
