// Use full API URL directly (proxy can fail with ENOTFOUND for production hosts)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function handleAuthError(r: Response, text: string): never {
  if (r.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Redirecting to login...');
  }
  throw new Error(text || `Request failed (${r.status})`);
}

export async function createCall(data: object) {
  const r = await fetch(`${BASE}/calls`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data)
  });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return text ? JSON.parse(text) : {};
}

export async function generatePlan(callId: string) {
  const r = await fetch(`${BASE}/calls/${callId}/plan`, {
    method: 'POST', headers: authHeaders()
  });
  const text = await r.text();
  if (!r.ok) {
    if (r.status === 401) handleAuthError(r, text);
    let msg = `Request failed (${r.status})`;
    if (text) {
      try {
        const parsed = JSON.parse(text);
        msg = parsed.detail || text;
      } catch {
        msg = text;
      }
    }
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return text ? JSON.parse(text) : {};
}

export async function getPlan(callId: string) {
  const r = await fetch(`${BASE}/calls/${callId}/plan`, { headers: authHeaders() });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return text ? JSON.parse(text) : {};
}

export async function listCalls(withPlanOnly = false) {
  const url = withPlanOnly ? `${BASE}/calls?with_plan_only=true` : `${BASE}/calls`;
  const r = await fetch(url, { headers: authHeaders() });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return text ? JSON.parse(text) : [];
}

export async function getCallDetail(callId: string) {
  const r = await fetch(`${BASE}/calls/${callId}/detail`, { headers: authHeaders() });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return text ? JSON.parse(text) : {};
}

export async function deleteCall(callId: string) {
  const r = await fetch(`${BASE}/calls/${callId}`, {
    method: 'DELETE', headers: authHeaders()
  });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return;
}

export async function updateCall(callId: string, data: object) {
  const r = await fetch(`${BASE}/calls/${callId}`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data)
  });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return text ? JSON.parse(text) : {};
}

export async function summariseCall(callId: string) {
  const r = await fetch(`${BASE}/postcall/${callId}/summarise`, {
    method: 'POST', headers: authHeaders()
  });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return text ? JSON.parse(text) : {};
}

export async function getSummary(callId: string) {
  const r = await fetch(`${BASE}/postcall/${callId}/summary`, { headers: authHeaders() });
  const text = await r.text();
  if (!r.ok) {
    handleAuthError(r, text);
  }
  return text ? JSON.parse(text) : {};
}
