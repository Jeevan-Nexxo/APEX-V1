import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "../../services/api";
import { SERVER_URL } from "../../config/api";
import { deleteProjectFile, getProjectFiles, uploadProjectFile } from "../../services/projectFileService";
import { useAuth } from "../../context/AuthContext";

function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [contactMessage, setContactMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const isManagementView = useMemo(
    () => location.pathname.startsWith("/student/") || location.pathname.startsWith("/admin/") || location.pathname.startsWith("/manager/"),
    [location.pathname]
  );

  useEffect(() => {
    const loadProject = async () => {
      try {
        const endpoint = isManagementView ? `/project/manage/${id}` : `/project/${id}`;
        const response = await api.get(endpoint);
        if (response.data.success) {
          setProject(response.data.project);
        }

        const filesData = await getProjectFiles(id);
        if (filesData.success) setFiles(filesData.files || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, isManagementView]);

  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      const result = await deleteProjectFile(fileId);
      if (result.success) {
        setFiles((current) => current.filter((file) => file.id !== fileId));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete file.");
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadProjectFile(id, file);
      if (result.success) {
        setFiles((current) => [result.file, ...current]);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      event.target.value = "";
    }
  };

  const handleContactRequest = async () => {
    if (!contactMessage.trim()) {
      toast.error("Add a short message first.");
      return;
    }

    try {
      const response = await api.post(`/visitor/contact-requests/${id}`, { message: contactMessage });
      toast.success(response.data.message || "Contact request sent.");
      setContactMessage("");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong.");
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading project...</div>;
  if (!project) return <div className="text-sm text-destructive">Project not found.</div>;

  const canManage = user && (user.role === "admin" || project.creator_id === user.id);
  const canContact = user && user.role === "visitor";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to={isManagementView ? "/student/projects" : "/projects"} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <div className="text-sm text-muted-foreground">{project.project_id}</div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Created by {project.creator_name}</p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground uppercase tracking-wide">
            {project.status}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(project.categories || []).map((category) => (
            <span key={category.id} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              {category.name}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Problem statement</h2>
            <p className="text-sm leading-7 text-foreground">{project.problem_statement || "Not provided."}</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Solution</h2>
            <p className="text-sm leading-7 text-foreground">{project.solution || "Not provided."}</p>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</h2>
            <p className="text-sm leading-7 text-foreground">{project.description || project.abstract || "Not provided."}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <div><span className="font-medium text-foreground">Members:</span> {project.members?.length || 0}</div>
          <div><span className="font-medium text-foreground">Technologies:</span> {(project.technologies || []).join(", ") || "-"}</div>
          <div><span className="font-medium text-foreground">Links:</span> {project.github_link || project.demo_link ? "Available" : "-"}</div>
        </div>
      </section>

      {canContact ? (
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Request contact</h2>
          <textarea
            value={contactMessage}
            onChange={(event) => setContactMessage(event.target.value)}
            placeholder="Write a short message to the student team"
            className="mt-4 min-h-28 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={handleContactRequest} className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            Send request
          </button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Project files</h2>
          {canManage ? (
            <label className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
              Upload file
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {files.length === 0 ? (
            <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">No files uploaded.</div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{file.original_name}</p>
                  <p className="text-xs text-muted-foreground">{file.file_type} • {(file.file_size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`${SERVER_URL}/${file.file_path}`} target="_blank" rel="noreferrer" className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-accent">
                    View
                  </a>
                  {canManage ? (
                    <button onClick={() => handleDelete(file.id)} className="rounded-xl border border-border px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}

export default ProjectDetails;
