import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getStudentProjects, deleteProject, updateProject } from "../../services/projectService";

function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const data = await getStudentProjects();
      if (data.success) setProjects(data.projects || []);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load projects.");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const data = await deleteProject(id);
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        toast.success("Project deleted.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete project.");
    }
  };

  const handleSubmitDraft = async (id) => {
    if (!window.confirm("Submit this draft for review? It will become Pending and visible to reviewers.")) return;
    try {
      const data = await updateProject(id, {
        title: projects.find((p) => p.id === id)?.title || "",
        categories: (projects.find((p) => p.id === id)?.categories || []).map((c) => c.name),
      });
      if (data.success) {
        toast.success("Project submitted for review.");
        fetchProjects();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to submit project.");
    }
  };

  const statusBadge = (status) => {
    const styles = {
      draft: "bg-muted text-muted-foreground",
      pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      needs_changes: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return styles[status] || styles.pending;
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading projects...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-foreground">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">View and manage your submitted projects.</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">No projects found</h2>
          <p className="mt-3 text-sm text-muted-foreground">Submit your first project to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-foreground">{project.title}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(project.status)}`}>
                      {project.status === "needs_changes" ? "Needs Changes" : project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Project ID:</span> {project.project_id}</p>
                  <p className="mt-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Categories:</span> {Array.isArray(project.categories) ? project.categories.map((category) => category.name).join(", ") : project.categories}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Created: {project.created_at ? new Date(project.created_at).toLocaleDateString() : "-"}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => navigate(`/student/project/${project.id}`)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent">View</button>
                <button onClick={() => navigate(`/student/edit-project/${project.id}`)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Edit</button>
                {project.status === "draft" && (
                  <button onClick={() => handleSubmitDraft(project.id)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Submit for review</button>
                )}
                {project.status === "needs_changes" && (
                  <button onClick={() => navigate(`/student/edit-project/${project.id}`)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Revise & Resubmit</button>
                )}
                <button onClick={() => handleDelete(project.id)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default MyProjects;
