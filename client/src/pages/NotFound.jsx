import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center">
      <h1 className="text-4xl font-semibold text-foreground">404</h1>
      <p className="mt-3 text-sm text-muted-foreground">The page you requested does not exist.</p>
      <Link to="/" className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
        Go home
      </Link>
    </div>
  );
}

export default NotFound;
