const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Send Bearer token for Chrome extension compatibility; browser also sends httpOnly cookie
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(url: string, opts: RequestInit = {}) {
  const r = await fetch(url, { ...opts, credentials: 'include', headers: { ...authHeaders(), ...(opts.headers || {}) } });
  const text = await r.text();
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Redirecting to login...');
    }
    let msg = `Request failed (${r.status})`;
    if (text) {
      try { msg = JSON.parse(text).detail || text; } catch { msg = text; }
    }
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return text ? JSON.parse(text) : {};
}

export async function createCall(data: object) {
  return request(`${BASE}/calls`, { method: 'POST', body: JSON.stringify(data) });
}

export async function generatePlan(callId: string) {
  return request(`${BASE}/calls/${callId}/plan`, { method: 'POST' });
}

export async function getPlan(callId: string) {
  return request(`${BASE}/calls/${callId}/plan`);
}

export async function listCalls(withPlanOnly = false, cursor = '') {
  const params = new URLSearchParams();
  if (withPlanOnly) params.set('with_plan_only', 'true');
  if (cursor) params.set('cursor', cursor);
  const qs = params.toString();
  return request(`${BASE}/calls${qs ? `?${qs}` : ''}`);
}

export async function getCallDetail(callId: string) {
  return request(`${BASE}/calls/${callId}/detail`);
}

export async function deleteCall(callId: string) {
  return request(`${BASE}/calls/${callId}`, { method: 'DELETE' });
}

export async function updateCall(callId: string, data: object) {
  return request(`${BASE}/calls/${callId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function summariseCall(callId: string) {
  return request(`${BASE}/postcall/${callId}/summarise`, { method: 'POST' });
}

export async function getSummary(callId: string) {
  return request(`${BASE}/postcall/${callId}/summary`);
}
