import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { NotificationDrawer } from './components/NotificationDrawer';

// Lazy-loaded page components for optimal bundle splitting and fast initial page loads
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const AirQualityCentre = React.lazy(() => import('./pages/AirQualityCentre').then(m => ({ default: m.AirQualityCentre })));
const GetHelp = React.lazy(() => import('./pages/GetHelp').then(m => ({ default: m.GetHelp })));
const EquipmentLibrary = React.lazy(() => import('./pages/EquipmentLibrary').then(m => ({ default: m.EquipmentLibrary })));
const DiyLab = React.lazy(() => import('./pages/DiyLab').then(m => ({ default: m.DiyLab })));
const Facilities = React.lazy(() => import('./pages/Facilities').then(m => ({ default: m.Facilities })));
const CommunityReports = React.lazy(() => import('./pages/CommunityReports').then(m => ({ default: m.CommunityReports })));
const AiAssistant = React.lazy(() => import('./pages/AiAssistant').then(m => ({ default: m.AiAssistant })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SystemStatus = React.lazy(() => import('./pages/SystemStatus').then(m => ({ default: m.SystemStatus })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));

const RouteLoading: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3" role="status" aria-label="Loading page">
    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
    <span className="text-xs font-medium text-slate-400">Loading SAANS view...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <div className="flex flex-col min-h-screen bg-[#080c0e] text-slate-100 selection:bg-teal-500 selection:text-white">
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-500 focus:text-slate-950 focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Skip to main content
                </a>
                <Navbar />
                <NotificationDrawer />
                <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
                  <Suspense fallback={<RouteLoading />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/air-quality" element={<AirQualityCentre />} />
                      <Route path="/get-help" element={<GetHelp />} />
                      <Route path="/equipment" element={<EquipmentLibrary />} />
                      <Route path="/diy-lab" element={<DiyLab />} />
                      <Route path="/facilities" element={<Facilities />} />
                      <Route path="/community-reports" element={<CommunityReports />} />
                      <Route path="/ai-assistant" element={<AiAssistant />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/system-status" element={<SystemStatus />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
