export function contentSourceHeaders(token) {
  const headers = { Accept: 'application/json' };
  if (token) {
    const clean = String(token).trim().replace(/^Bearer\s+/i, '');
    if (/[\r\n]/.test(clean)) throw new Error('Invalid production content credential');
    if (clean) headers.Authorization = `Bearer ${clean}`;
  }
  return headers;
}

// This provider sometimes reports access denial in a successful HTTP response.
export function assertContentAuthorized(payload) {
  if (payload?.status === false && /access denied|unauthori[sz]ed|not authori[sz]ed|enrolled courses|authentication required|token.*(?:invalid|expired)|(?:invalid|expired).*token/i.test(payload.message || payload.error || '')) {
    const error = new Error('The production content provider requires a valid enrolled account or service credential.');
    error.status = error.httpStatus = 403;
    error.code = 'CONTENT_SOURCE_AUTH_REQUIRED';
    throw error;
  }
}
