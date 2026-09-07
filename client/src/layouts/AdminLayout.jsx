import RoleLayout from "../components/layouts/RoleLayout";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/projects", label: "Projects", icon: "📂" },
  { to: "/admin/reviews", label: "Reviews", icon: "✅" },
  { to: "/admin/categories", label: "Categories", icon: "🏷️" },
  { to: "/admin/queries", label: "Queries", icon: "💬" },
  { to: "/admin/contact-requests", label: "Contacts", icon: "📨" },
  { to: "/admin/faq", label: "Help Center", icon: "❓" },
  { to: "/admin/team", label: "Team", icon: "🧠" },
  { to: "/admin/settings", label: "Settings", icon: "⚙️" },
];

function AdminLayout() {
  return <RoleLayout brand="APEX" subtitle="Admin Panel" links={links} />;
}

export default AdminLayout;
