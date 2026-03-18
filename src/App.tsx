import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Search } from './pages/Search';
import { ProviderProfile } from './pages/ProviderProfile';
import { Bookings } from './pages/Bookings';
import { Dashboard } from './pages/Dashboard';
import { Messages } from './pages/Messages';
import { AdminPanel } from './pages/AdminPanel';
import { ProviderSection } from './pages/ProviderSection';
import { ProviderServices } from './pages/ProviderServices';
import { Settings } from './pages/Settings';

import { ErrorBoundary } from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="auth" element={<Auth />} />
                <Route path="search" element={<Search />} />
                <Route path="provider/:id" element={<ProviderProfile />} />
                
                {/* Protected Routes */}
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="bookings" element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                } />
                <Route path="messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="admin" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="provider-section" element={
                  <ProtectedRoute>
                    <ProviderSection />
                  </ProtectedRoute>
                } />
                <Route path="provider-services" element={
                  <ProtectedRoute>
                    <ProviderServices />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
