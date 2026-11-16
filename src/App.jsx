import React, { useState } from 'react';
import AuthScreen from './pages/auth/AuthScreen';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import Marketplace from './pages/customer/Marketplace';
import OrderTracking from './pages/customer/OrderTracking';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  const [currentView, setCurrentView] = useState('auth'); // 'auth', 'farmer', 'market', 'tracking', 'admin'

  return (
    <AuthProvider>
      <div>
        {currentView === 'auth' && <AuthScreen onNavigate={setCurrentView} />}
        {currentView === 'farmer' && <FarmerDashboard onNavigate={setCurrentView} />}
        {currentView === 'market' && <Marketplace onNavigate={setCurrentView} />}
        {currentView === 'tracking' && <OrderTracking onNavigate={setCurrentView} />}
        {currentView === 'admin' && <AdminDashboard onNavigate={setCurrentView} />}
      </div>
    </AuthProvider>
  );
}