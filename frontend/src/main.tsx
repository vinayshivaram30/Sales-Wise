import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calls from './pages/Calls';
import PreCall from './pages/PreCall';
import PostCall from './pages/PostCall';
import Analytics from './pages/Analytics';
import CrmSettings from './pages/CrmSettings';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={localStorage.getItem('token') ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/calls/:callId/precall" element={<PreCall />} />
          <Route path="/calls/:callId/postcall" element={<PostCall />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings/crm" element={<CrmSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </GoogleOAuthProvider>,
);
