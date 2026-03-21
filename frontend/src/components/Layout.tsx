import { useState, useRef, useEffect, useMemo } from "react";
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

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
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
    <div className="min-h-screen bg-dark-bg text-dark-text font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-dark-surface border-b border-dark-border">
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
                      : "text-dark-label hover:text-dark-text"
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
                      : "text-dark-label hover:text-dark-text"
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
              <NavLink
                to="/analytics"
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
                    Analytics
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            </div>

            {/* Settings Gear */}
            <NavLink
              to="/settings/crm"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-colors ${
                  isActive ? "text-indigo-400 bg-indigo-500/10" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`
              }
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </NavLink>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                aria-label={`Account menu for ${user?.name || "User"}`}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm text-dark-label max-w-[140px] truncate">
                  {user?.name || "User"}
                </span>
                <svg
                  className={`w-4 h-4 text-dark-muted transition-transform ${
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
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-card border border-dark-border shadow-lg shadow-black/20 py-1">
                  <div className="px-4 py-3 border-b border-dark-border">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || "User"}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-dark-muted truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-dark-label hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
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
