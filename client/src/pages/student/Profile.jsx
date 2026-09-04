import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getStudentProfile, updateStudentProfile } from "../../services/profileServices";

function Profile() {
  const [profile, setProfile] = useState({ full_name: "", email: "", college: "", department: "", year_of_study: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getStudentProfile();
        if (data.success && data.profile) {
          setProfile({
            full_name: data.profile.full_name || "",
            email: data.profile.email || "",
            college: data.profile.college || "",
            department: data.profile.department || "",
            year_of_study: data.profile.year_of_study || "",
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await updateStudentProfile(profile);
      toast.success(response.message || "Profile updated successfully.");
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading profile...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Student profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit your account and academic details.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input name="full_name" value={profile.full_name} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="Full name" />
        <input name="email" value={profile.email} disabled className="h-11 rounded-xl border border-border bg-muted px-4 text-sm text-muted-foreground outline-none" placeholder="Email" />
        <input name="college" value={profile.college} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="College" />
        <input name="department" value={profile.department} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder="Department" />
        <input name="year_of_study" value={profile.year_of_study} onChange={handleChange} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 md:col-span-2" placeholder="Year of study" />
      </div>

      <button className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
        Save changes
      </button>
    </form>
  );
}

export default Profile;
