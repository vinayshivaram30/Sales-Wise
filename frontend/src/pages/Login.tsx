import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [loginError, setLoginError] = useState('');
  const [loginStatus, setLoginStatus] = useState('');

  async function handleSuccess(cred: { credential?: string }) {
    try {
      setLoginStatus("Signing in...");
      setLoginError('');
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiUrl}/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id_token: cred.credential }),
        }
      );
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.detail || `Login failed (${res.status})`);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.postMessage(
        { type: "SALESWISE_SET_TOKEN", token: data.access_token },
        "*"
      );
      setLoginStatus("Redirecting...");
      window.location.href = "/dashboard";
    } catch (err) {
      setLoginStatus('');
      setLoginError(err instanceof Error ? err.message : "Login failed. Please try again.");
    }
  }

  return (
    <div
      className="min-h-screen bg-dark-bg flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.06) 0%, #0a0a0f 65%)" }}
    >
      <div className="relative w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-dark-surface border border-dark-border border-t-2 border-t-accent rounded-2xl p-12 shadow-[0_0_80px_-20px_rgba(99,102,241,0.12)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-[-0.03em]">
              Sales-Wise
            </h1>
            <p className="text-white/80 text-base font-medium mt-3 text-center max-w-[300px] leading-relaxed">
              The right MEDDIC question, whispered at the right moment.
            </p>
          </div>

          {/* Sign in */}
          <p className="text-xs text-dark-label text-center mb-3 uppercase tracking-wider font-medium">
            Sign in to get started
          </p>
          <div className="flex justify-center mb-6 min-h-[48px]">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setLoginError("Google sign-in failed. Check pop-up blocker or try again.")}
              theme="filled_black"
              shape="pill"
              size="large"
              ux_mode="popup"
            />
          </div>
          {loginStatus && <p className="mb-4 text-center text-sm text-accent font-medium">{loginStatus}</p>}
          {loginError && <p className="mb-4 text-center text-sm text-danger">{loginError}</p>}

          {/* Value proof */}
          <div className="border-t border-dark-border pt-6 mt-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-live shrink-0" />
                <p className="text-sm text-dark-label leading-relaxed">
                  <span className="text-white font-medium">Live whispers</span> — AI suggests questions as your prospect speaks
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-accent shrink-0" />
                <p className="text-sm text-dark-label leading-relaxed">
                  <span className="text-white font-medium">Pre-call prep</span> — MEDDIC plan generated from your context
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-success shrink-0" />
                <p className="text-sm text-dark-label leading-relaxed">
                  <span className="text-white font-medium">Post-call intel</span> — scorecard, coaching, next steps
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-dark-muted text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
