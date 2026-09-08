import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { Badge } from "../../components/ui/badge";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, ClipboardCheck } from "lucide-react";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    api.get("/admin/reviews")
      .then((res) => setReviews(res.data.reviews || []))
      .catch(() => toast.error("Failed to load reviews."))
      .finally(() => setLoading(false));
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (filter === "reviewed") {
      list = list.filter((r) => r.status === "approved");
    } else if (filter === "non-reviewed") {
      list = list.filter((r) => r.status === "rejected" || r.status === "needs_changes");
    }

    list.sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (sortField === "project_title" || sortField === "reviewer_name" || sortField === "status") {
        va = (va || "").toLowerCase();
        vb = (vb || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [reviews, filter, sortField, sortDir]);

  const statusVariant = (status) => {
    const map = { approved: "default", rejected: "destructive", needs_changes: "secondary" };
    return map[status] || "secondary";
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reviews</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review history for project approvals.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "all", label: "All Projects" },
          { value: "reviewed", label: "Reviewed" },
          { value: "non-reviewed", label: "Non-Reviewed" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${filter === f.value ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:bg-accent"}`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} review{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No reviews found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">S.No</th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("project_title")}>
                    <span className="inline-flex items-center">Project <SortIcon field="project_title" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("reviewer_name")}>
                    <span className="inline-flex items-center">Reviewer <SortIcon field="reviewer_name" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>
                    <span className="inline-flex items-center">Status <SortIcon field="status" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                    <span className="inline-flex items-center">Date <SortIcon field="created_at" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((review, idx) => (
                  <tr key={review.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{review.project_title}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">{review.project_code}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{review.reviewer_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(review.status)}>{review.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{review.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reviews;
