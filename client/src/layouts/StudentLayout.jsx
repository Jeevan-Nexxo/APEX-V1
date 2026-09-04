import RoleLayout from "../components/layouts/RoleLayout";

const links = [
  { to: "/student/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/student/profile", label: "Profile", icon: "👤" },
  { to: "/student/projects", label: "My Projects", icon: "📂" },
  { to: "/student/submit-project", label: "Create Project", icon: "➕" },
  { to: "/student/bookmarks", label: "Bookmarks", icon: "🔖" },
  { to: "/student/queries", label: "Queries", icon: "💬" },
  { to: "/student/notifications", label: "Notifications", icon: "🔔" },
  { to: "/student/settings", label: "Settings", icon: "⚙️" },
];

function StudentLayout() {
  return <RoleLayout brand="APEX" subtitle="Student Portal" links={links} />;
}

export default StudentLayout;
