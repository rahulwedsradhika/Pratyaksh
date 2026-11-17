import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Shield, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  X, 
  ExternalLink,
  Sparkles,
  Filter,
  DollarSign,
  User,
  CreditCard
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminPaymentReconciliation() {
  const { adminUser, hasPermission } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Order for review modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Payment reference unconfirmed or order cancelled.');
  const [rejectingOrder, setRejectingOrder] = useState(null);

  const token = localStorage.getItem('ayur_admin_token');

  // Load reconciliation orders
  const loadReconciliationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersRes = await fetch('/api/admin/reconciliation/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersJson = await ordersRes.json();

      if (ordersJson.status && ordersJson.data) {
        const allOrders = ordersJson.data || [];
        setOrders(allOrders.filter(o => o.status === 'pending' || o.status === 'awaiting_verification'));
        setHistoryOrders(allOrders.filter(o => o.status === 'completed' || o.status === 'paid' || o.status === 'failed' || o.status === 'rejected'));
      } else {
        setError(ordersJson.error || 'Failed to fetch reconciliation orders');
      }
    } catch (err) {
      setError(err.message || 'Error fetching reconciliation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliationData();
  }, []);

  // Open inspection modal
  const openReconcileModal = (order) => {
    setSelectedOrder(order);
    setReconcileModalOpen(true);
  };

  // Perform Atomic Server-Side Approval
  const handleApprove = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/reconciliation/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrder.order_id || selectedOrder.id,
          adminNotes: `Reconciled and approved by ${adminUser?.full_name || 'Admin'}.`
        })
      });
      const json = await res.json();
      if (json.status) {
        alert('Order Approved & Student Membership Activated!');
        setReconcileModalOpen(false);
        loadReconciliationData();
      } else {
        alert(json.error || json.message || 'Failed to approve payment');
      }
    } catch (err) {
      alert('Error during approval: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (order) => {
    setRejectingOrder(order);
    setRejectModalOpen(true);
  };

  // Perform Rejection
  const handleReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectingOrder) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/reconciliation/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: rejectingOrder.order_id || rejectingOrder.id,
          reason: rejectReason
        })
      });
      const json = await res.json();
      if (json.status) {
        alert('Order marked rejected.');
        setRejectModalOpen(false);
        setReconcileModalOpen(false);
        loadReconciliationData();
      } else {
        alert(json.error || json.message || 'Failed to reject order');
      }
    } catch (err) {
      alert('Error during rejection: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Payment Reconciliation Center</h1>
          <p className="admin-page-subtitle">
            Audit student membership orders, review offline admissions, and verify settled payment gateway transactions.
          </p>
        </div>
        <div className="admin-page-actions">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={loadReconciliationData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
        >
          <Clock size={15} />
          <span>Pending &amp; Review Queue ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`admin-tab ${activeTab === 'history' ? 'active' : ''}`}
        >
          <CheckCircle2 size={15} />
          <span>Settled &amp; Verified Ledger ({historyOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING ORDERS QUEUE */}
      {activeTab === 'pending' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Pending Orders &amp; Manual Review Queue</div>
              <div className="admin-card-subtitle">
                Student admissions and payment transactions awaiting settlement verification or administrative approval.
              </div>
            </div>
            {orders.length > 0 && (
              <span className="admin-badge admin-badge-warning">{orders.length} In Review</span>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="admin-empty-state">
              <CheckCircle2 size={40} style={{ color: 'var(--admin-success)', margin: '0 auto 0.75rem' }} />
              <div className="admin-empty-title">Queue is Clean &amp; Reconciled</div>
              <div className="admin-empty-text">There are no pending student payment claims requiring review at this time. All gateway transactions are up to date.</div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Scholar Name &amp; Email</th>
                    <th>Plan</th>
                    <th>Amount (₹)</th>
                    <th>Gateway Method</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
                          {o.order_id || o.id}
                        </code>
                        {o.razorpay_order_id && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                            RZP: {o.razorpay_order_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{o.student_name || 'Ayurveda Scholar'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{o.student_email}</div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-info">
                          {o.plan_name || o.plan_id}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text-primary)' }}>
                          ₹{(o.amount || 0).toLocaleString('en-IN')}
                        </strong>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {o.payment_method || o.provider || 'Gateway'}
                        </span>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-warning">
                          {o.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => openReconcileModal(o)}
                          >
                            Review &amp; Approve
                          </button>
                          <button 
                            type="button" 
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => openRejectModal(o)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECONCILED HISTORY */}
      {activeTab === 'history' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Settled &amp; Reconciled Orders Ledger</div>
              <div className="admin-card-subtitle">Complete historical record of approved, settled, and rejected orders</div>
            </div>
          </div>

          {historyOrders.length === 0 ? (
            <div className="admin-empty-state">
              <Receipt size={36} className="admin-empty-icon" />
              <div className="admin-empty-title">No historical orders</div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Scholar</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Payment ID / Telemetry</th>
                    <th>Settlement Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {historyOrders.map((o) => (
                    <tr key={o.id}>
                      <td><code>{o.order_id || o.id}</code></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.student_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{o.student_email}</div>
                      </td>
                      <td>{o.plan_name || o.plan_id}</td>
                      <td><strong>₹{(o.amount || 0).toLocaleString('en-IN')}</strong></td>
                      <td>
                        {o.razorpay_payment_id || o.provider_payment_id ? (
                          <code style={{ fontSize: '0.75rem', background: 'var(--admin-bg-base)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                            {o.razorpay_payment_id || o.provider_payment_id}
                          </code>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge ${
                          o.status === 'completed' || o.status === 'paid' ? 'admin-badge-success' : 'admin-badge-danger'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================================
          MODAL: REVIEW & APPROVE ORDER
          ========================================================== */}
      {reconcileModalOpen && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setReconcileModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Review &amp; Approve Order</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                  Order Ref: <code>{selectedOrder.order_id || selectedOrder.id}</code>
                </p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setReconcileModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Scholar & Order Details */}
                <div style={{ padding: '1rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-secondary)', marginBottom: '0.75rem' }}>
                    Student &amp; Plan Details
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Student Name:</span>
                      <strong>{selectedOrder.student_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Email Address:</span>
                      <span>{selectedOrder.student_email}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Membership Plan:</span>
                      <span className="admin-badge admin-badge-info">{selectedOrder.plan_name || selectedOrder.plan_id}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Total Payable:</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)' }}>
                        ₹{(selectedOrder.amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Gateway & Payment Telemetry */}
                <div style={{ padding: '1rem', background: 'var(--admin-bg-base)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-secondary)', marginBottom: '0.75rem' }}>
                    Gateway Telemetry
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Payment Provider:</span>
                      <strong>Razorpay Gateway</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Razorpay Order ID:</span>
                      <code>{selectedOrder.razorpay_order_id || selectedOrder.provider_order_id || 'order_pending'}</code>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Order Status:</span>
                      <span className="admin-badge admin-badge-warning">{selectedOrder.status}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.72rem' }}>Created At:</span>
                      <span>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety notice */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--admin-blue-bg)', border: '1px solid var(--admin-blue-border)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--admin-blue-text)' }}>
                <Shield size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                Approving this order will execute an atomic server transaction: order status becomes <strong>completed</strong>, student membership activates immediately, and orientation classroom access is unlocked.
              </div>
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-btn admin-btn-danger" 
                onClick={() => {
                  setReconcileModalOpen(false);
                  openRejectModal(selectedOrder);
                }}
              >
                Reject Order
              </button>
              <button 
                type="button" 
                className="admin-btn admin-btn-secondary" 
                onClick={() => setReconcileModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="admin-btn admin-btn-primary" 
                disabled={processing}
                onClick={handleApprove}
              >
                <CheckCircle2 size={15} />
                <span>{processing ? 'Activating Access...' : 'Approve & Activate Access'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: REJECT ORDER
          ========================================================== */}
      {rejectModalOpen && rejectingOrder && (
        <div className="admin-modal-backdrop" onClick={() => setRejectModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: 'var(--admin-danger)' }}>
                Reject Payment Order
              </h3>
              <button type="button" className="admin-icon-btn" onClick={() => setRejectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReject}>
              <div className="admin-modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '1rem' }}>
                  Provide an official reason for rejecting Order <code>{rejectingOrder.order_id || rejectingOrder.id}</code>.
                </p>

                <div className="admin-form-group">
                  <label className="admin-label">Rejection Reason *</label>
                  <textarea 
                    className="admin-input" 
                    rows={3} 
                    required 
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-danger" disabled={processing}>
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
