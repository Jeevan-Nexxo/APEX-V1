import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, Star, ExternalLink, FolderOpen, Home } from "lucide-react";

function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [featuredDialog, setFeaturedDialog] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/projects");
      setProjects(res.data.projects || []);
    } catch (err) {
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const allCategories = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => (p.categories || []).forEach((c) => set.add(c.name)));
    return Array.from(set).sort();
  }, [projects]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (categoryFilter) {
      list = list.filter((p) => (p.categories || []).some((c) => c.name === categoryFilter));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.project_id?.toLowerCase().includes(q) ||
          p.creator_name?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (sortField === "title" || sortField === "creator_name" || sortField === "status") {
        va = (va || "").toLowerCase();
        vb = (vb || "").toLowerCase();
      }
      if (sortField === "category") {
        va = (a.categories?.[0]?.name || "").toLowerCase();
        vb = (b.categories?.[0]?.name || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [projects, statusFilter, categoryFilter, search, sortField, sortDir]);

  const statusVariant = (status) => {
    const map = { approved: "default", pending: "secondary", rejected: "destructive", needs_changes: "outline", draft: "outline" };
    return map[status] || "secondary";
  };

  const toggleFeatured = async () => {
    if (!featuredDialog) return;
    try {
      setFeaturedLoading(true);
      await api.patch(`/admin/projects/${featuredDialog.id}/featured`, { is_featured: !featuredDialog.is_featured });
      toast.success(`Project ${featuredDialog.is_featured ? "removed from" : "added to"} featured.`);
      setFeaturedDialog(null);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update featured status.");
    } finally {
      setFeaturedLoading(false);
    }
  };

  const handleReview = async (status) => {
    if (!reviewDialog) return;
    try {
      setReviewLoading(true);
      await api.post(`/admin/projects/${reviewDialog.id}/review`, { status, notes: reviewNotes || "Reviewed from admin panel." });
      toast.success(`Project ${status}.`);
      setReviewDialog(null);
      setReviewNotes("");
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review project.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/admin/projects/${deleteDialog.id}`);
      toast.success("Project deleted successfully.");
      setDeleteDialog(null);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete project.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">Approve, reject, feature, and inspect submitted projects.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? "s" : ""}
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" /> Home
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex gap-2 flex-1"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ID, or creator..."
              className="pl-9"
            />
          </div>
        </form>
        <div className="flex gap-2 flex-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-xl border border-border bg-background px-3 text-sm">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_changes">Needs Changes</option>
            <option value="draft">Draft</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 rounded-xl border border-border bg-background px-3 text-sm">
            <option value="">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No projects found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">S.No</th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("title")}>
                    <span className="inline-flex items-center">Project Title <SortIcon field="title" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("category")}>
                    <span className="inline-flex items-center">Category <SortIcon field="category" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>
                    <span className="inline-flex items-center">Status <SortIcon field="status" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("creator_name")}>
                    <span className="inline-flex items-center">Student/Team <SortIcon field="creator_name" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, idx) => (
                  <tr key={project.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{project.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">{project.project_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(project.categories || []).slice(0, 2).map((c) => (
                          <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                        ))}
                        {(project.categories || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">+{project.categories.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{project.creator_name || "Unknown"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setFeaturedDialog(project)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${project.is_featured ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        <Star className={`h-3 w-3 ${project.is_featured ? "fill-primary" : ""}`} />
                        {project.is_featured ? "Featured" : "Feature"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setReviewDialog(project)} className="text-xs">
                          Review
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog(project)}>
                          Delete
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

      <Dialog open={!!featuredDialog} onOpenChange={(open) => { if (!open) setFeaturedDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{featuredDialog?.is_featured ? "Remove from Featured?" : "Add to Featured?"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {featuredDialog?.is_featured
              ? `Remove "${featuredDialog?.title}" from the Featured Innovations on the homepage?`
              : `Feature "${featuredDialog?.title}" on the homepage as a Featured Innovation?`
            }
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={toggleFeatured} disabled={featuredLoading}>
              {featuredLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {featuredDialog?.is_featured ? "Remove" : "Feature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewDialog} onOpenChange={(open) => { if (!open) { setReviewDialog(null); setReviewNotes(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">{reviewDialog?.title}</p>
              <p className="text-xs text-muted-foreground font-mono">{reviewDialog?.project_id}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Review Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Optional review notes..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleReview("rejected")} disabled={reviewLoading}>
              Reject
            </Button>
            <Button variant="outline" onClick={() => handleReview("needs_changes")} disabled={reviewLoading}>
              Needs Changes
            </Button>
            <Button onClick={() => handleReview("approved")} disabled={reviewLoading}>
              {reviewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteDialog?.title}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Projects;
