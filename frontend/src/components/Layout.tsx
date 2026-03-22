import { useState, useRef, useEffect, useMemo } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/calls", label: "Calls" },
  { to: "/analytics", label: "Analytics" },
] as const;

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
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-dark-surface/95 backdrop-blur-sm border-b border-dark-border">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                Sales-Wise
              </span>
            </NavLink>

            {/* Center: Nav Links */}
            <div className="flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-white bg-white/[0.07]"
                        : "text-dark-label hover:text-dark-text hover:bg-white/[0.04]"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Right: Settings + Profile */}
            <div className="flex items-center gap-1.5">
              <NavLink
                to="/settings/crm"
                className={({ isActive }) =>
                  `p-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-accent bg-accent/10"
                      : "text-dark-muted hover:text-dark-label hover:bg-white/[0.04]"
                  }`
                }
                title="Settings"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </NavLink>

              {/* Separator */}
              <div className="w-px h-5 bg-dark-border mx-0.5" />

              {/* User Avatar Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/[0.04] transition-colors"
                  aria-label={`Account menu for ${user?.name || "User"}`}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[11px] font-semibold text-white">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm text-dark-label max-w-[120px] truncate">
                    {user?.name || "User"}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-dark-muted transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-dark-card border border-dark-border shadow-lg shadow-black/30 py-1">
                    <div className="px-3.5 py-2.5 border-b border-dark-border">
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
                      className="w-full text-left px-3.5 py-2 text-sm text-dark-label hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
