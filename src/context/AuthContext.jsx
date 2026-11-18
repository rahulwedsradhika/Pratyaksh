import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {readApiResponse} from '../services/apiResponse';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [studentState, setStudentState] = useState('anonymous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Persisted plan selection across onboarding & redirects
  const [selectedPlan, setSelectedPlanState] = useState(() => {
    try {
      const saved = localStorage.getItem('ayur_selected_plan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setSelectedPlan = (plan) => {
    setSelectedPlanState(plan);
    if (plan) {
      localStorage.setItem('ayur_selected_plan', JSON.stringify(plan));
    } else {
      localStorage.removeItem('ayur_selected_plan');
    }
  };

  // Authoritative student state query from server
  const refreshStudentState = useCallback(async () => {
    const token = localStorage.getItem('ayur_admin_token') || localStorage.getItem('ayur_auth_token');
    if (!token) {
      setUser(null);
      setMembership(null);
      setStudentState('anonymous');
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch('/api/student/me', {
        signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse(res);
      if (data.status && data.student) {
        setUser(data.student);
        setMembership(data.membership || null);
        setStudentState(data.studentState || 'anonymous');
        localStorage.setItem('ayur_local_learner', JSON.stringify(data.student));
        return data;
      } else {
        // Token invalid or expired
        localStorage.removeItem('ayur_auth_token');
        setUser(null);
        setMembership(null);
        setStudentState('anonymous');
        return null;
      }
    } catch (err) {
      console.error('Failed to sync student state:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStudentState();
    const refreshAdminSession = () => refreshStudentState();
    window.addEventListener('admin-session-changed', refreshAdminSession);
    const storageChanged = event => {
      if (['ayur_admin_token', 'ayur_auth_token'].includes(event.key)) refreshStudentState();
    };
    window.addEventListener('storage', storageChanged);

    // Listen to Supabase auth events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await refreshStudentState();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setMembership(null);
        setStudentState('anonymous');
      }
    });

    return () => {
      window.removeEventListener('admin-session-changed', refreshAdminSession);
      window.removeEventListener('storage', storageChanged);
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [refreshStudentState]);

  // Sign In with Email & Password
  const loginWithPassword = async (emailOrObj, maybePassword) => {
    let email, password, authProvider;
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      email = emailOrObj.email;
      password = emailOrObj.password;
      authProvider = emailOrObj.authProvider || 'email';
    } else {
      email = emailOrObj;
      password = maybePassword;
      authProvider = 'email';
    }

    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password, authProvider });
      if (authError) throw authError;
      const synced = await refreshStudentState();
      return { success: true, data: synced };
    } catch (error) {
      const message=error.message || 'Could not sign in. Please try again.';
      setError(message);
      return {success:false,error:message};
    } finally { setLoading(false); }
  };

  // Send Email OTP Code
  const sendEmailOtp = async (emailOrObj, purpose = 'registration') => {
    const email = typeof emailOrObj === 'object' ? emailOrObj.email : emailOrObj;
    setError(null);
    const { data, error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { data: { purpose } }
    });
    if (otpError) {
      setError(otpError.message);
      return { success: false, error: otpError.message, code: otpError.code };
    }
    return { success: true, message: data.message };
  };

  // Verify Email OTP Code
  const verifyEmailOtp = async (emailOrObj, codeOrMeta, maybeMetadata = {}) => {
    let email, code, metadata;
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      email = emailOrObj.email;
      code = emailOrObj.otp || emailOrObj.code || emailOrObj.token;
      metadata = emailOrObj;
    } else {
      email = emailOrObj;
      code = codeOrMeta;
      metadata = maybeMetadata;
    }

    setError(null);
    setLoading(true);
    try {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: metadata.type || 'email',
      options: { data: metadata }
    });
    if (verifyError) {
      throw verifyError;
    }
    const synced = await refreshStudentState();
    return { success: true, data: synced };
    } catch(error) {
      const message=error.message || 'Could not verify your code. Please try again.';
      setError(message);
      return {success:false,error:message};
    } finally { setLoading(false); }
  };

  // Google OAuth / GIS Sign In
  const loginWithGoogle = async (credential, profile = {}) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, profile })
      });
      const data = await readApiResponse(res);
      if (!data.status) {
        const message=data.message || data.error || 'Google authentication failed';
        setError(message);
        setLoading(false);
        return { success: false, error: message };
      }
      localStorage.setItem('ayur_auth_token', data.token);
      localStorage.setItem('ayur_local_learner', JSON.stringify(data.student));
      await refreshStudentState();
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Network error verifying Google authentication');
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Profile Update
  const updateProfile = async (fields) => {
    const token = localStorage.getItem('ayur_admin_token') || localStorage.getItem('ayur_auth_token');
    const res = await fetch('/api/student/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(fields)
    });
    const data = await readApiResponse(res);
    if (data.status) {
      await refreshStudentState();
      return { success: true, student: data.student };
    }
    return { success: false, error: data.message };
  };

  // Initialize Payment Checkout
  const initializeCheckout = async (planId) => {
    const token = localStorage.getItem('ayur_auth_token');
    const res = await fetch('/api/payment/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ planId, idempotencyKey: `idem_${Date.now()}` })
    });
    const data = await readApiResponse(res);
    return {
      ...data,
      success: !!data.status,
      order: data.order
    };
  };

  // Verify Payment & Activate Membership
  const verifyPayment = async (orderId, providerPaymentId = `PAY_${Date.now()}`) => {
    const token = localStorage.getItem('ayur_auth_token');
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, providerPaymentId })
    });
    const data = await readApiResponse(res);
    if (data.status) {
      await refreshStudentState();
      return { success: true, status: true, membership: data.membership, sandbox: Boolean(data.sandbox), message: data.message };
    }
    return { success: false, status: false, error: data.message };
  };

  // Logout
  const logout = async () => {
    const token=localStorage.getItem('ayur_auth_token');
    if(token){try{await fetch('/api/auth/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}});}catch{}}
    localStorage.removeItem('ayur_auth_token');
    localStorage.removeItem('ayur_local_learner');
    setUser(null);
    setMembership(null);
    setStudentState('anonymous');
    try {
      if (supabase?.auth?.signOut) {
        await supabase.auth.signOut();
      }
    } catch (err) {}
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        membership,
        studentState,
        selectedPlan,
        setSelectedPlan,
        loading,
        error,
        loginWithPassword,
        sendEmailOtp,
        verifyEmailOtp,
        loginWithGoogle,
        updateProfile,
        initializeCheckout,
        verifyPayment,
        logout,
        refreshStudentState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

