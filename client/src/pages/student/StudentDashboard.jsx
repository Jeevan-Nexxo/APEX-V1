import { useEffect, useState } from "react";

import DashboardHeader from "../../components/dashboard/student/DashboardHeader";
import StatsCards from "../../components/dashboard/student/StatsCards";
import RecentProjects from "../../components/dashboard/student/RecentProjects";
import Notifications from "../../components/dashboard/student/Notifications";

import { getDashboard } from "../../services/studentService";

function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!dashboardData) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <>
      <DashboardHeader />

      <StatsCards stats={dashboardData.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RecentProjects
          projects={dashboardData.recentProjects}
        />

        <Notifications
          notifications={dashboardData.notifications}
        />
      </div>
    </>
  );
}

export default StudentDashboard;
