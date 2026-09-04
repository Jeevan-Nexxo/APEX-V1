import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Loader2, Inbox, ChevronLeft, Send, Trash2 } from "lucide-react";

function AdminQueries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/queries");
      setQueries(response.data.queries || []);
    } catch (err) {
      toast.error("Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueries(); }, []);

  const openQuery = async (q) => {
    try {
      const response = await api.get(`/queries/${q.id}`);
      setSelected(response.data.query);
      setReplyText("");
    } catch (err) {
      toast.error("Failed to load query.");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Reply content is required.");
      return;
    }
    try {
      setReplying(true);
      await api.post(`/admin/queries/${selected.id}/reply`, { reply: replyText });
      toast.success("Reply sent.");
      setReplyText("");
      setSelected(null);
      await loadQueries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/admin/queries/${selected.id}`);
      toast.success("Query deleted.");
      setSelected(null);
      await loadQueries();
    } catch (err) {
      toast.error("Failed to delete query.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Queries</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage user queries. Each query can be answered once.
        </p>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back to list
            </button>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>

          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-semibold text-foreground">{selected.subject}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                From: <span className="font-medium text-foreground">{selected.sender_name}</span> ({selected.sender_email})
              </span>
              <span className="text-primary-foreground/70">Role: {selected.sender_role}</span>
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
            <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {selected.message}
            </div>
          </div>

          {selected.reply ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Admin Reply</h3>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed whitespace-pre-wrap">
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
          ) : (
            <form onSubmit={handleReply} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reply to this query</h3>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={replying || !replyText.trim()}>
                  {replying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Reply
                </Button>
              </div>
            </form>
          )}
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
              <p className="text-sm text-muted-foreground">No queries from users yet.</p>
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
                    <span className="text-xs text-muted-foreground">{q.sender_name}</span>
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

export default AdminQueries;
