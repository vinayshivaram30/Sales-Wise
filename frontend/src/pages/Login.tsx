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
      // Notify extension via postMessage (content-app.js forwards to extension)
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
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 font-sans">
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center mb-5">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h1 className="text-[32px] font-bold text-white tracking-[-0.02em] font-display">
              Sales-Wise
            </h1>
            <p className="text-dark-text text-sm font-medium mt-3 text-center max-w-[280px] leading-relaxed">
              The right MEDDIC question, whispered at the right moment during your live call.
            </p>
          </div>

          {/* Sign in */}
          <div className="flex justify-center mb-8">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setLoginError("Login failed. Please try again.")}
              theme="filled_black"
              shape="pill"
              size="large"
            />
          </div>
          {loginStatus && <p className="mb-4 text-center text-sm text-indigo-400">{loginStatus}</p>}
          {loginError && <p className="mb-4 text-center text-sm text-red-400">{loginError}</p>}

          {/* Value proof — what you get */}
          <div className="border-t border-dark-border pt-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-live shrink-0" />
                <p className="text-xs text-dark-label leading-relaxed"><span className="text-dark-text font-medium">Live whispers</span> — AI suggests qualification questions as your prospect speaks</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <p className="text-xs text-dark-label leading-relaxed"><span className="text-dark-text font-medium">Pre-call prep</span> — MEDDIC plan generated from your context in seconds</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                <p className="text-xs text-dark-label leading-relaxed"><span className="text-dark-text font-medium">Post-call intel</span> — scorecard, objections, coaching notes, next steps</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-dark-muted text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
