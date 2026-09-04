import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../../services/api";
import CategoryCard from "./CategoryCard";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/categories", { params: { homepage: "true" } });
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <section className="bg-card/40 px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <div className="text-sm text-muted-foreground">Loading categories...</div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-card/40 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Explore by <span className="text-primary">category</span>
        </motion.h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
          Discover projects based on the topics that matter to you.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug || cat.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="h-full"
            >
              <CategoryCard title={cat.name} count={cat.project_count} iconUrl={cat.icon_path} slug={cat.slug} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
