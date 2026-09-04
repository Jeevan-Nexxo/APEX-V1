import { useEffect, useState } from "react";
import api from "../../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/visitor/notifications").then((response) => setNotifications(response.data.notifications || [])).catch(console.error);
  }, []);

  const markRead = async (id) => {
    await api.patch(`/visitor/notifications/${id}/read`);
    setNotifications((current) => current.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await api.patch("/visitor/notifications/read-all");
    setNotifications((current) => current.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">Contact request updates and account messages.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No notifications yet.</div>
        ) : notifications.map((notification) => (
          <div key={notification.id} className={`rounded-2xl border border-border p-5 ${notification.is_read ? "bg-card" : "bg-accent"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">{notification.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
              </div>
              {!notification.is_read && (
                <button onClick={() => markRead(notification.id)} className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-background">
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
