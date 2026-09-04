import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { Loader2, Users, Eye, Briefcase, GraduationCap, Mail, Phone, MapPin, Edit3, Home } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshPlatform } = usePlatformSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsData, setSettingsData] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingField, setSavingField] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, settingsRes] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/admin/settings"),
      ]);
      setData(overviewRes.data);
      setSettingsData(settingsRes.data.settings || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveSetting = async (key, value) => {
    try {
      setSavingField(key);
      const res = await api.put("/admin/settings", { settings: { [key]: value } });
      setSettingsData(res.data.settings || {});
      refreshPlatform();
      toast.success("Setting updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update setting.");
    } finally {
      setSavingField(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const admin = data?.admin;

  const roleCards = [
    { label: "Students", value: stats.students || 0, filter: "student", icon: GraduationCap, color: "text-blue-500" },
    { label: "Visitors", value: stats.visitors || 0, filter: "visitor", icon: Eye, color: "text-green-500" },
    { label: "Managers", value: stats.managers || 0, filter: "manager", icon: Briefcase, color: "text-purple-500" },
  ];

  const overviewCards = [
    { label: "Total Users", value: stats.users || 0, icon: Users },
    { label: "Total Projects", value: stats.projects || 0, icon: Briefcase },
    { label: "Pending Projects", value: stats.pendingProjects || 0, icon: Loader2 },
    { label: "Approved Projects", value: stats.approvedProjects || 0, icon: Loader2 },
    { label: "Blocked Users", value: stats.blockedUsers || 0, icon: Users },
    { label: "Contact Requests", value: stats.contactRequests || 0, icon: Mail },
  ];

  const editableSettings = [
    { key: "our_mission", label: "Our Mission", placeholder: "Enter platform mission statement" },
    { key: "our_vision", label: "Our Vision", placeholder: "Enter platform vision statement" },
    { key: "contact_email", label: "APEX Platform Email", placeholder: "admin@apex.com", icon: Mail },
    { key: "contact_phone", label: "APEX Platform Phone", placeholder: "+1 234 567 890", icon: Phone },
    { key: "contact_location", label: "APEX Platform Location", placeholder: "City, Country", icon: MapPin },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Platform overview and management controls.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" /> Home
        </Button>
      </div>

      {admin && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
              {admin.profile_picture ? (
                <img src={admin.profile_picture} alt={admin.full_name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                admin.full_name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-foreground truncate">{admin.full_name}</p>
              <p className="text-sm text-muted-foreground">{admin.email}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">Role: {admin.role} &middot; Member since {new Date(admin.created_at).toLocaleDateString()}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="shrink-0">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Platform Info
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {roleCards.map((card) => (
          <button
            key={card.label}
            onClick={() => navigate(`/admin/users?role=${card.filter}`)}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 text-left transition-colors hover:bg-accent/50 hover:border-primary/30 group"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="mt-2 text-3xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">View all &rarr;</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Platform Information</h2>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
        <div className="space-y-3">
          {editableSettings.map((s) => (
            <div key={s.key} className="flex items-start gap-3">
              {s.icon && <s.icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm text-foreground truncate">{settingsData[s.key] || <span className="italic text-muted-foreground/60">Not set</span>}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Platform Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editableSettings.map((s) => (
              <div key={s.key}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{s.label}</label>
                {s.key === "our_mission" || s.key === "our_vision" ? (
                  <textarea
                    value={settingsData[s.key] || ""}
                    onChange={(e) => setSettingsData((prev) => ({ ...prev, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
                  />
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={settingsData[s.key] || ""}
                      onChange={(e) => setSettingsData((prev) => ({ ...prev, [s.key]: e.target.value }))}
                      placeholder={s.placeholder}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveSetting(s.key, settingsData[s.key] || "")}
                      disabled={savingField === s.key}
                      className="shrink-0"
                    >
                      {savingField === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t border-border">
              <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;
