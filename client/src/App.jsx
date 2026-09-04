import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import HelpCenter from "./pages/HelpCenter";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import SubmitProject from "./pages/student/SubmitProject";
import MyProjects from "./pages/student/MyProjects";
import ProjectDetails from "./pages/student/ProjectDetails";
import EditProject from "./pages/student/EditProject";
import StudentProfile from "./pages/student/Profile";
import StudentBookmarks from "./pages/student/Bookmarks";
import StudentNotifications from "./pages/student/Notifications";
import StudentSettings from "./pages/student/Settings";
import StudentQueries from "./pages/student/Queries";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminProjects from "./pages/admin/Projects";
import AdminReviews from "./pages/admin/Reviews";
import AdminCategories from "./pages/admin/Categories";
import AdminTeam from "./pages/admin/Team";
import AdminSettings from "./pages/admin/Settings";
import AdminQueries from "./pages/admin/Queries";
import AdminFaq from "./pages/admin/Faq";

import ManagerLayout from "./layouts/ManagerLayout";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerProjects from "./pages/manager/Projects";
import ManagerReviews from "./pages/manager/Reviews";
import ManagerTeam from "./pages/manager/Team";

import VisitorLayout from "./layouts/VisitorLayout";
import VisitorDashboard from "./pages/visitor/Dashboard";
import VisitorExplore from "./pages/visitor/Explore";
import VisitorBookmarks from "./pages/visitor/Bookmarks";
import VisitorProfile from "./pages/visitor/Profile";
import VisitorNotifications from "./pages/visitor/Notifications";
import VisitorSettings from "./pages/visitor/Settings";
import VisitorQueries from "./pages/visitor/Queries";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/student" element={<ProtectedRoute allowedRoles={["student", "admin"]}><StudentLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="submit-project" element={<SubmitProject />} />
        <Route path="projects" element={<MyProjects />} />
        <Route path="project/:id" element={<ProjectDetails />} />
        <Route path="edit-project/:id" element={<EditProject />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="bookmarks" element={<StudentBookmarks />} />
        <Route path="queries" element={<StudentQueries />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="queries" element={<AdminQueries />} />
        <Route path="faq" element={<AdminFaq />} />
        <Route path="team" element={<AdminTeam />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/manager" element={<ProtectedRoute allowedRoles={["manager", "admin"]}><ManagerLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="projects" element={<ManagerProjects />} />
        <Route path="reviews" element={<ManagerReviews />} />
        <Route path="team" element={<ManagerTeam />} />
      </Route>

      <Route path="/visitor" element={<ProtectedRoute allowedRoles={["visitor", "admin"]}><VisitorLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<VisitorDashboard />} />
        <Route path="explore" element={<VisitorExplore />} />
        <Route path="bookmarks" element={<VisitorBookmarks />} />
        <Route path="queries" element={<VisitorQueries />} />
        <Route path="profile" element={<VisitorProfile />} />
        <Route path="notifications" element={<VisitorNotifications />} />
        <Route path="settings" element={<VisitorSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
