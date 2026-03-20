import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";

export default function Layout() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user?.name || "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.postMessage({ type: "SALESWISE_SET_TOKEN", token: "" }, "*");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#12121a] border-b border-[#2a2a3a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              <span className="text-lg font-bold tracking-tight text-white">
                Sales-Wise
              </span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `relative px-4 py-5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    Dashboard
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/calls"
                className={({ isActive }) =>
                  `relative px-4 py-5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    Calls
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            </div>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                title={user?.name || "User"}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm text-gray-300 max-w-[140px] truncate">
                  {user?.name || "User"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a1a25] border border-[#2a2a3a] shadow-xl shadow-black/40 py-1">
                  <div className="px-4 py-3 border-b border-[#2a2a3a]">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || "User"}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
