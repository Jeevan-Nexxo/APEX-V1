import { motion } from "framer-motion";
import ProjectForm from "../../components/project/ProjectForm";

function SubmitProject() {
  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-3xl font-semibold tracking-tight text-foreground"
      >
        Create new project
      </motion.h1>
      <ProjectForm />
    </div>
  );
}

export default SubmitProject;
