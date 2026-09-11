import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import Login from './pages/Login';
import GuideDashboard from './pages/GuideDashboard';
import TouristHome from './pages/TouristHome';
import TouristExperiencesList from './pages/TouristExperiencesList';
import TouristExperienceDetail from './pages/TouristExperienceDetail';
import TouristBookingForm from './pages/TouristBookingForm';
import TouristMyBookings from './pages/TouristMyBookings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#c2703d',
            colorBgBase: '#0f1419',
            colorTextBase: '#f5f5f0',
            borderRadius: 12,
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <Routes>
            {/* Universal Login Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/guide/login" element={<Login />} />

            {/* Guide Dashboard Route */}
            <Route path="/guide/dashboard" element={<GuideDashboard />} />

            {/* Tourist Catalog & List Routes */}
            {/* 1-usul: '/' ga kirganda to'g'ridan-to'g'ri login-ga yo'naltiramiz */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/home" element={<TouristHome />} /> {/* Agar TouristHome ham kerak bo'lsa */}
            <Route path="/experiences" element={<TouristExperiencesList />} />
            <Route path="/experiences/:id" element={<TouristExperienceDetail />} />

            {/* Tourist Booking & My Bookings Routes */}
            <Route path="/booking/:experienceId" element={<TouristBookingForm />} />
            <Route path="/my-bookings" element={<TouristMyBookings />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;