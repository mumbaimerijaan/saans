import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { NotificationDrawer } from './components/NotificationDrawer';

import { Home } from './pages/Home';
import { AirQualityCentre } from './pages/AirQualityCentre';
import { GetHelp } from './pages/GetHelp';
import { EquipmentLibrary } from './pages/EquipmentLibrary';
import { DiyLab } from './pages/DiyLab';
import { Facilities } from './pages/Facilities';
import { CommunityReports } from './pages/CommunityReports';
import { AiAssistant } from './pages/AiAssistant';
import { Dashboard } from './pages/Dashboard';
import { SystemStatus } from './pages/SystemStatus';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

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
                <Navbar />
                <NotificationDrawer />
                <main className="flex-1">
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
