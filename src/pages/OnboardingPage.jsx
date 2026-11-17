import MembershipCheckout from '../components/MembershipCheckout';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Phone, 
  User, 
  BookOpen, 
  CreditCard, 
  CheckCircle2, 
  RefreshCw,
  Sun,
  Moon,
  QrCode,
  Copy,
  ExternalLink,
  AlertCircle,
  Tag,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_MEMBERSHIP_PLANS } from '../constants/membershipPlans';
import '../styles/editorialHomepage.css';

export default function OnboardingPage() {
  const { 
    user, 
    membership,
    selectedPlan, 
    setSelectedPlan, 
    sendEmailOtp, 
    verifyEmailOtp, 
    loginWithGoogle, 
    initializeCheckout, 
    verifyPayment, 
    refreshStudentState 
  } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Steps: 1: Plan, 2: Details, 3: Verify, 4: Payment
  const [step, setStep] = useState(() => {
    const s = parseInt(searchParams.get('step'), 10);
    return (s >= 1 && s <= 4) ? s : 1;
  });
  const [plans, setPlans] = useState(DEFAULT_MEMBERSHIP_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [examGoal, setExamGoal] = useState('AIAPGET & BAMS Complete');
  const [googleConfig, setGoogleConfig] = useState({ enabled: false, clientId: null });
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleLoginRef = useRef(loginWithGoogle);
  const profileRef = useRef({});
  googleLoginRef.current = loginWithGoogle;

  // OTP State
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [existingAccount, setExistingAccount] = useState(null);
  const [otpPurpose, setOtpPurpose] = useState('registration');

  useEffect(() => {
    fetch('/api/public/auth/providers')
      .then(response => response.json())
      .then(data => {
        if (data?.status && data?.providers?.google) setGoogleConfig(data.providers.google);
      })
      .catch(() => setOtpError('Google sign-in settings could not be loaded.'));
  }, []);

  useEffect(() => {
    if (!googleConfig.enabled || !googleConfig.clientId) return;
    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setGisLoaded(true), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    script.onerror = () => setOtpError('Google sign-in could not load. Please try email verification.');
    document.head.appendChild(script);
  }, [googleConfig]);

  useEffect(() => {
    if (step !== 3 || !gisLoaded || !googleConfig.enabled || !googleConfig.clientId || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: googleConfig.clientId,
        callback: async response => {
          if (!response?.credential) {
            setOtpError('Google did not return an identity credential. Please try again.');
            return;
          }
          setOtpLoading(true);
          setOtpError('');
          const result = await googleLoginRef.current(response.credential, profileRef.current);
          setOtpLoading(false);
          if (result.success && (result.data?.hasActiveMembership || result.data?.classroomAccess)) navigate('/app', { replace: true });
          else if (result.success && !result.data?.isNewUser && !result.data?.hasActiveMembership) navigate('/payment-status', { replace: true });
          else if (result.success) setStep(4);
          else setOtpError(result.error || 'Google authentication failed.');
        },
        auto_select: false
      });
      const slot = document.getElementById('onboarding-google-signin-slot');
      if (slot) {
        slot.innerHTML = '';
        const buttonWidth = Math.min(376, Math.max(180, slot.clientWidth || 376));
        window.google.accounts.id.renderButton(slot, {
          theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: buttonWidth
        });
      }
    } catch (error) {
      setOtpError('Google sign-in could not be initialized. Please try email verification.');
      console.error('[GoogleGIS] Onboarding initialization error:', error);
    }
  }, [gisLoaded, googleConfig, resolvedTheme, step]);

  // Payment State
  const [pendingOrder, setPendingOrder] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError,setPaymentError]=useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Ensure initial plan selection from query param or default 12M
  useEffect(() => {
    const queryPlan = searchParams.get('plan');
    if (queryPlan) {
      const matched = plans.find(p => 
        p.duration.toLowerCase() === queryPlan.toLowerCase() || 
        p.id.toLowerCase() === queryPlan.toLowerCase() ||
        p.tierCode?.toLowerCase() === queryPlan.toLowerCase()
      );
      if (matched) {
        setSelectedPlan(matched);
        return;
      }
    }
    if (!selectedPlan && plans.length > 0) {
      setSelectedPlan(plans[3] || plans[0]);
    }
  }, [searchParams, plans, selectedPlan, setSelectedPlan]);

  // 1. Fetch official plans from backend and merge
  useEffect(() => {
    fetch('/api/membership/plans')
      .then(r => r.json())
      .then(d => {
        if (d?.status && Array.isArray(d.data) && d.data.length > 0) {
          setPlans(d.data);
          const queryPlan = searchParams.get('plan');
          const matched = d.data.find(p => 
            p.duration.toLowerCase() === (queryPlan || '').toLowerCase() || 
            p.id.toLowerCase() === (queryPlan || '').toLowerCase() ||
            p.tierCode?.toLowerCase() === (queryPlan || '').toLowerCase()
          );
          if (matched) {
            setSelectedPlan(matched);
          } else if (!selectedPlan) {
            setSelectedPlan(d.data[3] || d.data[0]);
          }
        }
      })
      .catch(err => {
        console.warn('Could not sync live plans from API, using default plans:', err);
      });
  }, []);

  // Pre-fill user data if user already logged in
  const hasActiveMembership = Boolean(user?.classroomAccess) || membership?.status === 'active' && new Date(membership.expiry_date || membership.expiryDate) > new Date();
  useEffect(() => {
    if (user && hasActiveMembership) navigate('/app', { replace: true });
  }, [user, hasActiveMembership, navigate]);
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.examGoal) setExamGoal(user.examGoal);
      // If user already verified, advance to payment review
      if (user.emailVerified && otpPurpose !== 'login' && !existingAccount) {
        setStep(4);
      }
    }
  }, [user]);

  // Handle URL step parameter
  useEffect(() => {
    const urlStep = searchParams.get('step');
    if (urlStep === 'details') setStep(2);
    if (urlStep === 'verify') setStep(3);
    if (urlStep === 'payment') setStep(4);
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Handle OTP Dispatch
  const sendOnboardingOtp = async (purpose) => {
    const profileError = purpose === 'registration' ? validateProfile() : '';
    if (profileError) {
      setOtpError(profileError);
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await sendEmailOtp(email.trim(), purpose);
      if (res.success) {
        setOtpPurpose(purpose);
        setOtpSent(true);
        setResendCooldown(45);
      } else {
        if (['ACTIVE_MEMBERSHIP_EXISTS', 'PAYMENT_STATUS_ONLY'].includes(res.code)) {
          setExistingAccount({ code: res.code, message: res.error });
          setOtpPurpose('login');
        } else setOtpError(res.error || 'Failed to send the verification email.');
      }
    } catch (error) {
      setOtpError(error.message || 'Could not reach the authentication service. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };
  const handleSendOtp = () => sendOnboardingOtp(otpPurpose);

  // Handle OTP Input Change (Auto-advance focus)
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Paste support
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpCode];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtpCode(newOtp);
      const nextFocus = Math.min(5, index + digits.length);
      const el = document.getElementById(`otp-input-${nextFocus}`);
      if (el) el.focus();
      return;
    }

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      const el = document.getElementById(`otp-input-${index + 1}`);
      if (el) el.focus();
    }
  };

  // Handle OTP Backspace Key
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const el = document.getElementById(`otp-input-${index - 1}`);
      if (el) el.focus();
    }
  };

  // Handle OTP Verification Submission
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await verifyEmailOtp(email, code, otpPurpose === 'login' ? { purpose: 'login' } : {
        full_name: fullName.trim(),
        phone: phone.trim(),
        exam_goal: examGoal,
        plan_id: selectedPlan?.id
      });
      if (res.success) {
        if (otpPurpose === 'login') {
          const active = ['active_membership', 'membership_nearing_expiry', 'admin_classroom'].includes(res.data?.studentState);
          navigate(active ? '/app' : '/payment-status', { replace: true });
        } else setStep(4);
      } else {
        setOtpError(res.error || 'Invalid verification code');
      }
    } catch (error) {
      setOtpError(error.message || 'Could not reach the authentication service. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const validateProfile = () => {
    if (fullName.trim().length < 2) return 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
    const mobile = phone.replace(/[\s()-]/g, '').replace(/^\+?91/, '');
    if (!/^[6-9][0-9]{9}$/.test(mobile)) return 'Enter a valid 10-digit Indian mobile number.';
    return '';
  };

  const handleDetailsSubmit = (event) => {
    event.preventDefault();
    const profileError = validateProfile();
    if (profileError) {
      setOtpError(profileError);
      return;
    }
    profileRef.current = { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() };
    setExistingAccount(null);
    setOtpPurpose('registration');
    setOtpSent(false);
    setOtpCode(['', '', '', '', '', '']);
    setOtpError('');
    setStep(3);
  };

  // Handle Order Initialization & Payment Review
  useEffect(() => {
    if (step === 4 && selectedPlan && !pendingOrder && !hasActiveMembership) {
      const token = localStorage.getItem('ayur_auth_token');
      fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod,
          couponCode: appliedCoupon?.code || undefined
        })
      })
        .then(r => r.json())
        .then(data => {
          if (data.status && data.order) {
            setPendingOrder(data.order);
          } else if (data.code === 'ACTIVE_MEMBERSHIP_EXISTS') {
            navigate('/app', { replace: true });
          }
        })
        .catch(console.error);
    }
  }, [step, selectedPlan, pendingOrder, paymentMethod, appliedCoupon, hasActiveMembership, navigate]);

  // Handle Coupon Application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          planId: selectedPlan?.id,
          orderAmount: selectedPlan?.price || 14999
        })
      });
      const data = await res.json();
      if (data.status && data.coupon) {
        setAppliedCoupon(data.coupon);
        // Refresh checkout order with discounted rate
        const token = localStorage.getItem('ayur_auth_token');
        const cRes = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planId: selectedPlan.id,
            couponCode: data.coupon.code,
            paymentMethod
          })
        });
        const cJson = await cRes.json();
        if (cJson.status && cJson.order) {
          setPendingOrder(cJson.order);
        }
      } else {
        setCouponError(data.error || 'Invalid or expired coupon code');
      }
    } catch (err) {
      setCouponError(err.message || 'Error checking coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Dynamic Razorpay SDK Loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Launch Official Razorpay Checkout Modal
  const handleRazorpayPayment = async () => {
    setPaymentError('');setPaymentProcessing(true);
    try {
      const token = localStorage.getItem('ayur_auth_token');
      // 1. Create order on backend
      const res = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan?.id || 'plan_12m',
          couponCode: appliedCoupon?.code || couponCode.trim() || undefined
        })
      });
      const orderData = await res.json();
      if (!orderData.status) {
        alert(orderData.message || orderData.error || 'Failed to initialize payment');
        setPaymentProcessing(false);
        return;
      }

      setPendingOrder(orderData);

      // 2. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Razorpay checkout could not load. Check your connection and try again.');

      // 3. Configure Razorpay Standard Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: orderData.merchantName,
        description: `${orderData.planName} (${orderData.durationMonths} Months)`,
        image: orderData.logoUrl,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user?.name || orderData.prefill?.name || '',
          email: user?.email || orderData.prefill?.email || '',
          contact: orderData.prefill?.contact || ''
        },
        theme: {
          color: orderData.themeColor || '#1E40AF'
        },
        handler: async function (response) {
          try {
            const vRes = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: orderData.orderId,
                razorpayOrderId: response.razorpay_order_id || orderData.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });
            const vData = await vRes.json();
            if (vData.status) {
              setPaymentSuccess(true);
              await refreshStudentState();
              setTimeout(() => {
                navigate('/app');
              }, 1200);
            } else {
              alert(vData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('Verification error: ' + err.message);
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        alert('Payment failed: ' + (response.error?.description || 'Transaction declined'));
        setPaymentProcessing(false);
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setPaymentError(err.message);
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="v3-public-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <img
            src="/assets/website-assets/img/logo.svg"
            alt="Pratyaksh Ayurveda"
            style={{ height: '30px' }}
            onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/logo-dark-text.png'; }}
          />
        </Link>

        {/* 4-Step Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="d-none d-md-flex">
          {[
            { num: 1, label: 'Choose Plan' },
            { num: 2, label: 'Your Details' },
            { num: 3, label: 'Verification' },
            { num: 4, label: 'Payment' }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === s.num ? 700 : 500 }}>
                <span style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: step > s.num ? '#2D7A4D' : (step === s.num ? 'var(--button-primary-bg)' : 'var(--bg-subtle)'),
                  color: step >= s.num ? '#FFFFFF' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem'
                }}>
                  {step > s.num ? <Check size={12} /> : s.num}
                </span>
                <span>{s.label}</span>
              </div>
              {idx < 3 && <div style={{ width: '16px', height: '1px', background: 'var(--border-subtle)' }} />}
            </React.Fragment>
          ))}
        </div>

        <button type="button" onClick={toggleTheme} className="v3-theme-btn" aria-label="Toggle theme">
          {resolvedTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
        <div className={step===4?'onboarding-checkout-shell':undefined} style={{ maxWidth: step === 4 ? '1080px' : step === 1 ? '980px' : '520px', width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: '0 16px 44px rgba(33, 31, 28, 0.06)' }}>

          {/* Complete Logo for Membership Funnel */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }} title="Return to Homepage">
              <img
                src="/assets/website-assets/img/logo.svg"
                alt="Pratyaksh Ayurveda"
                style={{ height: '38px', width: 'auto', maxWidth: '260px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/logo-dark-text.png'; }}
              />
            </Link>
          </div>

          {/* ==========================================================
              STEP 1: CHOOSE MEMBERSHIP PLAN
              ========================================================== */}
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span className="v3-editorial-badge">Step 1 of 4</span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Select Your Membership Duration
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  All durations provide identical access to the complete video lecture archive, question bank, and notes.
                </p>
              </div>

              {loadingPlans && plans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 1rem' }} />
                  <div>Loading verified membership plans...</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                  {plans.map(p => {
                    const isSelected = selectedPlan?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        id={`plan-card-${p.id}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPlan(p)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlan(p); }}
                        style={{
                          background: isSelected ? 'var(--bg-card)' : 'var(--bg-surface)',
                          border: isSelected ? '2px solid var(--brand-terracotta)' : '1px solid var(--border-subtle)',
                          borderRadius: '14px',
                          padding: '1.4rem 1.2rem',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: isSelected ? '0 6px 20px rgba(169, 68, 47, 0.12)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name="planId"
                          value={p.id}
                          checked={isSelected}
                          onChange={() => setSelectedPlan(p)}
                          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                          tabIndex={-1}
                          aria-label={`${p.duration} membership plan`}
                        />
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '-10px', right: '12px', background: 'var(--brand-terracotta)', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>
                            SELECTED
                          </div>
                        )}
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                          {p.duration}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-terracotta)', marginBottom: '0.85rem' }}>
                          ₹{p.price.toLocaleString('en-IN')}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {p.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.86rem' }}>
                  <ArrowLeft size={15} />
                  <span>Return to Homepage</span>
                </Link>

                <button
                  id="continue-details-button"
                  type="button"
                  onClick={() => setStep(2)}
                  className="v3-btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  <span>Continue to Details</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ==========================================================
              STEP 2: BASIC STUDENT DETAILS
              ========================================================== */}
          {step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <span className="v3-editorial-badge">Step 2 of 4</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Student Learning Profile
                </h1>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Selected: <strong>{selectedPlan?.duration} Membership</strong> (₹{selectedPlan?.price?.toLocaleString('en-IN')})
                </p>
              </div>

              <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="student-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. / Vaidya / Student Name"
                      style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="student-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar@example.com"
                      style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    WhatsApp Mobile Number (+91)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="student-phone"
                      type="tel"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Academic Focus
                  </label>
                  <div style={{ position: 'relative' }}>
                    <BookOpen size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select
                      value={examGoal}
                      onChange={(e) => setExamGoal(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                    >
                      <option value="AIAPGET & BAMS Complete">AIAPGET & BAMS Complete Curriculum</option>
                      <option value="AIAPGET Competitive Sprint">AIAPGET Competitive Entrance Sprint</option>
                      <option value="BAMS University Professional">BAMS University Professional Exams</option>
                      <option value="Ayurveda Medical Officer (AMO)">Ayurveda Medical Officer (AMO / UPSC)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button type="button" onClick={() => setStep(1)} className="v3-btn-secondary">
                    <ArrowLeft size={14} />
                    <span>Change Plan</span>
                  </button>

                  <button id="proceed-verification-button" type="submit" className="v3-btn-primary">
                    <span>Continue to Verification</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==========================================================
              STEP 3: ACCOUNT VERIFICATION METHOD (GOOGLE OR OTP)
              ========================================================== */}
          {step === 3 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <span className="v3-editorial-badge">Step 3 of 4</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Verify Your Student Account
                </h1>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Authenticate to bind your membership records securely to <strong>{email}</strong>
                </p>
              </div>

              {otpError && (
                <div style={{ background: '#FAEBEA', border: '1px solid #F3C2BF', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.84rem', color: '#C24136', marginBottom: '1.25rem' }}>
                  {otpError}
                </div>
              )}

              {existingAccount && <div role="status" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, margin: '0 0 8px', color: 'var(--text-primary)' }}>{existingAccount.code === 'ACTIVE_MEMBERSHIP_EXISTS' ? 'You have already purchased a membership' : 'Continue your existing enrollment'}</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>{existingAccount.code === 'ACTIVE_MEMBERSHIP_EXISTS' ? 'Sign in to access your existing membership. A second purchase is not allowed while it is active.' : 'Sign in here to view your payment status, retry payment, or choose another plan.'}</p>
                {!otpSent && <button type="button" className="v3-btn-primary" disabled={otpLoading} onClick={() => sendOnboardingOtp('login')} style={{ width: '100%', whiteSpace: 'normal', height: 'auto', minHeight: 46, padding: 12 }}>{otpLoading ? 'Sending sign-in code…' : 'Sign in with an email code'}<ArrowRight size={16} /></button>}
                {otpSent && <p style={{ fontSize: 14, margin: 0, color: 'var(--text-secondary)' }}>Enter your sign-in code below to continue securely.</p>}
              </div>}

              {/* Primary Choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {/* Choice A: Google OAuth */}
                {googleConfig.enabled && googleConfig.clientId ? (
                  <div id="onboarding-google-signin-slot" style={{ width: '100%', maxWidth: '376px', minHeight: '46px', display: 'flex', justifyContent: 'center', alignSelf: 'center' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Google sign-in is currently unavailable. Use email verification below.
                  </div>
                )}

                <div style={{ textAlign: 'center', margin: '0.5rem 0', position: 'relative' }}>
                  <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                  <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface)', padding: '0 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    OR VERIFY WITH EMAIL CODE
                  </span>
                </div>

                {/* Choice B: Email OTP */}
                {!otpSent && !existingAccount ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="v3-btn-primary"
                    style={{
                      width: '100%', minWidth: 0, minHeight: '46px', height: 'auto',
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                      gap: '0.55rem', padding: '0.75rem 1rem', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.25
                    }}
                  >
                    <Mail size={16} />
                    <span style={{ flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere' }}>
                      {otpLoading ? 'Sending Code...' : 'Send 6-Digit Verification Code'}
                    </span>
                  </button>
                ) : otpSent ? (
                  <div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', textAlign: 'center' }}>
                      Enter the 6-digit code sent to <strong>{email}</strong>
                    </div>

                    {/* 6 Digit Numeric Inputs */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.25rem' }}>
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-input-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          style={{
                            width: '44px',
                            height: '52px',
                            textAlign: 'center',
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ))}
                    </div>

                    <button
                      id="verify-otp-button"
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading}
                      className="v3-btn-primary"
                      style={{ width: '100%', height: '46px', marginBottom: '0.85rem' }}
                    >
                      <span>{otpLoading ? 'Verifying...' : 'Verify & Continue'}</span>
                      <ArrowRight size={15} />
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={resendCooldown > 0}
                        style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--brand-terracotta)', cursor: resendCooldown > 0 ? 'default' : 'pointer', padding: 0 }}
                      >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(['','','','','','']); setStep(2); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      >
                        Change Email
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setStep(2)} className="v3-btn-secondary">
                  <ArrowLeft size={14} />
                  <span>Back to Details</span>
                </button>
              </div>
            </div>
          )}

          {/* ==========================================================
              STEP 4: PAYMENT REVIEW & DUAL PROVIDER CHECKOUT (V3)
              ========================================================== */}
          {step === 4 && <MembershipCheckout plan={selectedPlan} quote={pendingOrder} coupon={appliedCoupon} code={couponCode} setCode={value=>{setCouponCode(value);setAppliedCoupon(null);}} onApply={handleApplyCoupon} couponError={couponError} couponBusy={couponLoading} onPay={handleRazorpayPayment} onBack={()=>setStep(1)} busy={paymentProcessing} error={paymentError} success={paymentSuccess}/>}


        </div>
      </main>
    </div>
  );
}

