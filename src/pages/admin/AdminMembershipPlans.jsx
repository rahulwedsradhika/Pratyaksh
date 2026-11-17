import {adminFetch as fetch} from '../../services/adminFetch';
import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Tag, 
  Clock, 
  Check, 
  Plus, 
  Edit, 
  History, 
  AlertCircle, 
  Shield, 
  Percent, 
  Calendar, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminMembershipPlans() {
  const { adminUser, hasPermission } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'coupons'
  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [couponBusy, setCouponBusy] = useState(null);

  // Modals
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    price: '',
    original_price: '',
    duration_months: '',
    is_active: 1,
    description: '',
    reason: 'Annual curriculum rate review'
  });

  const [priceHistoryModalOpen, setPriceHistoryModalOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [newCouponModalOpen, setNewCouponModalOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discount_type: 'fixed',
    discount_value: '500',
    min_order_amount: '1000',
    max_uses: '100',
    valid_until: ''
  });

  const token = localStorage.getItem('ayur_admin_token');

  // Fetch plans and coupons
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, couponsRes] = await Promise.all([
        fetch('/api/admin/plans', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/coupons', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const plansJson = await plansRes.json();
      const couponsJson = await couponsRes.json();

      if (plansJson.status && plansJson.data) {
        setPlans(plansJson.data);
      }
      if (couponsJson.status && couponsJson.data) {
        setCoupons(couponsJson.data);
      }
    } catch (err) {
      setError(err.message || 'Error loading membership data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open edit plan modal
  const openEditPlan = (plan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      price: plan.price || 0,
      original_price: plan.original_price || plan.price || 0,
      duration_months: plan.duration_months || 12,
      is_active: plan.is_active ? 1 : 0,
      description: plan.description || '',
      reason: 'Curriculum update and indexation'
    });
    setEditPlanModalOpen(true);
  };

  // Submit plan update
  const handlePlanUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planFormData)
      });
      const json = await res.json();
      if (json.status) {
        alert('Plan updated successfully! Price change logged to historical ledger.');
        setEditPlanModalOpen(false);
        loadData();
      } else {
        alert(json.error || json.message || 'Failed to update plan');
      }
    } catch (err) {
      alert('Error updating plan: ' + err.message);
    }
  };

  // View price history
  const openPriceHistory = async (plan) => {
    setSelectedPlan(plan);
    setPriceHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status && json.data) {
        setPriceHistory(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(couponFormData)
      });
      const json = await res.json();
      if (json.status) {
        alert(`Coupon ${couponFormData.code.toUpperCase()} successfully created!`);
        setNewCouponModalOpen(false);
        loadData();
      } else {
        alert(json.error || json.message || 'Failed to create coupon');
      }
    } catch (err) {
      alert('Error creating coupon: ' + err.message);
    }
  };

  async function changeCoupon(coupon, remove=false) {
    if(remove&&!window.confirm(`Delete coupon ${coupon.code}? It will stop working for future checkouts. Existing orders retain their original discount.`))return;
    setCouponBusy(coupon.id);setError(null);
    try {
      const response=await fetch(`/api/admin/coupons/${encodeURIComponent(coupon.id)}`,{method:remove?'DELETE':'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},...(remove?{}:{body:JSON.stringify({is_active:coupon.is_active?0:1})})});
      const data=await response.json();if(!response.ok||!data.status)throw Error(data.error||'Coupon could not be changed.');
      await loadData();
    }catch(error){setError(error.message);}finally{setCouponBusy(null);}
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Membership Plans &amp; Coupons</h1>
          <p className="admin-page-subtitle">
            Configure institutional pricing, validity windows, historical audits, and promotional scholarship vouchers.
          </p>
        </div>
        <div className="admin-header-actions">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary" 
            onClick={loadData}
          >
            <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
            <span>Refresh</span>
          </button>
          {activeTab === 'coupons' && hasPermission('plans:write') && (
            <button 
              type="button" 
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setCouponFormData({
                  code: '',
                  discount_type: 'fixed',
                  discount_value: '500',
                  min_order_amount: '1000',
                  max_uses: '100',
                  valid_until: ''
                });
                setNewCouponModalOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Add Coupon Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--admin-border)', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '0.625rem 1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'plans' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            color: activeTab === 'plans' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            fontWeight: activeTab === 'plans' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}
        >
          <Layers size={16} />
          <span>Institutional Plans ({plans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          style={{
            padding: '0.625rem 1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'coupons' ? '2px solid var(--admin-primary)' : '2px solid transparent',
            color: activeTab === 'coupons' ? 'var(--admin-primary)' : 'var(--admin-text-secondary)',
            fontWeight: activeTab === 'coupons' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}
        >
          <Tag size={16} />
          <span>Discount &amp; Scholarship Coupons ({coupons.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERSHIP PLANS */}
      {activeTab === 'plans' && (
        <div>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="admin-spin" style={{ width: 32, height: 32, border: '3px solid var(--admin-border)', borderTopColor: 'var(--admin-primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
              <div>Loading plan registry...</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {plans.map((p) => {
                const features = Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features || '[]') : []);
                return (
                  <div key={p.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', padding: '1.5rem', borderColor: p.is_popular ? 'var(--admin-accent)' : undefined }}>
                    {p.is_popular && (
                      <div style={{ position: 'absolute', top: -10, right: 16, backgroundColor: 'var(--admin-accent)', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        Most Popular
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span className="admin-badge admin-badge-primary" style={{ fontSize: '0.7rem' }}>
                          ID: {p.id}
                        </span>
                        <span className={`admin-badge ${p.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {p.is_active ? 'Active on Public Site' : 'Archived / Hidden'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-primary)', margin: '0.5rem 0 0.25rem' }}>
                        {p.title || p.name}
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--admin-text-secondary)', minHeight: 40, lineHeight: 1.4 }}>
                        {p.description || 'Comprehensive curriculum access with verified video modules.'}
                      </p>
                    </div>

                    {/* Price and Duration */}
                    <div style={{ padding: '1rem', backgroundColor: 'var(--admin-bg-base)', borderRadius: 'var(--admin-radius-sm)', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>
                          ₹{(p.price || 0).toLocaleString()}
                        </span>
                        {p.original_price && p.original_price > p.price && (
                          <span style={{ fontSize: '1rem', color: 'var(--admin-text-muted)', textDecoration: 'line-through' }}>
                            ₹{p.original_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: '0.25rem' }}>
                        Valid for <strong>{p.duration_months} Months</strong> from verification date
                      </div>
                    </div>

                    {/* Included Features */}
                    <div style={{ flexGrow: 1, marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-secondary)', marginBottom: '0.5rem' }}>
                        Included Curricular Access
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {features.map((feat, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-text-primary)' }}>
                            <Check size={14} style={{ color: 'var(--admin-primary)', flexShrink: 0 }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
                      <button 
                        type="button" 
                        className="admin-btn admin-btn-sm admin-btn-secondary" 
                        style={{ flex: 1 }}
                        onClick={() => openPriceHistory(p)}
                      >
                        <History size={13} />
                        <span>Price History</span>
                      </button>
                      {hasPermission('plans:write') && (
                        <button 
                          type="button" 
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          style={{ flex: 1 }}
                          onClick={() => openEditPlan(p)}
                        >
                          <Edit size={13} />
                          <span>Edit Rates</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COUPON CODES */}
      {activeTab === 'coupons' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Promotional &amp; Scholarship Vouchers</div>
              <div className="admin-card-subtitle">
                Discount vouchers applied at student checkout. Validated server-side against minimum cart values.
              </div>
            </div>
          </div>

          {coupons.length === 0 ? (
            <div className="admin-empty-state">
              <Tag size={36} className="admin-empty-icon" />
              <div className="admin-empty-title">No coupons registered yet</div>
              <div className="admin-empty-text">Create promo codes to distribute special admission discounts.</div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Discount Rate</th>
                    <th>Min. Cart Value</th>
                    <th>Redemptions</th>
                    <th>Validity Expiry</th>
                    <th>Status</th>
                    {hasPermission('plans:write')&&<th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <code style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.2rem 0.5rem', backgroundColor: 'var(--admin-bg-base)', borderRadius: 4, color: 'var(--admin-primary)', border: '1px dashed var(--admin-primary)' }}>
                          {c.code}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                      </td>
                      <td>
                        ₹{(c.min_order_amount || 0).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{c.times_used || 0}</span>
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}> / {c.usage_limit} max</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                        {c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : 'No Expiry'}
                      </td>
                      <td>
                        <span className={`admin-badge ${c.is_active ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                          {c.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      {hasPermission('plans:write')&&<td><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" disabled={couponBusy!==null} onClick={()=>changeCoupon(c)}>{c.is_active?<ToggleLeft size={15}/>:<ToggleRight size={15}/>} {c.is_active?'Deactivate':'Activate'}</button><button type="button" className="admin-btn admin-btn-danger admin-btn-sm" disabled={couponBusy!==null} onClick={()=>changeCoupon(c,true)}><Trash2 size={15}/>Delete</button></div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================================
          MODAL: EDIT PLAN RATES & DESCRIPTION
          ========================================================== */}
      {editPlanModalOpen && selectedPlan && (
        <div className="admin-modal-backdrop" onClick={() => setEditPlanModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Edit Plan: {selectedPlan.title || selectedPlan.name}</h3>
              <button type="button" className="admin-icon-btn" onClick={() => setEditPlanModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePlanUpdate}>
              <div className="admin-modal-body">
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--admin-bg-base)', borderRadius: 'var(--admin-radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                  <Shield size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2, color: 'var(--admin-primary)' }} />
                  <strong>Historical Preservation Rule:</strong> Modifying plan price updates future checkouts only. Existing student orders and purchase receipts preserve their exact historical purchase amount.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Effective Price (INR) *</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      required 
                      value={planFormData.price}
                      onChange={e => setPlanFormData({ ...planFormData, price: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Original / Scratch Price (INR)</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      value={planFormData.original_price}
                      onChange={e => setPlanFormData({ ...planFormData, original_price: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Duration (Months) *</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      required 
                      value={planFormData.duration_months}
                      onChange={e => setPlanFormData({ ...planFormData, duration_months: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Public Website Visibility</label>
                    <select 
                      className="admin-form-select"
                      value={planFormData.is_active}
                      onChange={e => setPlanFormData({ ...planFormData, is_active: parseInt(e.target.value, 10) })}
                    >
                      <option value="1">Active (Visible to Students)</option>
                      <option value="0">Archived / Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Audit Justification *</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    required 
                    placeholder="e.g. Session 2026-2027 curriculum enhancement"
                    value={planFormData.reason}
                    onChange={e => setPlanFormData({ ...planFormData, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditPlanModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Save Changes &amp; Log Price History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: VIEW PRICE HISTORY LOG
          ========================================================== */}
      {priceHistoryModalOpen && selectedPlan && (
        <div className="admin-modal-backdrop" onClick={() => setPriceHistoryModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} style={{ color: 'var(--admin-primary)' }} />
                <h3 className="admin-modal-title">Price Change Audit: {selectedPlan.title || selectedPlan.name}</h3>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setPriceHistoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading price audit records...</div>
              ) : priceHistory.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="admin-empty-title">Initial Baseline Price</div>
                  <div className="admin-empty-text">No subsequent price modifications recorded for this plan. Current price is ₹{(selectedPlan.price || 0).toLocaleString()}.</div>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>Old Price</th>
                        <th>New Price</th>
                        <th>Admin</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceHistory.map((h, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', whiteSpace: 'nowrap' }}>
                            {new Date(h.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ textDecoration: 'line-through', color: 'var(--admin-text-muted)' }}>
                            ₹{h.old_price?.toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                            ₹{h.new_price?.toLocaleString()}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{h.admin_email}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{h.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setPriceHistoryModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: ADD NEW COUPON
          ========================================================== */}
      {newCouponModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setNewCouponModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create Scholarship / Promo Coupon</h3>
              <button type="button" className="admin-icon-btn" onClick={() => setNewCouponModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Coupon Code (Uppercase) *</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                    required 
                    placeholder="e.g. AYUR2026 or BAMS1000"
                    value={couponFormData.code}
                    onChange={e => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Type *</label>
                    <select 
                      className="admin-form-select"
                      value={couponFormData.discount_type}
                      onChange={e => setCouponFormData({ ...couponFormData, discount_type: e.target.value })}
                    >
                      <option value="fixed">Fixed INR Amount (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Value *</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      required 
                      value={couponFormData.discount_value}
                      onChange={e => setCouponFormData({ ...couponFormData, discount_value: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Min. Cart Value (INR)</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      value={couponFormData.min_order_amount}
                      onChange={e => setCouponFormData({ ...couponFormData, min_order_amount: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Max Total Redemptions</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      value={couponFormData.max_uses}
                      onChange={e => setCouponFormData({ ...couponFormData, max_uses: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setNewCouponModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Register Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
