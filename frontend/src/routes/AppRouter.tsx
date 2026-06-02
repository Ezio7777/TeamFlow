import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import TasksPage from '@/pages/TasksPage';
import ChatPage from '@/pages/ChatPage';
import TeamPage from '@/pages/TeamPage';
import AssistantPage from '@/pages/AssistantPage';
import { useAuth } from '@/contexts/AuthContext';

function TeamGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user && !user.teamId) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected — no team required */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected — team required */}
        <Route
          element={
            <TeamGuard>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:id" element={<ProjectDetailPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="assistant" element={<AssistantPage />} />
                </Routes>
              </AppLayout>
            </TeamGuard>
          }
        >
          <Route path="/dashboard" element={null} />
          <Route path="/projects" element={null} />
          <Route path="/projects/:id" element={null} />
          <Route path="/tasks" element={null} />
          <Route path="/chat" element={null} />
          <Route path="/team" element={null} />
          <Route path="/assistant" element={null} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
