import { useEffect, useState } from "react";
import api from "../../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/student/notifications").then((response) => setNotifications(response.data.notifications || [])).catch(console.error);
  }, []);

  const markRead = async (id) => {
    await api.patch(`/student/notifications/${id}/read`);
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, is_read: true } : notification));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">Project updates, approval notices, and contact requests.</p>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No notifications yet.</div>
        ) : notifications.map((notification) => (
          <div key={notification.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">{notification.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
              </div>
              {!notification.is_read ? (
                <button onClick={() => markRead(notification.id)} className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-accent">
                  Mark read
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
