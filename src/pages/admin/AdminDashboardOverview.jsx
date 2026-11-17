import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ExternalLink,
  Receipt,
  Layers,
  Shield,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminDashboardOverview() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('ayur_admin_token');
      const res = await fetch('/api/admin/analytics/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status && json.data) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load analytics data');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  if (loading) {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="admin-card" style={{ height: 130, opacity: 0.6, padding: '1.25rem 1.5rem', boxSizing: 'border-box' }}>
              <div className="admin-skeleton" style={{ width: '40%', height: 16, marginBottom: 16 }} />
              <div className="admin-skeleton" style={{ width: '60%', height: 32, marginBottom: 8 }} />
              <div className="admin-skeleton" style={{ width: '30%', height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatINR = (amt) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  const revenuePoints = data?.revenue30DaysTrend || [];
  const maxRevenue = Math.max(...revenuePoints.map(p => p.revenue), 1000);

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <h1 className="admin-page-title">Executive Overview</h1>
            <span className="admin-badge admin-badge-success" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
              Live Database
            </span>
          </div>
          <p className="admin-page-subtitle">
            Welcome back, {adminUser?.name || 'Administrator'} ({adminUser?.roleTitle || 'Institute Staff'}). Real-time financial &amp; academic pulse.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'admin-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Pulse'}</span>
          </button>
          <Link to="/admin/reports" className="admin-btn admin-btn-primary">
            <Download size={15} />
            <span>Full Ledger</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ borderColor: 'var(--admin-danger-border)', backgroundColor: 'var(--admin-danger-bg)', marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--admin-danger-text)' }}>
            <AlertCircle size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>Analytics Load Notice</div>
              <div style={{ fontSize: '0.85rem' }}>{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Total Students */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Total Enrolled Scholars</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-blue-bg)', color: 'var(--admin-primary)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data?.totalStudents || 0}</div>
          <div className="admin-stat-footer">
            <span className="admin-stat-trend positive">
              <TrendingUp size={13} />
              +{data?.recentAdmissions || 0} this week
            </span>
            <span>across all cohorts</span>
          </div>
        </div>

        {/* Active Memberships */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Active Memberships</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-blue-bg)', color: 'var(--admin-blue-text)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data?.activeMemberships || 0}</div>
          <div className="admin-stat-footer">
            <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
              {data?.expiredMemberships || 0} expired
            </span>
            <span>eligible for renewal</span>
          </div>
        </div>

        {/* 30-Day Revenue */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">30-Day Verified Revenue</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-warning-bg)', color: 'var(--admin-warning-text)' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{formatINR(data?.revenue30Days)}</div>
          <div className="admin-stat-footer">
            <span className="admin-stat-trend positive">
              <Sparkles size={13} />
              Settled &amp; Reconciled
            </span>
            <span>via UPI &amp; NetBanking</span>
          </div>
        </div>

        {/* Pending Reconciliation */}
        <div className="admin-stat-card" style={{ borderColor: (data?.pendingOrders > 0) ? 'var(--admin-warning-border)' : 'var(--admin-border-subtle)' }}>
          <div className="admin-stat-header">
            <span className="admin-stat-title">Awaiting Reconciliation</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: 'var(--admin-warning-bg)', color: 'var(--admin-warning-text)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="admin-stat-value" style={{ color: (data?.pendingOrders > 0) ? 'var(--admin-warning-text)' : 'var(--admin-text-primary)' }}>
            {data?.pendingOrders || 0}
          </div>
          <div className="admin-stat-footer">
            <Link to="/admin/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--admin-primary)', fontWeight: 600, textDecoration: 'none' }}>
              View transaction ledger <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue Trend & Tiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Revenue & Admissions Trend Graph */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">30-Day Revenue &amp; Admissions Trend</div>
              <div className="admin-card-subtitle">Continuous daily receipts and verified student enrolments</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--admin-primary)' }} />
                <span>Revenue (₹)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--admin-accent)' }} />
                <span>New Admissions</span>
              </div>
            </div>
          </div>

          <div className="admin-card-body">
            {revenuePoints.length === 0 ? (
              <div className="admin-empty-state">
                <Receipt size={36} className="admin-empty-icon" />
                <div className="admin-empty-title">No transactions recorded yet</div>
                <div className="admin-empty-text">Transactions and student enrollments will populate this curve in real time.</div>
              </div>
            ) : (
              <div style={{ width: '100%', height: 220, position: 'relative' }}>
                {/* SVG Trend Chart */}
                <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {[0, 50, 100, 150, 200].map((y, i) => (
                    <line key={i} x1="0" y1={y} x2="600" y2={y} stroke="var(--admin-border-subtle)" strokeDasharray="3 3" opacity="0.6" />
                  ))}

                  {/* Admission Bars */}
                  {revenuePoints.map((pt, idx) => {
                    const x = (idx / (revenuePoints.length - 1 || 1)) * 580 + 10;
                    const barHeight = Math.min((pt.admissions || 0) * 15, 80);
                    return (
                      <rect
                        key={`bar-${idx}`}
                        x={x - 4}
                        y={190 - barHeight}
                        width="8"
                        height={barHeight}
                        rx="2"
                        fill="var(--admin-accent)"
                        opacity="0.85"
                      >
                        <title>{`${pt.date}: ${pt.admissions || 0} Admissions`}</title>
                      </rect>
                    );
                  })}

                  {/* Revenue Area */}
                  {(() => {
                    const coords = revenuePoints.map((pt, idx) => {
                      const x = (idx / (revenuePoints.length - 1 || 1)) * 580 + 10;
                      const y = 190 - ((pt.revenue || 0) / maxRevenue) * 160;
                      return `${x},${y}`;
                    });
                    const pathD = `M ${coords[0]} ` + coords.slice(1).map(c => `L ${c}`).join(' ');
                    const areaD = `${pathD} L 590,195 L 10,195 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#revenueGrad)" />
                        <path d={pathD} fill="none" stroke="var(--admin-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {revenuePoints.map((pt, idx) => {
                          const x = (idx / (revenuePoints.length - 1 || 1)) * 580 + 10;
                          const y = 190 - ((pt.revenue || 0) / maxRevenue) * 160;
                          return (
                            <circle
                              key={`pt-${idx}`}
                              cx={x}
                              cy={y}
                              r={idx === revenuePoints.length - 1 ? 5 : 3.5}
                              fill="var(--admin-primary)"
                              stroke="#ffffff"
                              strokeWidth="2"
                            >
                              <title>{`${pt.date}: ₹${(pt.revenue || 0).toLocaleString()} (${pt.admissions || 0} students)`}</title>
                            </circle>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                  <span>{revenuePoints[0]?.date || '30 days ago'}</span>
                  <span>Mid-Period</span>
                  <span>{revenuePoints[revenuePoints.length - 1]?.date || 'Today'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Membership Tier Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Membership Distribution</div>
              <div className="admin-card-subtitle">Active scholars by curricular track</div>
            </div>
          </div>

          <div className="admin-card-body" style={{ padding: '1.35rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(data?.tierBreakdown || []).map((tier, i) => (
              <div
                key={i}
                style={{
                  padding: '0.85rem 1.15rem',
                  backgroundColor: 'var(--admin-bg-base)',
                  borderRadius: 'var(--admin-radius-md)',
                  border: '1px solid var(--admin-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
                  <span style={{ fontWeight: 650, color: 'var(--admin-text-primary)' }}>{tier.name}</span>
                  <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 650, fontSize: '0.825rem' }}>
                    {tier.count} ({tier.share}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${tier.share}%`,
                      height: '100%',
                      backgroundColor: tier.color || 'var(--admin-primary)',
                      borderRadius: 99,
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '0.35rem', padding: '0.95rem 1.15rem', backgroundColor: 'var(--admin-bg-base)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--admin-primary)', marginBottom: '0.35rem' }}>
                <Shield size={14} />
                <span>Authoritative Access Engine</span>
              </div>
              <div style={{ color: 'var(--admin-text-secondary)', lineHeight: 1.45 }}>
                Platform gate checks server-side memberships on every route. No student bypasses authorization via client storage.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Required: Pending Orders Awaiting Reconciliation */}
      <div className="admin-card" style={{ marginBottom: '1.75rem' }}>
        <div className="admin-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="admin-card-title">Pending Payment Claims Queue</div>
              {data?.pendingList?.length > 0 && (
                <span className="admin-badge admin-badge-warning">{data.pendingList.length} Awaiting Verification</span>
              )}
            </div>
            <div className="admin-card-subtitle">
              Student orders and admissions awaiting payment verification or administrative settlement review.
            </div>
          </div>
          <Link to="/admin/reports" className="admin-btn admin-btn-secondary" style={{ fontSize: '0.8rem' }}>
            View Full Ledger
          </Link>
        </div>

        {(!data?.pendingList || data.pendingList.length === 0) ? (
          <div className="admin-empty-state" style={{ padding: '2rem 1rem' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--admin-success)', marginBottom: '0.5rem' }} />
            <div className="admin-empty-title">All payment claims reconciled!</div>
            <div className="admin-empty-text">No pending UPI or gateway orders awaiting administrative review at this time.</div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Student</th>
                  <th>Plan Selected</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Submitted At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingList.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
                        {order.order_id || order.id}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{order.student_name || 'Scholar'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{order.student_email}</div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-secondary">{order.plan_name || order.plan_id}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                      ₹{(order.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {order.payment_method || order.provider || 'Razorpay Gateway'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to="/admin/reports"
                        className="admin-btn admin-btn-sm admin-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        Ledger Record <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Admin Audit Logs */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <div className="admin-card-title">Security &amp; Administrative Audit Trail</div>
            <div className="admin-card-subtitle">Immutable log of manual enrollments, plan modifications, and payment reconciliations</div>
          </div>
        </div>

        {(!data?.recentAuditLogs || data.recentAuditLogs.length === 0) ? (
          <div className="admin-empty-state" style={{ padding: '1.5rem' }}>
            <div className="admin-empty-text">No administrative actions logged yet today.</div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Administrator</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAuditLogs.slice(0, 5).map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '0.775rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{log.admin_name || 'System Admin'}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--admin-text-muted)' }}>{log.admin_email}</div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-primary" style={{ fontSize: '0.7rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem', fontFamily: 'monospace' }}>
                      {log.entity_type}: {log.entity_id}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '—')}
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