import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import Spinner from './components/Spinner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './index.css';

// Lazy-load heavier pages (PreCall has large form state, PostCall has summary rendering)
const Calls = lazy(() => import('./pages/Calls'));
const PreCall = lazy(() => import('./pages/PreCall'));
const PostCall = lazy(() => import('./pages/PostCall'));
const Analytics = lazy(() => import('./pages/Analytics'));
const CrmSettings = lazy(() => import('./pages/CrmSettings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <Spinner label="Loading page" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={localStorage.getItem('token') ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calls" element={<Suspense fallback={<PageLoader />}><Calls /></Suspense>} />
          <Route path="/calls/:callId/precall" element={<Suspense fallback={<PageLoader />}><PreCall /></Suspense>} />
          <Route path="/calls/:callId/postcall" element={<Suspense fallback={<PageLoader />}><PostCall /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
          <Route path="/settings/crm" element={<Suspense fallback={<PageLoader />}><CrmSettings /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </GoogleOAuthProvider>,
);
