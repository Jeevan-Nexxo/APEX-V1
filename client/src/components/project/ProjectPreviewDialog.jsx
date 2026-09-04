import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ExternalLink, Users, FileText } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
};

const statusVariant = (status) => {
  const map = { approved: "default", pending: "secondary", rejected: "destructive", needs_changes: "outline", draft: "outline" };
  return map[status] || "secondary";
};

function ProjectPreviewDialog({ project, open, onOpenChange }) {
  if (!project) return null;

  const technologies = toList(project.technologies);
  const tags = toList(project.tags);
  const members = Array.isArray(project.members) ? project.members : [];
  const categories = Array.isArray(project.categories) ? project.categories : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{project.title}</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{project.project_id}</span>
            {" · "}
            {project.creator_name || "Unknown creator"}
            {project.creator_email ? ` (${project.creator_email})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
            {project.is_featured && <Badge className="text-xs">Featured</Badge>}
            <span className="text-xs text-muted-foreground">Submitted {formatDateTime(project.created_at)}</span>
          </div>

          {categories.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-foreground">Categories</h3>
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <Badge key={category.id || category.name} variant="outline" className="text-xs">{category.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {(project.abstract || project.description) && (
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-foreground">Overview</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {project.abstract || project.description}
              </p>
            </div>
          )}

          {project.problem_statement && (
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-foreground">Problem Statement</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{project.problem_statement}</p>
            </div>
          )}

          {project.solution && (
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-foreground">Proposed Solution</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{project.solution}</p>
            </div>
          )}

          {(technologies.length > 0 || tags.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {technologies.length > 0 && (
                <div>
                  <h3 className="mb-1.5 text-sm font-medium text-foreground">Technologies</h3>
                  <div className="flex flex-wrap gap-1">
                    {technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {tags.length > 0 && (
                <div>
                  <h3 className="mb-1.5 text-sm font-medium text-foreground">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {members.length > 0 && (
            <div>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Users className="h-4 w-4" /> Team Members
              </h3>
              <ul className="space-y-1">
                {members.map((member) => (
                  <li key={member.id || member.full_name} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{member.full_name}</span>
                    {member.member_role ? ` — ${member.member_role}` : ""}
                    {member.email ? ` · ${member.email}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(project.github_link || project.demo_link) && (
            <div className="flex flex-wrap gap-3">
              {project.github_link && (
                <a href={project.github_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" /> GitHub Repository
                </a>
              )}
              {project.demo_link && (
                <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" /> Live Demo
                </a>
              )}
            </div>
          )}

          {typeof project.file_count === "number" && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> {project.file_count} attached file{project.file_count !== 1 ? "s" : ""}
            </p>
          )}

          {(project.review_notes || project.reviewer_name || project.reviewed_at) && (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="text-sm font-medium text-foreground">Review</h3>
              {project.review_notes && (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{project.review_notes}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {project.reviewer_name ? `Reviewed by ${project.reviewer_name}${project.reviewer_role ? ` (${project.reviewer_role})` : ""}` : "Review details unavailable"}
                {project.reviewed_at ? ` · ${formatDateTime(project.reviewed_at)}` : ""}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectPreviewDialog;
