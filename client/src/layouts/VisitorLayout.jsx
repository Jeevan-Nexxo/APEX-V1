import RoleLayout from "../components/layouts/RoleLayout";

const links = [
  { to: "/visitor/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/visitor/explore", label: "Explore", icon: "🔍" },
  { to: "/visitor/bookmarks", label: "Bookmarks", icon: "🔖" },
  { to: "/visitor/profile", label: "Profile", icon: "👤" },
  { to: "/visitor/queries", label: "Queries", icon: "💬" },
  { to: "/visitor/notifications", label: "Notifications", icon: "🔔" },
  { to: "/visitor/settings", label: "Settings", icon: "⚙️" },
];

function VisitorLayout() {
  return <RoleLayout brand="APEX" subtitle="Visitor Portal" links={links} />;
}

export default VisitorLayout;
