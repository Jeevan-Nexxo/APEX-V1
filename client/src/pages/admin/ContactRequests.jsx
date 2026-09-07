import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loader2, Inbox, Check, X } from "lucide-react";

function AdminContactRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/contact-requests");
      setRequests(response.data.contactRequests || []);
    } catch (err) {
      toast.error("Failed to load contact requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const review = async (id, action) => {
    const isApprove = action === "approve";
    if (!window.confirm(isApprove ? "Approve this contact request? The student will receive the visitor's contact details." : "Reject this contact request? The student will be notified.")) return;
    setBusy(id);
    try {
      await api.post(`/admin/contact-requests/${id}/${action}`);
      toast.success(isApprove ? "Contact request approved. Details shared with the student." : "Contact request rejected.");
      await loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update contact request.");
    } finally {
      setBusy(null);
    }
  };

  const statusBadge = (status) => {
    if (status === "pending") return <Badge variant="default" className="bg-primary">{status}</Badge>;
    if (status === "approved") return <Badge variant="secondary" className="bg-primary/10 text-primary">{status}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contact Requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visitors ask to contact project owners. Approve a request to share the visitor's contact details with the student.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No contact requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.project_title}</p>
                      <p className="text-xs text-muted-foreground">{r.project_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.visitor_name}</p>
                      <p className="text-xs text-muted-foreground">{r.visitor_email}</p>
                      {r.visitor_phone && <p className="text-xs text-muted-foreground">{r.visitor_phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.student_name}</p>
                      <p className="text-xs text-muted-foreground">{r.student_email}</p>
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3">
                      {r.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => review(r.id, "approve")} disabled={busy === r.id}>
                            {busy === r.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => review(r.id, "reject")} disabled={busy === r.id}>
                            <X className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reviewed by {r.reviewed_by_name || "Admin"}</span>
                      )}
                    </td>
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

export default AdminContactRequests;