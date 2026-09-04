import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { logoutUser } from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/visitor/settings")
      .then((res) => {
        const s = res.data.settings || {};
        setEmailNotifications(s.email_notifications !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async (updates) => {
    setSaving(true);
    try {
      await api.put("/visitor/settings", {
        theme,
        email_notifications: updates.email_notifications !== undefined ? updates.email_notifications : emailNotifications,
      });
      toast.success("Settings saved.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    saveSettings({});
  };

  const handleNotificationToggle = () => {
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    saveSettings({ email_notifications: newVal });
  };

  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate("/");
  };

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Theme and account actions.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">Current: {theme}</p>
            </div>
            <button onClick={handleThemeToggle} disabled={saving}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
              Toggle theme
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates about bookmarked projects</p>
            </div>
            <button onClick={handleNotificationToggle} disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${emailNotifications ? "bg-primary" : "bg-muted"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <button onClick={handleLogout}
            className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 w-full sm:w-auto">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Settings;
