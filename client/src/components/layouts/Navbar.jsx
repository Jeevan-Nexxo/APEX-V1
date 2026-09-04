import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";

const ROLE_DASHBOARDS = {
  student: "/student/dashboard",
  visitor: "/visitor/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/projects", label: "Projects" },
    { to: "/contact", label: "Contact" },
    { to: "/help", label: "Help" },
  ];

  const linkClass = ({ isActive }) =>
    [
      "text-sm font-medium transition-colors",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          {settings.website_logo ? (
            <img src={settings.website_logo} alt="APEX" className="h-10 w-10 rounded-xl object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
              A
            </div>
          )}
          <div>
            <div className="text-lg font-semibold tracking-tight">APEX</div>
            <div className="text-xs text-muted-foreground">Innovation platform</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              <Link
                to={ROLE_DASHBOARDS[user.role] || "/"}
                className="hidden rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent md:inline-flex"
              >
                Dashboard
              </Link>
              <button
                onClick={() => { logout(); }}
                className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 md:inline-flex"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent md:inline-flex"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 md:inline-flex"
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <div className="grid gap-2">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={linkClass}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <Link to={ROLE_DASHBOARDS[user.role] || "/"} className="rounded-xl border border-border px-4 py-2 text-center text-sm font-medium">
                    Dashboard
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="rounded-xl bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rounded-xl border border-border px-4 py-2 text-center text-sm font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="rounded-xl bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
