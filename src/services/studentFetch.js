// Send first-party sessions only to this site's API, never to external providers.
export function studentFetch(input, options = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
  const headers = new Headers(options.headers || (typeof input !== 'string' ? input.headers : undefined));
  const token = localStorage.getItem('ayur_admin_token') || localStorage.getItem('ayur_auth_token');
  if (token && url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return window.fetch(input, { ...options, headers });
}
