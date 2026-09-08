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
    api.get("/manager/overview")
      .then((response) => setData(response.data))
      .catch(() => toast.error("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  if (!data) return <div className="text-sm text-muted-foreground">Failed to load dashboard.</div>;

  const stats = [
    { label: "Projects", value: data.stats.projects },
    { label: "Approved", value: data.stats.approvedProjects },
    { label: "Pending", value: data.stats.pendingProjects },
    { label: "Students", value: data.stats.students },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Manager dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Operational overview for project review support.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" /> Home
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
