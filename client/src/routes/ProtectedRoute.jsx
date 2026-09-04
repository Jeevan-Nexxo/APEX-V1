import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_ROUTES = {
  student: "/student/dashboard",
  visitor: "/visitor/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

const ROLE_PREFIXES = {
  student: "/student",
  visitor: "/visitor",
  manager: "/manager",
  admin: "/admin",
};

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_ROUTES[user.role] || "/"} replace />;
  }

  return children;
}

export default ProtectedRoute;
