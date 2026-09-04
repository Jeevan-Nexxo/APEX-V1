import RoleLayout from "../components/layouts/RoleLayout";

const links = [
  { to: "/manager/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/manager/projects", label: "Projects", icon: "📂" },
  { to: "/manager/reviews", label: "Reviews", icon: "✅" },
  { to: "/manager/team", label: "Team", icon: "👥" },
];

function ManagerLayout() {
  return <RoleLayout brand="APEX" subtitle="Manager Panel" links={links} />;
}

export default ManagerLayout;
