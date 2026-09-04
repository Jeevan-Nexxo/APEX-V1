import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function ProjectCard({ project }) {
  const categories = Array.isArray(project?.categories) ? project.categories : [];

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-sm"
    >
      <div className="relative">
        <div className="flex aspect-[16/10] items-center justify-center bg-muted text-sm text-muted-foreground">
          {categories[0]?.name || "Project"}
        </div>
        {categories[0] ? (
          <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            {categories[0].name}
          </span>
        ) : null}
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{project?.title || "Project title"}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {project?.description || project?.abstract || project?.problem_statement || "Approved project summary goes here."}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{project?.creator_name || "Student creator"}</span>
          <Link to={`/projects/${project?.id}`} className="font-medium text-primary hover:underline">
            View details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectCard;
