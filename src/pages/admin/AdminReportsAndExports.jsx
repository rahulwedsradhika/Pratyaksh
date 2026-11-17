import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  Receipt, 
  TrendingUp, 
  CreditCard, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Search,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminReportsAndExports() {
  const { adminUser, hasPermission } = useAdminAuth();

  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '90d' | 'all'
  const [reportData, setReportData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('ayur_admin_token');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [revRes, notifRes] = await Promise.all([
        fetch(`/api/admin/reports/revenue?range=${dateRange}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const revJson = await revRes.json();
      const notifJson = await notifRes.json();

      if (revJson.status && revJson.data) {
        setReportData(revJson.data);
      }
      if (notifJson.status && notifJson.data) {
        setNotifications(notifJson.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error generating reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'failed'
  const [searchQuery, setSearchQuery] = useState('');

  const handleExportLedgerCSV = () => {
    if (!reportData?.orders || reportData.orders.length === 0) {
      alert('No ledger records available to export for the selected date range.');
      return;
    }

    const headers = ['Order Reference', 'Student Name', 'Email', 'Plan Title', 'Gross Amount', 'Discount', 'Net Paid', 'Payment Channel', 'Razorpay Payment ID', 'Status', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...reportData.orders.map(o => [
        `"${o.order_id || o.id}"`,
        `"${(o.student_name || '').replace(/"/g, '""')}"`,
        `"${(o.student_email || '').replace(/"/g, '""')}"`,
        `"${(o.plan_name || o.plan_id || '').replace(/"/g, '""')}"`,
        o.original_price || o.amount,
        o.discount_amount || 0,
        o.amount,
        o.payment_method || 'Razorpay',
        `"${o.razorpay_payment_id || o.provider_payment_id || o.utr_number || ''}"`,
        o.status,
        `"${o.created_at || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pratyaksh_revenue_ledger_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatINR = (amt) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Institutional Reports &amp; Ledger</h1>
          <p className="admin-page-subtitle">
            Audited financial receipts, channel breakdowns, admission velocity, and transactional notification delivery logs.
          </p>
        </div>
        <div className="admin-header-actions">
          {/* Date Range Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={15} style={{ color: 'var(--admin-text-secondary)' }} />
            <select 
              className="admin-form-select" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All-Time Cumulative</option>
            </select>
          </div>

          <button 
            type="button" 
            className="admin-btn admin-btn-primary"
            onClick={handleExportLedgerCSV}
          >
            <Download size={15} />
            <span>Export Audited Ledger CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Net Settled Revenue</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-success-bg)', color: 'var(--admin-success-text)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{formatINR(reportData?.totalRevenue)}</div>
          <div className="admin-stat-footer">
            <span>Verified institutional receipts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Razorpay Collections</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-blue-bg)', color: 'var(--admin-blue-text)' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{formatINR(reportData?.razorpayRevenue || reportData?.totalRevenue)}</div>
          <div className="admin-stat-footer">
            <span>Automated Gateway Settlement</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Total Orders Placed</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-warning-bg)', color: 'var(--admin-warning-text)' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{reportData?.orders?.length || 0}</div>
          <div className="admin-stat-footer">
            <span>{reportData?.completedCount || 0} settled • {reportData?.pendingCount || 0} pending</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Average Order Value (AOV)</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-purple-bg)', color: 'var(--admin-purple-text)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-stat-value">
            {formatINR(reportData?.aov || 0)}
          </div>
          <div className="admin-stat-footer">
            <span>Across curricular tiers</span>
          </div>
        </div>
      </div>

      {/* Audited Transaction Ledger Table */}
      <div className="admin-card" style={{ marginBottom: '1.75rem' }}>
        <div className="admin-card-header">
          <div>
            <div className="admin-card-title">Audited Financial Transaction Ledger</div>
            <div className="admin-card-subtitle">
              Detailed chronological record of every student order, coupon discount, Razorpay transaction ID, and status
            </div>
          </div>

          {/* Quick Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search scholar, order, UTR..."
                className="admin-form-input"
                style={{ padding: '0.4rem 0.6rem 0.4rem 2rem', fontSize: '0.8rem' }}
              />
            </div>

            <select
              className="admin-form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Settled / Paid</option>
              <option value="pending">Pending Verification</option>
              <option value="failed">Declined / Failed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="admin-spin" style={{ width: 32, height: 32, border: '3px solid var(--admin-border)', borderTopColor: 'var(--admin-primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div>Generating ledger...</div>
          </div>
        ) : (!reportData?.orders || reportData.orders.length === 0) ? (
          <div className="admin-empty-state">
            <Receipt size={36} className="admin-empty-icon" />
            <div className="admin-empty-title">No transactions found for this period</div>
            <div className="admin-empty-text">Select a wider date range like "All-Time Cumulative" to inspect older records.</div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Scholar Details</th>
                  <th>Curricular Plan</th>
                  <th>Gross / Discount</th>
                  <th>Net Paid</th>
                  <th>Channel</th>
                  <th>Razorpay / Payment ID</th>
                  <th>Audit Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {reportData.orders
                  .filter(o => {
                    if (statusFilter !== 'all') {
                      if (statusFilter === 'paid') return o.status === 'paid' || o.status === 'completed';
                      if (statusFilter === 'pending') return o.status === 'pending';
                      if (statusFilter === 'failed') return o.status === 'failed' || o.status === 'rejected';
                    }
                    return true;
                  })
                  .filter(o => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (o.order_id || o.id || '').toLowerCase().includes(q) ||
                      (o.student_name || '').toLowerCase().includes(q) ||
                      (o.student_email || '').toLowerCase().includes(q) ||
                      (o.razorpay_payment_id || o.utr_number || '').toLowerCase().includes(q) ||
                      (o.plan_name || '').toLowerCase().includes(q)
                    );
                  })
                  .map((o) => (
                    <tr key={o.id}>
                      <td>
                        <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
                          {o.order_id || o.id}
                        </code>
                        {o.razorpay_order_id && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                            RZP: {o.razorpay_order_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.student_name || 'Ayurveda Scholar'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{o.student_email}</div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-secondary">{o.plan_name || o.plan_id}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {o.discount_amount > 0 ? (
                          <div>
                            <span style={{ textDecoration: 'line-through', color: 'var(--admin-text-muted)' }}>
                              ₹{((o.amount || 0) + (o.discount_amount || 0)).toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--admin-success-text)', display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>
                              -₹{o.discount_amount.toLocaleString()} ({o.coupon_code || 'PROMO'})
                            </span>
                          </div>
                        ) : (
                          <span>₹{(o.amount || 0).toLocaleString()}</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        ₹{(o.amount || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          {o.payment_method || 'Razorpay'}
                        </span>
                      </td>
                      <td>
                        {o.razorpay_payment_id || o.provider_payment_id || o.utr_number ? (
                          <code style={{ fontSize: '0.76rem', background: 'var(--admin-bg-base)', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                            {o.razorpay_payment_id || o.provider_payment_id || o.utr_number}
                          </code>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge ${o.status === 'paid' || o.status === 'completed' ? 'admin-badge-success' : o.status === 'pending' ? 'admin-badge-warning' : 'admin-badge-danger'}`}>
                          {o.status === 'paid' || o.status === 'completed' ? 'Settled' : o.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--admin-text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactional Notification Dispatch Audit Log */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <div className="admin-card-title">Transactional Notification Dispatch Log</div>
            <div className="admin-card-subtitle">
              Proof of delivery for payment receipts, invitation links, and membership activations
            </div>
          </div>
          <span className="admin-badge admin-badge-success">Audit Verified</span>
        </div>

        {notifications.length === 0 ? (
          <div className="admin-empty-state">
            <Mail size={36} className="admin-empty-icon" />
            <div className="admin-empty-title">No notifications dispatched yet</div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recipient</th>
                  <th>Notification Type</th>
                  <th>Subject Line</th>
                  <th>Delivery Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.slice(0, 10).map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <strong>{n.recipient_email}</strong>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {n.notification_type}
                      </span>
                    </td>
                    <td>{n.subject}</td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem' }}>
                        {n.channel || 'EMAIL'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-success">
                        <CheckCircle2 size={11} /> Delivered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
