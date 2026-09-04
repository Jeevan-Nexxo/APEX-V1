import { Link } from "react-router-dom";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";

function Footer() {
  const { settings } = usePlatformSettings();

  const email = settings.contact_email || "";
  const phone = settings.contact_phone || "";
  const location = settings.contact_location || "";
  const logo = settings.website_logo || "";

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="APEX" className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                A
              </div>
            )}
            <div>
              <div className="text-base font-semibold tracking-tight text-foreground">APEX</div>
              <div className="text-xs text-muted-foreground">Innovation platform</div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link to="/help" className="hover:text-foreground transition-colors">Help</Link>
          </nav>

          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground md:items-end">
            {email && <span>{email}</span>}
            {phone && <span>{phone}</span>}
            {location && <span>{location}</span>}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-5 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} APEX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
