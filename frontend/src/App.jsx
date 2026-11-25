import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RoleRoute from './components/RoleRoute';

// Pages
import LandingPage from './pages/LandingPage';
import ExplorePage from './pages/ExplorePage';
import AmenityDetailsPage from './pages/AmenityDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import UserDashboardPage from './pages/UserDashboardPage';
import ProviderDashboardPage from './pages/ProviderDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/amenities/:id" element={<AmenityDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Subscriber Route */}
              <Route
                path="/checkout"
                element={
                  <RoleRoute>
                    <CheckoutPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RoleRoute allowedRoles={['STUDENT_PROFESSIONAL', 'ADMIN']}>
                    <UserDashboardPage />
                  </RoleRoute>
                }
              />

              {/* Protected Service Provider Route */}
              <Route
                path="/provider"
                element={
                  <RoleRoute allowedRoles={['SERVICE_PROVIDER', 'ADMIN']}>
                    <ProviderDashboardPage />
                  </RoleRoute>
                }
              />

              {/* Protected Administrator Route */}
              <Route
                path="/admin"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <AdminDashboardPage />
                  </RoleRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
