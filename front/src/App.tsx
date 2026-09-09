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
            colorPrimary: '#c2703d', // Terracotta primary accent
            colorBgBase: '#0f1419', // Deep night sky base
            colorTextBase: '#f5f5f0', // Warm off-white
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
            <Route path="/" element={<TouristHome />} />
            <Route path="/experiences" element={<TouristExperiencesList />} />
            <Route path="/experiences/:id" element={<TouristExperienceDetail />} />

            {/* Tourist Booking & My Bookings Routes */}
            <Route path="/booking/:experienceId" element={<TouristBookingForm />} />
            <Route path="/my-bookings" element={<TouristMyBookings />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
