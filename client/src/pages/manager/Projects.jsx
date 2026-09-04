import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { Loader2, FolderOpen } from "lucide-react";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadProjects = () => {
    setLoading(true);
    api.get("/manager/projects")
      .then((response) => setProjects(response.data.projects || []))
      .catch(() => toast.error("Failed to load projects."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const handleReview = async (status) => {
    if (!reviewDialog) return;
    try {
      setReviewLoading(true);
      await api.post(`/manager/projects/${reviewDialog.id}/review`, { status, notes: reviewNotes || "Reviewed by manager." });
      toast.success(`Project ${status}.`);
      setReviewDialog(null);
      setReviewNotes("");
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  const statusVariant = (status) => {
    const map = { approved: "default", pending: "secondary", rejected: "destructive", needs_changes: "outline", draft: "outline" };
    return map[status] || "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projects</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review and manage submitted projects.</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-card">
          <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No projects to review yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-foreground">{project.title}</h2>
                    <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground font-mono">{project.project_id}</p>
                  {project.creator_name && (
                    <p className="mt-1 text-sm text-muted-foreground">By {project.creator_name}</p>
                  )}
                  {(project.categories || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {project.categories.map((c) => (
                        <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setReviewDialog(project)}>
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}

export default Projects;
