import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FolderOpen } from "lucide-react";

function CategoryCard({ title, count, iconUrl, slug }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/projects?category=${encodeURIComponent(slug || title)}`);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      className="group flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`Browse ${title} projects`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 transition-all duration-300 group-hover:from-primary/25 group-hover:to-primary/10 group-hover:ring-primary/30">
        {iconUrl ? (
          <img src={iconUrl} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <FolderOpen className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 max-w-full text-center text-base font-semibold leading-snug text-foreground break-words">
        {title}
      </h3>
      <div className="mt-2 flex items-center gap-1.5 text-center">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {typeof count === "number" ? `${count} ${count === 1 ? "project" : "projects"}` : "Projects"}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>
    </motion.button>
  );
}

export default CategoryCard;
