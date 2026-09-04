import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Loader2, LogOut, Moon, Sun, Save, Home, Upload } from "lucide-react";

function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { refresh: refreshPlatform } = usePlatformSettings();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    api.get("/admin/settings")
      .then((res) => setSettings(res.data.settings || {}))
      .catch(() => toast.error("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put("/admin/settings", { settings });
      setSettings(res.data.settings || {});
      refreshPlatform();
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout").catch(() => {});
    } finally {
      logout();
      navigate("/login");
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.post("/admin/settings/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSettings((prev) => ({ ...prev, website_logo: res.data.logoUrl }));
      refreshPlatform();
      toast.success("Logo uploaded successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const settingGroups = [
    {
      title: "Appearance",
      description: "Customize the look and feel of the platform.",
      fields: [
        { key: "primary_color", label: "Primary Color", type: "color", placeholder: "#F59E0B" },
        { key: "font_family", label: "Font Family", type: "text", placeholder: "Geist, sans-serif" },
        { key: "use_emoji", label: "Use Emoji in UI", type: "select", options: [
          { value: "true", label: "Enabled" },
          { value: "false", label: "Disabled" },
        ]},
      ],
    },
    {
      title: "Branding",
      description: "Manage logo and profile photo settings.",
      fields: [
        { key: "website_logo", label: "Website Logo", type: "logo", placeholder: "" },
        { key: "profile_photo_style", label: "User Profile Photo Style", type: "select", options: [
          { value: "circle", label: "Circle" },
          { value: "rounded", label: "Rounded" },
          { value: "square", label: "Square" },
        ]},
      ],
    },
    {
      title: "Platform Information",
      description: "Contact and location details shown on public pages.",
      fields: [
        { key: "contact_email", label: "Email", type: "text", placeholder: "admin@apex.com" },
        { key: "contact_phone", label: "Phone", type: "text", placeholder: "+1 234 567 890" },
        { key: "contact_location", label: "Location", type: "text", placeholder: "City, Country" },
        { key: "our_mission", label: "Our Mission", type: "textarea", placeholder: "Platform mission statement" },
        { key: "our_vision", label: "Our Vision", type: "textarea", placeholder: "Platform vision statement" },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Global platform settings and account management.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" /> Home
          </Button>
          <Button variant="outline" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Theme</h2>
            <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
          </div>
          <Button variant="outline" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </div>

      {settingGroups.map((group) => (
        <div key={group.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" || field.type === "logo" ? "sm:col-span-2" : ""}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    value={settings[field.key] || ""}
                    onChange={(e) => updateSetting(field.key, e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm"
                  >
                    <option value="">Select...</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={settings[field.key] || ""}
                    onChange={(e) => updateSetting(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
                  />
                ) : field.type === "color" ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings[field.key] || "#F59E0B"}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      className="h-11 w-11 rounded-xl border border-border cursor-pointer"
                    />
                    <Input
                      value={settings[field.key] || ""}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ) : field.type === "logo" ? (
                  <div className="space-y-3">
                    {settings[field.key] ? (
                      <div className="flex items-center gap-3">
                        <img src={settings[field.key]} alt="Logo" className="h-12 w-12 rounded-lg border border-border object-contain" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => { updateSetting(field.key, ""); refreshPlatform(); }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,.webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {settings[field.key] ? "Replace Logo" : "Upload Logo"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={settings[field.key] || ""}
                    onChange={(e) => updateSetting(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}

export default Settings;
