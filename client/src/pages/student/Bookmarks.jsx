import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    api.get("/student/bookmarks").then((response) => setBookmarks(response.data.bookmarks || [])).catch(console.error);
  }, []);

  const removeBookmark = async (projectId) => {
    await api.delete(`/student/bookmarks/${projectId}`);
    setBookmarks((current) => current.filter((item) => item.id !== projectId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Bookmarks</h1>
        <p className="mt-2 text-sm text-muted-foreground">Saved projects for quick access.</p>
      </div>

      <div className="grid gap-4">
        {bookmarks.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No bookmarks yet.</div>
        ) : bookmarks.map((bookmark) => (
          <div key={bookmark.bookmark_id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">{bookmark.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{bookmark.creator_name}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/projects/${bookmark.id}`} className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-accent">View</Link>
                <button onClick={() => removeBookmark(bookmark.id)} className="rounded-xl border border-border px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Bookmarks;
