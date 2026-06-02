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

function RequireTeam({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && !user.teamId) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function AppRouterInner() {
  return (
    <Routes>
      {/* Public only */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Auth required */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Auth + Team required */}
        <Route
          path="/dashboard"
          element={<RequireTeam><AppLayout><DashboardPage /></AppLayout></RequireTeam>}
        />
        <Route
          path="/projects"
          element={<RequireTeam><AppLayout><ProjectsPage /></AppLayout></RequireTeam>}
        />
        <Route
          path="/projects/:id"
          element={<RequireTeam><AppLayout><ProjectDetailPage /></AppLayout></RequireTeam>}
        />
        <Route
          path="/tasks"
          element={<RequireTeam><AppLayout><TasksPage /></AppLayout></RequireTeam>}
        />
        <Route
          path="/chat"
          element={<RequireTeam><AppLayout><ChatPage /></AppLayout></RequireTeam>}
        />
        <Route
          path="/team"
          element={<RequireTeam><AppLayout><TeamPage /></AppLayout></RequireTeam>}
        />
        <Route
          path="/assistant"
          element={<RequireTeam><AppLayout><AssistantPage /></AppLayout></RequireTeam>}
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
