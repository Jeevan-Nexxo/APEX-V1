import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, Home } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";

function RoleLayout({ brand = "APEX", subtitle, links }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { get } = usePlatformSettings();
  const showEmoji = get("use_emoji") !== "false";
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    ].join(" ");

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-primary">
              {brand}
            </div>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-accent"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <NavLink to="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-foreground mb-2">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </NavLink>
          <div className="border-t border-border pt-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} end={link.end}>
                {showEmoji && <span className="text-base">{link.icon}</span>}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-xl font-semibold text-primary">
                {brand}
              </div>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mobileOpen ? (
            <nav className="border-t border-border bg-card p-3">
              <div className="grid gap-1">
                <NavLink
                  to="/"
                  className={linkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </NavLink>
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={linkClass}
                    end={link.end}
                    onClick={() => setMobileOpen(false)}
                  >
                    {showEmoji && <span className="text-base">{link.icon}</span>}
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
          ) : null}
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default RoleLayout;
