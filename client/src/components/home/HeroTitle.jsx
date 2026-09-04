import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function HeroTitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mx-auto max-w-4xl"
    >
      <div className="mb-6 inline-flex rounded-full border border-border bg-card px-4 py-1 text-sm text-muted-foreground">
        Student innovation platform
      </div>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Transform ideas into a
        <span className="text-primary"> scalable innovation pipeline</span>
      </h1>
      <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
        APEX helps students create profiles, submit projects, collaborate with teammates, and publish approved innovations for visitors, managers, and admins to review.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/register" className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
          Join APEX
        </Link>
        <Link to="/projects" className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          Explore projects
        </Link>
      </div>
    </motion.div>
  );
}

export default HeroTitle;
