import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ProjectPage from "./pages/ProjectPage";
import ProjectsOverview from "./pages/ProjectsOverview";
import Settings from "./pages/Settings";
import UserProfile from "./components/UserProfile";
import Meetings from "./pages/Meetings";
import Reports from "./pages/Reports";
import { ThemeProvider } from "./ThemeContext";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import SidebarLayout from "./components/SidebarLayout";
import OnboardingTour from "./components/OnboardingTour";
import TasksOverview from "./pages/TasksOverview";

function App() {
  return (
    <ThemeProvider>
      <OnboardingTour />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard/*"
            element={
              <SidebarLayout>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<ProjectsOverview />} />
                  <Route path="projects/:id" element={<ProjectPage />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="meetings" element={<Meetings />} />
                  <Route path="tasks" element={<TasksOverview />} /> 
                </Routes>
              </SidebarLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <SidebarLayout>
                <Settings />
              </SidebarLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <SidebarLayout>
                <UserProfile />
              </SidebarLayout>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
