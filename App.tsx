import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { DarkModeProvider } from './lib/darkModeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { RegisterRequest } from './pages/RegisterRequest';
import { UserDashboard } from './pages/UserDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { AdminUsers } from './pages/AdminUsers';
import { AdminApplications } from './pages/AdminApplications';
import { Editor } from './pages/Editor';
import { AdminDashboard } from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <HashRouter>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterRequest />} />

              {/* User protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/new"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/edit/:id"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />

              {/* Admin protected routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminApplications />
                  </ProtectedRoute>
                }
              />

              {/* Legacy routes (redirect to new paths) */}
              <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/new" element={<Navigate to="/dashboard/new" replace />} />
              <Route path="/admin/edit/:id" element={<Navigate to="/dashboard/edit/:id" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </AuthProvider>
    </DarkModeProvider>
  );
};

export default App;
