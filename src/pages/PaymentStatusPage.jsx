import {validateRetryCoupon,createRetryCheckoutOrder} from '../services/paymentRetryCheckout';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Clock, Phone, RefreshCw, ShieldAlert, CreditCard, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentFetch } from '../services/studentFetch';
import { loadRazorpayCheckout } from '../services/razorpayCheckout';
import {readApiResponse} from '../services/apiResponse';
import '../styles/passwordRecovery.css';

export default function PaymentStatusPage() {
  const { user, loading, refreshStudentState, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState('');
  const [changePlan, setChangePlan] = useState(false);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const clearCoupon = () => {setCouponCode('');setCoupon(null);setCouponError('');};
  const applyCoupon = async () => {
    if (!planId || !couponCode.trim() || couponBusy || paying) return;
    setCouponBusy(true);setCouponError('');setCoupon(null);
    try {
      const validated=await validateRetryCoupon({planId,code:couponCode});
      setCoupon(validated);setCouponCode(validated.code);
    } catch(error) {setCouponError(error.message);}
    finally {setCouponBusy(false);}
  };
  const refresh = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const response = await studentFetch('/api/student/payment-status', { cache: 'no-store' });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.message || 'Unable to check payment status.');
      setData(result);
      if (result.hasActiveMembership || result.classroomAccess) { await refreshStudentState(); navigate('/app', { replace: true }); }
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }, [navigate, refreshStudentState]);
  useEffect(() => {
    if (!user) return undefined;
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [user, refresh]);
  useEffect(() => {
    let mounted = true;
    studentFetch('/api/membership/plans').then(r => r.json()).then(result => {
      if (mounted && result.status) setPlans(result.plans || result.data || []);
    }).catch(() => { if (mounted) setError('Unable to load membership plans. Please refresh.'); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    // Wait for the payment record before selecting a fallback. Plans often load
    // first; choosing then would silently replace the failed order's plan.
    if (!plans.length || !data) return;
    setPlanId(current => current || (plans.some(plan => plan.id === data?.order?.plan_id) ? data.order.plan_id : plans[0].id));
  }, [plans, data]);

  const retryPayment = async () => {
    if (paying || couponBusy || !planId) return;
    if (couponCode.trim() && !coupon) {setCouponError('Apply your coupon or remove it before continuing.');return;}
    setPaying(true); setError(''); setNotice('');
    try {
      await loadRazorpayCheckout();
      const orderData=await createRetryCheckoutOrder({planId,couponCode:coupon?.code});
      const checkout = new window.Razorpay({
        key: orderData.keyId, order_id: orderData.razorpayOrderId,
        amount: orderData.amountPaise, currency: orderData.currency,
        name: orderData.merchantName, description: orderData.planName,
        prefill: orderData.prefill, theme: { color: '#2441b4' },
        handler: async result => {
          try {
            const verified = await studentFetch('/api/payment/razorpay/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: orderData.orderId, razorpayOrderId: result.razorpay_order_id,
                razorpayPaymentId: result.razorpay_payment_id, razorpaySignature: result.razorpay_signature })
            });
            const confirmation = await readApiResponse(verified);
            if (!verified.ok || !confirmation.status) throw new Error(confirmation.message || 'Payment confirmation is pending. Refresh the status or contact support.');
            if(confirmation.sandbox)setNotice(confirmation.message);
            await refresh();
          } catch (e) { setError(e.message); }
          finally { setPaying(false); }
        },
        modal: { ondismiss: () => { setPaying(false); setNotice('Checkout closed. You can retry or choose another plan.'); refresh(); } }
      });
      checkout.on('payment.failed', result => {
        setPaying(false);
        setNotice(result.error?.description || 'Payment was not completed. You can retry or choose another plan.');
        refresh();
      });
      checkout.open();
    } catch (e) { setError(e.message); setPaying(false); }
  };
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Checking your account…</div>;
  if (!user) return <Navigate to="/login" replace />;
  const order = data?.order;
  const failed = ['failed', 'cancelled', 'refunded'].includes(order?.status);
  const completed = order?.status === 'completed';
  const title = order?.status==='sandbox_verified'?'Test payment verified':data?.suspended ? 'Account requires review' : failed ? 'Payment unsuccessful' : completed ? 'Membership requires review' : order ? 'Payment confirmation pending' : 'Membership payment required';
  return <main className="v3-public-root recovery-page editorial-auth-page">
    <section className="editorial-auth-container">
      <header className="editorial-auth-header"><Link to="/"><img src="/assets/website-assets/img/logo.svg" alt="Pratyaksh Ayurveda" style={{ height: 40 }} /></Link></header>
      <div className="editorial-auth-card">
        <div className="editorial-auth-card-title">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: failed ? '#c24136' : '#b77918' }}>{failed ? <ShieldAlert size={32} /> : <Clock size={32} />}</div>
          <h2>{title}</h2>
          <p className="editorial-auth-card-sub">Classroom access is available after your payment is confirmed and membership is active.</p>
        </div>
        {data?.gateway?.mode==='test' && <p role="status" style={{padding:12,border:'1px solid var(--border-subtle)',borderRadius:10,color:'var(--text-primary)'}}>Test mode · No real money is charged. Test payments do not activate live membership access. You can retry checkout.</p>}
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user.email}</p>
        {order && <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, marginBottom: 20, color: 'var(--text-primary)' }}>
          <div style={{ textTransform: 'capitalize', marginBottom: 8 }}><strong>Status:</strong> {order.status.replaceAll('_', ' ')}</div>
          <div style={{ fontSize: 13, overflowWrap: 'anywhere' }}>Order: {order.id}</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency || 'INR' }).format(order.amount)}</div>
        </div>}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{failed ? 'Your payment was not completed. Retry the payment or choose a different membership plan.' : order ? 'If money was debited, refresh the status before trying again. We will check your earlier payment before opening checkout.' : 'Choose a membership plan and complete your payment to activate classroom access.'}</p>
        {!data?.suspended && !completed && data && <section style={{ border: '1px solid var(--border-subtle)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontWeight: 650, color: 'var(--text-primary)', marginBottom: 10 }}>{plans.find(plan => plan.id === planId)?.name || 'Choose your membership'}</div>
          {changePlan && <label style={{ display: 'grid', gap: 8, marginBottom: 14, color: 'var(--text-primary)', fontSize: 14 }}>
            Membership plan
            <select value={planId} onChange={event => {setPlanId(event.target.value);clearCoupon();}} disabled={paying || couponBusy} className="editorial-input" style={{ width: '100%' }}>
              {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} — {new Intl.NumberFormat('en-IN', { style: 'currency', currency: plan.currency || 'INR', maximumFractionDigits: 0 }).format(plan.price)}</option>)}
            </select>
          </label>}
          {!changePlan && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{plans.find(plan => plan.id === planId) && new Intl.NumberFormat('en-IN', { style: 'currency', currency: plans.find(plan => plan.id === planId).currency || 'INR' }).format(plans.find(plan => plan.id === planId).price)}</p>}
          <div style={{marginBottom:16}}>
            <label htmlFor="retry-coupon" style={{display:'block',marginBottom:8,color:'var(--text-primary)'}}>Coupon code</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              <input id="retry-coupon" className="editorial-input" style={{flex:'1 1 180px',minWidth:0,width:'100%'}} value={couponCode} maxLength={40} autoCapitalize="characters" autoComplete="off" placeholder="Enter a coupon code" disabled={paying || couponBusy} onChange={event=>{setCouponCode(event.target.value);setCoupon(null);setCouponError('');}} />
              <button type="button" className="editorial-btn editorial-btn-secondary" style={{flex:'0 0 auto'}} onClick={applyCoupon} disabled={paying || couponBusy || !planId || !couponCode.trim()}>{couponBusy?'Checking…':'Apply coupon'}</button>
              {couponCode && <button type="button" className="editorial-btn editorial-btn-secondary" onClick={clearCoupon} disabled={paying || couponBusy}>Remove</button>}
            </div>
            {couponError && <p role="alert" style={{color:'#c24136',margin:'8px 0'}}>{couponError}</p>}
            {coupon && <div role="status" style={{marginTop:12,color:'var(--text-primary)'}}>
              <p style={{margin:'0 0 6px'}}>Coupon {coupon.code} applied · Save {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(coupon.discountAmount)}</p>
              <strong>Payable: {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(coupon.finalAmount)}</strong>
            </div>}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <button className="editorial-btn" onClick={retryPayment} disabled={paying || busy || couponBusy || !planId}><CreditCard size={16} />{paying ? 'Payment in progress…' : order ? 'Retry payment' : 'Pay for membership'}</button>
            <button className="editorial-btn" onClick={() => setChangePlan(value => !value)} disabled={paying || couponBusy || !plans.length} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}><Layers size={16} />{changePlan ? 'Keep selected plan' : 'Choose a different plan'}</button>
          </div>
        </section>}
        {notice && <p role="status" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{notice}</p>}
        {error && <p role="alert" style={{ color: '#c24136' }}>{error}</p>}
        <div style={{ display: 'grid', gap: 12 }}>
          <button className="editorial-btn" onClick={refresh} disabled={busy}><RefreshCw size={16} />{busy ? 'Checking…' : 'Refresh payment status'}</button>
          {(data?.helplines || [{ phone: '+918795776006', display: '+91 8795776006' }]).map(line => <a key={line.phone} className="editorial-btn" href={`tel:${line.phone}`} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}><Phone size={16} /> Helpline: {line.display}</a>)}
          <a href="https://wa.me/918795776006" target="_blank" rel="noopener noreferrer" className="editorial-auth-link" style={{ textAlign: 'center' }}>Contact support on WhatsApp</a>
        </div>
        <div className="editorial-auth-footer"><button onClick={async () => { await logout(); navigate('/login', { replace: true }); }} style={{ border: 0, background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Sign out</button></div>
      </div>
    </section>
  </main>;
}
