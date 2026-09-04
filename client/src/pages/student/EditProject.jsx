import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProjectForm from "../../components/project/ProjectForm";
import { getProjectForManagement } from "../../services/projectService";

function EditProject() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectForManagement(id)
      .then((data) => { setProject(data.project); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading project...</div>;
  if (!project) return <div className="p-8 text-sm text-destructive">Project not found.</div>;

  const statusInfo = {
    draft: { label: "Draft", color: "bg-muted text-muted-foreground", hint: "This project is saved as a draft. Submit it for review when ready." },
    pending: { label: "Pending Review", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", hint: "This project is under review. Editing will resubmit it." },
    needs_changes: { label: "Needs Changes", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", hint: "Please review the feedback below, make changes, and submit for review." },
    approved: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", hint: "" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", hint: "" },
  };

  const info = statusInfo[project.status] || statusInfo.pending;

  return (
    <div className="p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-3xl font-semibold tracking-tight text-foreground">Edit project</motion.h1>

      <div className="mb-6 flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${info.color}`}>{info.label}</span>
        {info.hint && <span className="text-sm text-muted-foreground">{info.hint}</span>}
      </div>

      {project.status === "needs_changes" && project.review_notes && (
        <div className="mb-6 rounded-2xl border border-yellow-300/50 bg-yellow-50/50 dark:border-yellow-600/30 dark:bg-yellow-900/10 p-5">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Reviewer Feedback</p>
          <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">{project.review_notes}</p>
        </div>
      )}

      {project.status === "rejected" && project.review_notes && (
        <div className="mb-6 rounded-2xl border border-red-300/50 bg-red-50/50 dark:border-red-600/30 dark:bg-red-900/10 p-5">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">Reviewer Feedback</p>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">{project.review_notes}</p>
        </div>
      )}

      <ProjectForm editMode={true} projectData={project} />
    </div>
  );
}

export default EditProject;
