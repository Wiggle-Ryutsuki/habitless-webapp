import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { HabitCalendarPage } from './pages/HabitCalendarPage.js';
import { HabitsDirectoryPage } from './pages/HabitsDirectoryPage.js';
import { HabitStatsPage } from './pages/HabitStatsPage.js';
import { ManagerPage } from './pages/ManagerPage.js';
import { ChallengeInvitationPage } from './pages/ChallengeInvitationPage.js';
import { ChallengesHubPage } from './pages/ChallengesHubPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/challenges/:id" element={<ChallengeInvitationPage />} />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <HabitCalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT', 'PROGRAM_MANAGER']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/habits"
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <HabitsDirectoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/habits/:id/stats"
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <HabitStatsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/challenges"
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <ChallengesHubPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['PROGRAM_MANAGER']}>
                <ManagerPage />
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

