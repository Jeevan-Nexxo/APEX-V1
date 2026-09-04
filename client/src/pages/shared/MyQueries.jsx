import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, MessageCirclePlus, MessagesSquare, Send, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { createQuery, getMyQueries, getQueryThread, sendQueryFollowUp } from "../../services/queryService";

const statusVariant = (status) => {
  const map = { open: "secondary", replied: "default", closed: "outline" };
  return map[status] || "secondary";
};

const statusLabel = (status) => {
  const map = { open: "Open", replied: "Replied", closed: "Closed" };
  return map[status] || status;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function MyQueries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newLoading, setNewLoading] = useState(false);
  const [openThread, setOpenThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const data = await getMyQueries();
      setThreads(data.threads || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your queries.");
    } finally {
      setLoading(false);
    }
  }, []);

  const openThreadDetail = useCallback(async (threadId) => {
    try {
      setThreadLoading(true);
      setOpenThread({ id: threadId });
      const data = await getQueryThread(threadId);
      setOpenThread(data.thread);
      setThreads((current) =>
        current.map((t) => (t.id === Number(threadId) ? { ...t, unread_replies: 0 } : t))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load conversation.");
      setOpenThread(null);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    getMyQueries()
      .then((data) => setThreads(data.threads || []))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load your queries."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const threadParam = searchParams.get("thread");
    if (threadParam && !loading) {
      queueMicrotask(() => {
        openThreadDetail(threadParam);
        setSearchParams({}, { replace: true });
      });
    }
  }, [searchParams, loading, openThreadDetail, setSearchParams]);

  const handleCreate = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error("Please add a subject and your message.");
      return;
    }
    try {
      setNewLoading(true);
      const data = await createQuery({ subject: newSubject.trim(), message: newMessage.trim() });
      toast.success(data.message || "Message sent to APEX Admin.");
      setNewOpen(false);
      setNewSubject("");
      setNewMessage("");
      loadThreads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setNewLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || !openThread) return;
    try {
      setFollowUpLoading(true);
      await sendQueryFollowUp(openThread.id, followUp.trim());
      setFollowUp("");
      await openThreadDetail(openThread.id);
      loadThreads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setFollowUpLoading(false);
    }
  };

  const closeThreadDialog = () => {
    setOpenThread(null);
    setFollowUp("");
    loadThreads();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contact Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Raise a question or message to the APEX Admin team and track the conversation here.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <MessageCirclePlus className="mr-2 h-4 w-4" /> New Query
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-card">
            <MessagesSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No queries yet. Raise your first question to Admin.</p>
          </div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => openThreadDetail(thread.id)}
              className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-foreground">{thread.subject}</h2>
                    <Badge variant={statusVariant(thread.status)}>{statusLabel(thread.status)}</Badge>
                    {thread.unread_replies > 0 && (
                      <Badge className="text-xs">New reply</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {thread.last_message_body}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{formatDateTime(thread.last_message_at)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{thread.message_count} message{thread.message_count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <Dialog open={newOpen} onOpenChange={(open) => { if (!open) setNewOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Query to Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Brief summary of your question"
                maxLength={200}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Describe your question or message for the APEX Admin team..."
                rows={5}
                maxLength={5000}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleCreate} disabled={newLoading}>
              {newLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send to Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openThread} onOpenChange={(open) => { if (!open) closeThreadDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{openThread?.subject || "Conversation"}</DialogTitle>
          </DialogHeader>

          {threadLoading && !openThread?.messages ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={statusVariant(openThread?.status)}>{statusLabel(openThread?.status)}</Badge>
                <span>Raised {formatDateTime(openThread?.created_at)}</span>
              </div>

              <div className="space-y-3">
                {(openThread?.messages || []).map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl border p-4 ${
                      message.is_admin_reply
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className={`text-sm font-semibold ${message.is_admin_reply ? "text-primary" : "text-foreground"}`}>
                        {message.is_admin_reply ? "APEX Team" : "You"}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
                    </div>
                    <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">{message.body}</p>
                  </div>
                ))}
              </div>

              {openThread?.status === "closed" ? (
                <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  This conversation has been closed by the APEX Admin team.
                </p>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Add a follow-up message..."
                    rows={3}
                    maxLength={5000}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleFollowUp} disabled={followUpLoading || !followUp.trim()}>
                      {followUpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              <X className="mr-2 h-4 w-4" /> Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyQueries;
