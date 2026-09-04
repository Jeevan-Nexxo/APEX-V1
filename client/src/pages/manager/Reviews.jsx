import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { Badge } from "../../components/ui/badge";
import { Loader2, FileText } from "lucide-react";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/manager/reviews")
      .then((response) => setReviews(response.data.reviews || []))
      .catch(() => toast.error("Failed to load reviews."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusVariant = (status) => {
    const map = { approved: "default", pending: "secondary", rejected: "destructive", needs_changes: "outline" };
    return map[status] || "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reviews</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review history and outcomes.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-card">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No reviews have been submitted yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{review.project_title || "Unknown"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{review.project_code || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{review.reviewer_name || "System"}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(review.status)}>{review.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{review.notes || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(review.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reviews;
