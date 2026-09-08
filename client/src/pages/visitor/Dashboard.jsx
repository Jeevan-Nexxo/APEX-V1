import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Home } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/visitor/dashboard")
      .then((response) => setData(response.data))
      .catch(() => toast.error("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  if (!data) return <div className="text-sm text-muted-foreground">Failed to load dashboard.</div>;

  const stats = [
    { label: "Approved projects", value: data.stats.approvedProjects, icon: "✅" },
    { label: "Bookmarks", value: data.stats.bookmarks, icon: "🔖" },
    { label: "Requests", value: data.stats.contactRequests, icon: "📨" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Visitor dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Browse public projects and manage your saved items.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" /> Home
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-6">
            <div className="text-3xl">{item.icon}</div>
            <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Recent approved projects</h2>
        <div className="mt-4 space-y-3">
          {(data.recentProjects || []).map((project) => (
            <div key={project.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="font-medium text-foreground">{project.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
