import { motion } from "framer-motion";

function RecentProjects({ projects }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="mb-5 text-lg font-semibold text-foreground">Recent projects</h2>
      <div className="space-y-4">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            className="rounded-xl border border-border bg-background px-4 py-3"
          >
            <p className="font-medium text-foreground">{project.title || project}</p>
            {project.status ? <p className="text-xs text-muted-foreground">{project.status}</p> : null}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default RecentProjects;
