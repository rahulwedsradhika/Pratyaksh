import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('ayur_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ayur_admin_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const acceptSession = useCallback((data) => {
    setAdminToken(data.token);
    setAdminUser(data.admin);
    localStorage.setItem('ayur_admin_token', data.token);
    localStorage.setItem('ayur_admin_user', JSON.stringify(data.admin));
    window.dispatchEvent(new Event('admin-session-changed'));
    return { success: true, admin: data.admin };
  }, []);

  const clearSession = useCallback(() => {
    setAdminToken('');
    setAdminUser(null);
    localStorage.removeItem('ayur_admin_token');
    localStorage.removeItem('ayur_admin_user');
    window.dispatchEvent(new Event('admin-session-changed'));
  }, []);

  const request = useCallback(async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.auth !== false && adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== true) throw new Error(data.error || data.message || 'The admin server returned an invalid response. Refresh and try again.');
    return data;
  }, [adminToken]);

  const fetchCurrentAdmin = useCallback(async (token = adminToken) => {
    if (!token) { setAdminUser(null); setLoading(false); return null; }
    try {
      const response = await fetch('/api/admin/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !data.status || !data.admin) throw new Error('Admin session expired.');
      setAdminUser(data.admin);
      localStorage.setItem('ayur_admin_user', JSON.stringify(data.admin));
      return data.admin;
    } catch {
      clearSession();
      return null;
    } finally { setLoading(false); }
  }, [adminToken, clearSession]);

  useEffect(() => {
    if (adminToken) fetchCurrentAdmin(adminToken);
    else setLoading(false);
  }, [adminToken, fetchCurrentAdmin]);

  const authRequest = async (path, body) => {
    try {
      const response = await fetch(`/api/admin/auth/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => null);
      if (!data) return { success: false, error: 'The authentication server is unavailable. Please try again shortly.' };
      if (!response.ok || !data.status) return { success: false, error: data.error || data.message || 'Authentication failed.' };
      return path === 'otp/send' ? { success: true, ...data } : acceptSession(data);
    } catch { return { success: false, error: 'Could not connect to the admin server.' }; }
  };

  const requestAdminOtp = (email) => authRequest('otp/send', { email });
  const verifyAdminOtp = (email, code) => authRequest('otp/verify', { email, code });
  const loginWithGoogle = (credential) => authRequest('google', { credential });

  const completeAdminProfile = async (profile) => {
    try {
      const data = await request('/api/admin/auth/profile', { method: 'PUT', body: JSON.stringify(profile) });
      setAdminUser(data.admin);
      localStorage.setItem('ayur_admin_user', JSON.stringify(data.admin));
      return { success: true, admin: data.admin };
    } catch (error) { return { success: false, error: error.message }; }
  };

  const adminLogout = async () => {
    try {
      if (adminToken) await fetch('/api/admin/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
    } finally { clearSession(); }
  };

  const permissions = adminUser?.permissions || {};
  const hasPermission = (key) => {
    if (!adminUser || typeof key !== 'string') return false;
    if (adminUser.role === 'super_admin') return true;
    const normalized = key.toLowerCase();
    if (normalized.includes('student')) return ['admissions_staff'].includes(adminUser.role);
    if (normalized.includes('plan')) return false;
    if (normalized.includes('payment') || normalized.includes('report')) return adminUser.role === 'finance_staff';
    return false;
  };

  return <AdminAuthContext.Provider value={{
    adminToken, adminUser, permissions, hasPermission, loading,
    requestAdminOtp, verifyAdminOtp, loginWithGoogle, completeAdminProfile,
    fetchCurrentAdmin, adminLogout, request,
    isAuthenticated: Boolean(adminToken && adminUser)
  }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
}
