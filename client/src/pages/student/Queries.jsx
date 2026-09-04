import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Loader2, MessageSquare, Plus, Inbox, ChevronLeft } from "lucide-react";

function Queries() {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const rolePrefix = user?.role === "visitor" ? "visitor" : "student";

  const loadQueries = async () => {
    try {
      setLoading(true);
      const response = await api.get("/queries/mine");
      setQueries(response.data.queries || []);
    } catch (err) {
      toast.error("Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueries(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.post("/queries", form);
      setQueries((prev) => [response.data.query, ...prev]);
      setShowForm(false);
      setForm({ subject: "", message: "" });
      toast.success("Query submitted. Admin will reply soon.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit query.");
    } finally {
      setSubmitting(false);
    }
  };

  const openQuery = async (q) => {
    try {
      const response = await api.get(`/queries/${q.id}`);
      setSelected(response.data.query);
    } catch (err) {
      toast.error("Failed to load query.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Queries</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask a question and one of our admins will reply. You can raise up to 5 queries per day.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? <ChevronLeft className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Back" : "New Query"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <Input
            value={form.subject}
            onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
            placeholder="Subject (e.g., How do I add team members?)"
            maxLength={200}
          />
          <Textarea
            value={form.message}
            onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
            placeholder="Write your query in detail..."
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Query
            </Button>
          </div>
        </form>
      )}

      {selected ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to list
          </button>

          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-semibold text-foreground">{selected.subject}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> From: {selected.sender_name}
              </span>
              <span>
                {new Date(selected.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <Badge variant={selected.reply ? "secondary" : "default"} className={selected.reply ? "bg-primary/10 text-primary" : ""}>
                {selected.reply ? "Answered" : "Awaiting reply"}
              </Badge>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</h3>
            <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {selected.message}
            </div>
          </div>

          {selected.reply ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Admin Reply</h3>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {selected.reply}
              </div>
              {selected.replied_at && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Replied by {selected.replied_by_name || "Admin"} on{" "}
                  {new Date(selected.replied_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : queries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No queries yet. Click "New Query" to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {queries.map((q) => (
                <button
                  key={q.id}
                  onClick={() => openQuery(q)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">{q.subject}</p>
                      {!q.reply && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" title="Unanswered" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{q.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={q.reply ? "secondary" : "default"} className={q.reply ? "bg-primary/10 text-primary" : ""}>
                      {q.reply ? "Answered" : "Pending"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Queries;
