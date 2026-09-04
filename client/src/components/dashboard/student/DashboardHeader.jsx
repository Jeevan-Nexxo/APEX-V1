import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { Home } from "lucide-react";

function DashboardHeader() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between mb-8"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Welcome, <span className="text-primary">{user?.full_name || "Student"}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{today}</p>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" /> Home
        </Button>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
          {user?.full_name?.charAt(0)}
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardHeader;
