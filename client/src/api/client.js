// The ONLY place the API URL and token are handled.
const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001' : '')).replace(/\/$/, '');
const TOKEN_KEY = 'helpdesk_token';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status, details, code) { super(message); this.status = status; this.details = details || []; this.code = code; }
}

export const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

async function request(method, path, body, signal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000); // generous: free hosting can take a while to wake up
  signal?.addEventListener('abort', () => ctrl.abort());
  const token = getToken();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && token && !path.startsWith('/api/auth/login')) onUnauthorized();
      throw new ApiError(data?.error || 'Request failed', res.status, data?.details, data?.code);
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('Request cancelled or timed out', 0);
    throw new ApiError('Cannot reach the server. Please try again.', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: (path, signal) => request('GET', path, undefined, signal),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};

export const errorText = (err) =>
  err.details?.length ? err.details.map((d) => `${d.field}: ${d.message}`).join(' · ') : err.message;
