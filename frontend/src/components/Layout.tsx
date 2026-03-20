import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';

export default function Layout() {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user?.name || 'U').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.postMessage({ type: 'CLOSEIT_SET_TOKEN', token: '' }, '*');
    window.location.href = '/login';
  }

  const nav = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/calls', label: 'Calls' },
  ];
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
        <Link to="/dashboard" style={{ fontSize: 18, fontWeight: 700, color: '#4F46E5', textDecoration: 'none' }}>CloseIt</Link>
        {nav.map(({ path, label }) => (
          <Link key={path} to={path} style={{
            textDecoration: 'none', fontSize: 14, fontWeight: 500,
            color: loc.pathname.startsWith(path) ? '#4F46E5' : '#6b7280'
          }}>{label}</Link>
        ))}
        <div ref={menuRef} style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={user?.name || 'User'}
          >
            {initials}
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 6,
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: 160, padding: '6px 0', zIndex: 50
            }}>
              <div style={{ padding: '8px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                {user?.name || 'User'}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left',
                  fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer'
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
