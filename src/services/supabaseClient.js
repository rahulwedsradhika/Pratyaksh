/**
 * Compatibility wrapper for the app's first-party server auth endpoints.
 * Despite the historic name, this app does not authenticate with Supabase.
 */
class LocalSupabaseAuthProxy {
  constructor() {
    this._listeners = [];
  }

  onAuthStateChange(callback) {
    this._listeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this._listeners = this._listeners.filter(cb => cb !== callback);
          }
        }
      }
    };
  }

  _notify(event, session) {
    this._listeners.forEach(cb => {
      try { cb(event, session); } catch (e) { console.error(e); }
    });
  }

  async getSession() {
    const token = localStorage.getItem('ayur_auth_token');
    const userJson = localStorage.getItem('ayur_local_learner');
    if (!token || !userJson) {
      return { data: { session: null }, error: null };
    }
    try {
      const user = JSON.parse(userJson);
      return {
        data: {
          session: {
            access_token: token,
            user: {
              id: user.id,
              email: user.email,
              user_metadata: { full_name: user.fullName || user.name }
            }
          }
        },
        error: null
      };
    } catch {
      return { data: { session: null }, error: null };
    }
  }

  async signInWithPassword({ email, password, authProvider = 'email' }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, authProvider })
    });
    const data = await res.json();
    if (!data.status) {
      return { data: null, error: new Error(data.message || 'Login failed') };
    }
    localStorage.setItem('ayur_auth_token', data.token);
    localStorage.setItem('ayur_local_learner', JSON.stringify(data.student));
    this._notify('SIGNED_IN', { access_token: data.token, user: data.student });
    return { data: { user: data.student, session: { access_token: data.token } }, error: null };
  }

  async signInWithOtp({ email, options = {} }) {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: options.data?.purpose || 'registration' })
    });
    const data = await res.json();
    if (!data.status) {
      const error = new Error(data.message || 'Failed to dispatch code');
      error.code = data.code;
      return { data: null, error };
    }
    return { data: { message: data.message }, error: null };
  }

  async verifyOtp({ email, token: code, type = 'email', options = {} }) {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code,
        purpose: type === 'recovery' ? 'password_reset' : (options.data?.purpose || 'registration'),
        fullName: options.data?.full_name,
        phone: options.data?.phone,
        examGoal: options.data?.exam_goal,
        planId: options.data?.plan_id
      })
    });
    const data = await res.json();
    if (!data.status) {
      return { data: null, error: new Error(data.message || 'Invalid verification code') };
    }
    localStorage.setItem('ayur_auth_token', data.token);
    localStorage.setItem('ayur_local_learner', JSON.stringify(data.student));
    this._notify('SIGNED_IN', { access_token: data.token, user: data.student });
    return { data: { user: data.student, session: { access_token: data.token } }, error: null };
  }

  async signInWithOAuth({ provider, options = {} }) {
    if (provider === 'google') {
      return {
        data: null,
        error: new Error('Google sign-in must be completed through Google Identity Services.')
      };
    }
    return { data: null, error: new Error(`Provider ${provider} not supported in local sandbox`) };
  }

  async resetPasswordForEmail(email) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    return { data: { message: data.message }, error: data.status ? null : new Error(data.message) };
  }

  async updateUser({ password, data: userMetadata = {} }) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: password })
    });
    const data = await res.json();
    return { data: { user: null }, error: data.status ? null : new Error(data.message) };
  }

  async signOut() {
    try {
      const token=localStorage.getItem('ayur_auth_token');
      if(token)await fetch('/api/auth/logout', { method: 'POST',headers:{Authorization:`Bearer ${token}`} });
    } catch {}
    localStorage.removeItem('ayur_auth_token');
    localStorage.removeItem('ayur_local_learner');
    try {
      this._notify('SIGNED_OUT', null);
    } catch {}
    return { error: null };
  }
}

// Keep the existing consumer API while routing auth to our application server.
export const supabase = {
  auth: new LocalSupabaseAuthProxy(),
  isLive: false
};

