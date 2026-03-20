import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [loginError, setLoginError] = useState('');
  async function handleSuccess(cred: { credential?: string }) {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/google`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: cred.credential }),
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
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Subtle gradient accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-10 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
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
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sales-wise
            </h1>
            <p className="text-indigo-400 text-sm font-medium mt-2">
              Your AI co-pilot for live sales calls
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Never miss a qualification question again
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-[#2a2a3a]" />
            <span className="text-xs text-gray-600 uppercase tracking-wider">
              Sign in to continue
            </span>
            <div className="flex-1 h-px bg-[#2a2a3a]" />
          </div>

          {/* Google Login Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setLoginError("Login failed. Please try again.")}
              theme="filled_black"
              shape="pill"
              size="large"
            />
          </div>
          {loginError && <p className="mt-3 text-center text-sm text-red-400">{loginError}</p>}
        </div>

        {/* Footer text */}
        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
