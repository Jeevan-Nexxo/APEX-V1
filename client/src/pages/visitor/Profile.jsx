import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";

function Profile() {
  const [profile, setProfile] = useState({ full_name: "", email: "", phone: "", organization: "", purpose: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/visitor/profile").then((response) => {
      const data = response.data.profile;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          organization: data.organization || "",
          purpose: data.purpose || "",
        });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await api.put("/visitor/profile", profile);
    toast.success(response.data.message || "Profile updated successfully.");
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading profile...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Visitor profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit your contact details and purpose.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input name="full_name" value={profile.full_name} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="Full name" />
        <input name="email" value={profile.email} disabled className="h-11 rounded-xl border border-border bg-muted px-4 text-sm text-muted-foreground outline-none" placeholder="Email" />
        <input name="phone" value={profile.phone} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="Phone" />
        <input name="organization" value={profile.organization} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="Organization" />
        <input name="purpose" value={profile.purpose} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 md:col-span-2" placeholder="Purpose" />
      </div>

      <button className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
        Save changes
      </button>
    </form>
  );
}

export default Profile;
