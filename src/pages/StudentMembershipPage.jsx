import MembershipCheckout from '../components/MembershipCheckout';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CalendarDays, Clock3, ArrowUpRight, Check, RefreshCw, Receipt, Lock, BookOpen } from 'lucide-react';
import StudentAppShell from '../components/shell/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import { useAuth } from '../context/AuthContext';
import { studentFetch } from '../services/studentFetch';
import { loadRazorpayCheckout } from '../services/razorpayCheckout';
import '../styles/studentMembership.css';

const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('en-IN', {day:'numeric', month:'long', year:'numeric'}) : '—';
const money = (value,currency='INR') => new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:0}).format(Number(value)||0);
const labels={active:'Membership active',expired:'Membership expired',administrator:'Classroom administrator',suspended:'Account on hold',unverified:'Verify your account',no_membership:'No membership yet'};

export default function StudentMembershipPage() {
  const { user, refreshStudentState } = useAuth();
  const owner = user?.id || user?._id;
  const [overview,setOverview]=useState(null);
  const [plans,setPlans]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(null);
  const [retry,setRetry]=useState(0);
  const paymentLock=useRef(false);
  const [reviewPlan,setReviewPlan]=useState(null),[couponCode,setCouponCode]=useState(''),[coupon,setCoupon]=useState(null),[couponError,setCouponError]=useState(''),[couponBusy,setCouponBusy]=useState(false);
  async function applyCoupon(){if(!reviewPlan)return;setCouponBusy(true);setCouponError('');try{const data=await json('/api/coupons/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planId:reviewPlan.id,code:couponCode})});setCoupon(data.coupon);}catch(error){setCoupon(null);setCouponError(error.message);}finally{setCouponBusy(false)}}
  async function json(path,options={}) {
    const response=await studentFetch(path,{cache:'no-store',...options});
    const body=await response.json();
    if(!response.ok || !body.status) throw new Error(body.message || 'Could not load membership information. Please retry.');
    return body;
  }
  async function load() {
    const body=await json('/api/membership/overview');
    setOverview(body.data);
    if(body.data.canRenew){const catalog=await json('/api/membership/plans');setPlans(catalog.data)}else setPlans([]);
  }
  useEffect(()=>{
    let active=true;setLoading(true);setError('');setOverview(null);setPlans([]);
    (async()=>{try{
      const body=await json('/api/membership/overview');
      if(!active)return;
      setOverview(body.data);
      if(body.data.canRenew){const catalog=await json('/api/membership/plans');if(active)setPlans(catalog.data)}
    }catch(error){if(active)setError(error.message)}finally{if(active)setLoading(false)}})();
    return()=>{active=false};
  },[owner,retry]);
  async function renew(plan) {
    if(paymentLock.current || !overview?.canRenew)return;
    paymentLock.current=true;setBusy(plan.id);setError('');setNotice('');
    let checkoutOpened=false;
    try {
      const fresh=await json('/api/membership/overview');
      setOverview(fresh.data);
      if(!fresh.data.canRenew)throw new Error('Renewal is available only after your membership expires.');
      if(!fresh.data.gateway.enabled)throw new Error('Online payments are unavailable right now. Please contact support.');
      await loadRazorpayCheckout();
      const order=await json('/api/payment/razorpay/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planId:plan.id,couponCode:coupon?.code})});
      if(!order.razorpayOrderId || !order.keyId || !Number.isInteger(order.amountPaise))throw new Error('Checkout could not be initialized. Please refresh your membership status.');
      const release=()=>{paymentLock.current=false;setBusy(null)};
      let verifying=false;
      const checkout=new window.Razorpay({key:order.keyId,order_id:order.razorpayOrderId,amount:order.amountPaise,currency:order.currency,name:order.merchantName,image:order.logoUrl,description:order.planName,prefill:order.prefill,theme:{color:'#b9432c'},
        handler:async result=>{
          verifying=true;setNotice('Confirming your payment. Please wait…');
          try {
            const confirmation=await json('/api/payment/razorpay/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:order.orderId,razorpayOrderId:result.razorpay_order_id,razorpayPaymentId:result.razorpay_payment_id,razorpaySignature:result.razorpay_signature})});
            await refreshStudentState();await load();setReviewPlan(null);setNotice(confirmation.sandbox?confirmation.message:'Payment verified. Your membership is active.');
          }catch(error){setNotice('');setError(`${error.message} If money was deducted, refresh your membership status or contact support before paying again.`)}finally{release()}
        },modal:{ondismiss:()=>{if(!verifying){release();setNotice('Checkout closed. Refresh your status if you completed a payment.')}}}
      });
      checkout.on('payment.failed',event=>{setError(event.error?.description || 'Payment failed. Please check your payment status.');release()});
      checkout.open();checkoutOpened=true;
    }catch(error){setError(error.message)}finally{if(!checkoutOpened){paymentLock.current=false;setBusy(null)}}
  }
  const membership=overview?.membership;
  return <StudentAppShell><PageContainer maxWidth="1080px"><div className="membership-page">
    <header className="membership-heading"><span className="editorial-badge editorial-badge-terracotta"><ShieldCheck size={14}/> YOUR LEARNING MEMBERSHIP</span><h1>More clarity. More learning<span>.</span></h1><p>Your access, membership dates and payments in one place.</p></header>
    {error && <div role="alert" className="membership-alert">{error}<button type="button" disabled={Boolean(busy)} onClick={()=>setRetry(n=>n+1)}>Refresh status</button></div>}
    {notice && <p role="status" className="membership-alert membership-notice">{notice}</p>}
    {loading ? <p role="status" className="p-4">Loading your membership…</p> : overview && <>
      <section className={`membership-pass ${overview.state==='active'?'is-active':''}`}>
        <div className="membership-pass-top"><span className="membership-state"><span/>{labels[overview.state]}</span><ShieldCheck size={30} strokeWidth={1.3}/></div>
        <div className="membership-pass-main"><div><span className="membership-eyebrow">PRATYAKSH AYURVEDA</span><h2>{overview.state==='administrator'?'Administrator access':membership?.name || 'Your learning account'}</h2><p>{overview.state==='active'?'Your classroom access is ready. Keep your learning momentum going.':overview.state==='expired'?'Renew your membership to return to your lectures, notes and tests.':overview.state==='administrator'?'Your account has classroom access through its administrator role.':'View your account and contact admissions for help with your access.'}</p></div>{overview.state==='active' && <div className="membership-days"><strong>{membership?.daysRemaining ?? '—'}</strong><span>days remaining</span></div>}</div>
        {membership && <div className="membership-dates"><div><CalendarDays size={16}/><span>Started<strong>{date(membership.startDate)}</strong></span></div><div><Clock3 size={16}/><span>{overview.state==='expired'?'Expired on':'Valid until'}<strong>{date(membership.expiryDate)}</strong></span></div><div><Lock size={16}/><span>Renewal<strong>{overview.state==='active'?'Available after expiry':overview.canRenew?'Available now':'Unavailable'}</strong></span></div></div>}
      </section>
      {overview.state==='active' && <div className="membership-access-note"><Check size={18}/><p>Your membership is active. Renewal and payment options will appear after it expires.</p><Link to="/courses">Continue learning <ArrowUpRight size={15}/></Link></div>}
      <section className="membership-benefits"><h2>Your learning essentials</h2><div>{['Recorded lectures & chapter notes','Test series & answer reviews','Saved questions & study tasks','Personal learning & test history'].map(text=><span key={text}><Check size={15}/>{text}</span>)}</div></section>
      {overview.canRenew && <section className="membership-renew"><div className="membership-section-heading"><div><span className="membership-eyebrow">READY WHEN YOU ARE</span><h2>Choose your next study chapter</h2><p>Renew with a duration that fits your preparation.</p></div><span className="membership-secure"><Lock size={13}/> Razorpay checkout</span></div>
        {overview.gateway.mode==='test' && <p className="membership-alert">Payment gateway is in test mode. This is a sandbox checkout.</p>}
        {!overview.gateway.enabled && <p className="membership-alert">Online payments are currently unavailable. Contact support for assistance.</p>}
        <div className="membership-plans">{plans.map(plan=><article className="editorial-card membership-plan" key={plan.id}><span className="membership-eyebrow">{plan.durationMonths} {plan.durationMonths===1?'MONTH':'MONTHS'}</span><h3>{plan.name}</h3><strong className="membership-price">{money(plan.price,plan.currency)}</strong><p>{plan.description}</p><button type="button" className="editorial-btn editorial-btn-primary" disabled={Boolean(busy)||!overview.gateway.enabled} onClick={()=>{setReviewPlan(plan);setCoupon(null);setCouponCode('');setError('');}}>{busy===plan.id?'Processing…':'Review renewal'} <ArrowUpRight size={15}/></button></article>)}</div>
      </section>}
      <section className="editorial-card membership-payments"><div className="membership-section-heading"><div><h2><Receipt size={18}/> Payment history</h2><p>Orders and payment statuses from your account.</p></div><button type="button" className="editorial-btn editorial-btn-secondary" disabled={Boolean(busy)} onClick={()=>setRetry(n=>n+1)}><RefreshCw size={14}/>Refresh</button></div>
        {!overview.history.length ? <p className="text-center py-4 mb-0">No payment orders yet.</p> : <div className="table-responsive"><table><thead><tr><th>Membership</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{overview.history.map(order=><tr key={order.id}><td><strong>{order.planName || 'Membership order'}</strong><small>{order.id}</small>{order.paymentId && <small>Payment: {order.paymentId}</small>}</td><td>{date(order.createdAt)}</td><td>{money(order.amount,order.currency)}</td><td><span className={`membership-order-status status-${order.status}`}>{order.status.replaceAll('_',' ')}</span></td></tr>)}</tbody></table></div>}
      </section>
      <footer className="membership-support"><BookOpen size={18}/><div><strong>Need help with your membership?</strong><p>Contact admissions about access or a payment awaiting confirmation.</p></div><a href="tel:+918795776006">+91 8795776006</a></footer>
    </>}
    {reviewPlan&&<div className="membership-checkout-backdrop" role="dialog" aria-modal="true" aria-label="Renew membership"><div className="membership-checkout-dialog"><MembershipCheckout plan={reviewPlan} coupon={coupon} code={couponCode} setCode={value=>{setCouponCode(value);setCoupon(null);}} onApply={applyCoupon} couponError={couponError} couponBusy={couponBusy} onPay={()=>renew(reviewPlan)} onBack={()=>{if(!busy)setReviewPlan(null);}} busy={Boolean(busy)} error={error}/></div></div>}
  </div></PageContainer></StudentAppShell>;
}
