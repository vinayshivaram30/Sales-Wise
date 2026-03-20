import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  async function handleSuccess(cred: { credential?: string }) {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: cred.credential })
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.detail || `Login failed (${res.status})`);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Notify extension via postMessage (content-app.js forwards to extension)
    window.postMessage({ type: 'CLOSEIT_SET_TOKEN', token: data.access_token }, '*');
    window.location.href = '/dashboard';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>CloseIt</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>AI-powered live call guidance — close deals 10x faster</p>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => alert('Login failed')}
      />
    </div>
  );
}
