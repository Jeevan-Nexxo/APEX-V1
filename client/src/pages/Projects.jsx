import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { searchProjects } from "../services/projectService";
import ProjectCard from "../components/home/ProjectCard";
import Loader from "../components/ui/Loader";

function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      setLoading(true);
      try {
        const [projectsData, categoriesData] = await Promise.all([
          searchProjects({ q: searchParams.get("q") || "", category: searchParams.get("category") || "" }),
          api.get("/categories"),
        ]);

        setProjects(projectsData.projects || []);
        setCategories(categoriesData.categories || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadFilters();
  }, [searchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    setSearchParams(params);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Browse projects</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Search approved projects, filter by category, and discover what the APEX community is building.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_220px_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, descriptions, technologies..."
            className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <button type="submit" className="h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
            Search
          </button>
        </form>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16">
          <Loader />
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card py-16 text-center"
        >
          <p className="text-lg font-medium text-foreground">No projects found</p>
          <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or category filter.</p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;
