import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Home, Users, Upload, X, Eye, EyeOff } from "lucide-react";

function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", role: "", qualification: "", email: "", phone: "", social_media: "{}", sort_order: 0, show_on_homepage: false });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const fileInputRef = useRef(null);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/team");
      setTeam(response.data.team || []);
    } catch (err) {
      toast.error("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeam(); }, []);

  const resetForm = () => setForm({ name: "", role: "", qualification: "", email: "", phone: "", social_media: "{}", sort_order: 0, show_on_homepage: false });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/admin/team", {
        ...form,
        sort_order: Number(form.sort_order) || 0,
      });
      toast.success("Team member added.");
      resetForm();
      await loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add team member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setPhotoLoading(true);
      const formData = new FormData();
      formData.append("photo", file);
      const response = await api.post("/admin/team/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((current) => ({ ...current, photo_url: response.data.photoUrl }));
      toast.success("Photo uploaded.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/admin/team/${deleteTarget.id}`);
      toast.success("Team member deleted.");
      setDeleteTarget(null);
      await loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete team member.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEdit = (member) => {
    setEditTarget({ ...member, photo_url: member.photo_url || "", sort_order: member.sort_order || 0 });
  };

  const handleEditSave = async () => {
    if (!editTarget.name?.trim() || !editTarget.role?.trim()) {
      toast.error("Name and role are required.");
      return;
    }
    try {
      setEditLoading(true);
      await api.put(`/admin/team/${editTarget.id}`, {
        name: editTarget.name,
        role: editTarget.role,
        qualification: editTarget.qualification || null,
        email: editTarget.email || null,
        phone: editTarget.phone || null,
        photo_url: editTarget.photo_url || null,
        social_media: editTarget.social_media ? (typeof editTarget.social_media === "string" ? JSON.parse(editTarget.social_media) : editTarget.social_media) : {},
        sort_order: Number(editTarget.sort_order) || 0,
        is_active: editTarget.is_active,
        show_on_homepage: editTarget.show_on_homepage,
      });
      toast.success("Team member updated.");
      setEditTarget(null);
      await loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update team member.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Team Members</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage the Minds Behind APEX team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Full name *" />
          <Input value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))} placeholder="Role (e.g. Frontend Developer) *" />
          <Input value={form.qualification} onChange={(e) => setForm((current) => ({ ...current, qualification: e.target.value }))} placeholder="Qualification (optional)" />
          <Input value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} placeholder="Email (optional)" type="email" />
          <Input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone (optional)" />
          <Input value={form.sort_order} onChange={(e) => setForm((current) => ({ ...current, sort_order: e.target.value }))} placeholder="Sort order" type="number" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.show_on_homepage} onChange={(e) => setForm((current) => ({ ...current, show_on_homepage: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />
            <Home className="h-4 w-4" /> Show on Homepage
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handlePhotoUpload} className="hidden" />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={photoLoading}>
            {photoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Photo
          </Button>
          {form.photo_url && (
            <div className="flex items-center gap-2">
              <img src={form.photo_url} alt="Preview" className="h-10 w-10 rounded-full object-cover" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm((current) => ({ ...current, photo_url: "" }))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Button type="submit" disabled={submitting || !form.name.trim() || !form.role.trim()}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Add Member
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : team.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No team members yet. Add one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Photo</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Qualification</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Homepage</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member, idx) => (
                  <tr key={member.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <img src={member.photo_url || "https://placehold.co/300x300"} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{member.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.role}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{member.qualification || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={member.is_active ? "default" : "secondary"}>{member.is_active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {member.show_on_homepage ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Eye className="h-3 w-3" /> On Home</span>
                      ) : (
                        <span className="text-xs text-muted-foreground"><EyeOff className="h-3 w-3 inline mr-1" />Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(member)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(member)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Team Member</AlertDialogTitle>
          </AlertDialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <Input value={editTarget.name || ""} onChange={(e) => setEditTarget((current) => ({ ...current, name: e.target.value }))} placeholder="Full name *" />
              <Input value={editTarget.role || ""} onChange={(e) => setEditTarget((current) => ({ ...current, role: e.target.value }))} placeholder="Role *" />
              <Input value={editTarget.qualification || ""} onChange={(e) => setEditTarget((current) => ({ ...current, qualification: e.target.value }))} placeholder="Qualification" />
              <Input value={editTarget.email || ""} onChange={(e) => setEditTarget((current) => ({ ...current, email: e.target.value }))} placeholder="Email" type="email" />
              <Input value={editTarget.phone || ""} onChange={(e) => setEditTarget((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone" />
              <div className="grid grid-cols-2 gap-4">
                <Input value={editTarget.sort_order || 0} onChange={(e) => setEditTarget((current) => ({ ...current, sort_order: e.target.value }))} placeholder="Sort order" type="number" />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editTarget.is_active ?? true} onChange={(e) => setEditTarget((current) => ({ ...current, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editTarget.show_on_homepage ?? false} onChange={(e) => setEditTarget((current) => ({ ...current, show_on_homepage: e.target.checked }))}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />
                    <Home className="h-4 w-4" /> On Homepage
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {editTarget.photo_url && <img src={editTarget.photo_url} alt="Preview" className="h-10 w-10 rounded-full object-cover" />}
                <span className="text-xs text-muted-foreground">Photo URL: {editTarget.photo_url || "none"}</span>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={editLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSave} disabled={editLoading || !editTarget?.name?.trim() || !editTarget?.role?.trim()}>
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Team;
