import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const EMOJI_ICONS = {
  "registration": "📝",
  "email": "📧",
  "login": "🔐",
  "projects": "📂",
  "files": "📁",
  "categories": "🏷️",
  "review": "✅",
  "browse": "🔍",
  "queries": "💬",
};

function HelpCenter() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.get("/faq");
        setCategories(response.data.categories || []);
      } catch (err) {
        toast.error("Failed to load help content.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleItem = (id) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: (cat.items || []).filter(
        (item) =>
          item.question.toLowerCase().includes(search.toLowerCase()) ||
          item.answer.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Help <span className="text-primary">Center</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Everything you need to know about the APEX Innovation Platform — registration, projects, reviews, queries, and more.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for answers..."
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Still need help?</span>
            <button
              onClick={() => navigate("/contact")}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Contact us
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? `No results found for "${search}". Try a different search term.` : "Help content is being prepared. Please check back soon."}
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((cat) => (
              <section key={cat.id}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                    {EMOJI_ICONS[cat.title.toLowerCase().replace(/[^a-z]/g, "")] || "❓"}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{cat.title}</h2>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
                      >
                        <span className="font-medium text-foreground">{item.question}</span>
                        <span
                          className={`text-primary transition-transform duration-200 ${openItems[item.id] ? "rotate-180" : ""}`}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </button>
                      {openItems[item.id] && (
                        <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HelpCenter;
