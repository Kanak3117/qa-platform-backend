import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { AppShell } from './components/layout/AppShell';
import { AdminShell } from './components/admin/AdminShell';

// Public Landing Page
import { LandingPage } from './pages/LandingPage';
import { Forbidden403 } from './pages/Forbidden403';

// Auth Pages
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { SignUp } from './pages/SignUp';

// Workspace & Feature Pages
import { Overview } from './pages/Overview';
import { Bugs } from './pages/Bugs';
import { BugDetails } from './pages/BugDetails';
import { TestExecutionPage } from './pages/TestExecution';
import { TestSuites } from './pages/TestSuites';
import { TestCases } from './pages/TestCases';
import { TestRuns } from './pages/TestRuns';
import { Reports } from './pages/Reports';
import { QATesterWorkspace } from './pages/QATesterWorkspace';
import { DeveloperWorkspace } from './pages/DeveloperWorkspace';

// Admin Console Pages
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminRoles } from './pages/admin/AdminRoles';
import { AdminCompany } from './pages/admin/AdminCompany';
import { AdminInvitations } from './pages/admin/AdminInvitations';
import { AdminAuditLog } from './pages/admin/AdminAuditLog';

const CatchAllFallback: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/workspace' : '/'} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/403" element={<Forbidden403 />} />

          {/* Protected App Shell for QA & Engineering */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/workspace" element={<Overview />} />
            <Route path="/test-suites" element={<TestSuites />} />
            <Route path="/test-cases" element={<TestCases />} />
            <Route path="/test-runs" element={<TestRuns />} />
            <Route path="/test-execution" element={<TestExecutionPage />} />
            <Route path="/test-execution/:testCaseId" element={<TestExecutionPage />} />
            <Route path="/bugs" element={<Bugs />} />
            <Route path="/bugs/:id" element={<BugDetails />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/qa-workspace"
              element={
                <RoleRoute allowedRoles={['QA_ENGINEER']} allowAdmin>
                  <QATesterWorkspace />
                </RoleRoute>
              }
            />
            <Route
              path="/developer-workspace"
              element={
                <RoleRoute allowedRoles={['DEVELOPER']} allowAdmin>
                  <DeveloperWorkspace />
                </RoleRoute>
              }
            />
          </Route>

          {/* Protected Admin Console (Guarded: Actual system_role === 'ADMIN' only) */}
          <Route
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminShell />
                </AdminRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<Navigate to="/admin/members" replace />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/company" element={<AdminCompany />} />
            <Route path="/admin/invitations" element={<AdminInvitations />} />
            <Route path="/admin/audit-log" element={<AdminAuditLog />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<CatchAllFallback />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
