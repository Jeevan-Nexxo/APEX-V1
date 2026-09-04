import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/manager/notifications")
      .then((response) => setNotifications(response.data.notifications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openNotification = async (notification) => {
    try {
      if (!notification.is_read) {
        await api.patch(`/manager/notifications/${notification.id}/read`);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
        );
      }
    } catch (error) {
      console.error(error);
    }
    if (notification.link_url) {
      navigate(`/${notification.link_url.replace(/^\/+/, "")}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review updates and query replies. Click a notification to open it.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No notifications yet.</div>
        ) : notifications.map((notification) => (
          <button
            key={notification.id}
            onClick={() => openNotification(notification)}
            className={`w-full text-left rounded-2xl border border-border p-5 transition-colors ${notification.is_read ? "bg-card hover:bg-muted/30" : "bg-accent hover:bg-accent/80"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground">{notification.title}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{notification.message}</p>
              </div>
              {!notification.is_read && (
                <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">New</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
