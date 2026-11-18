import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthScreen from './pages/auth/AuthScreen';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import Marketplace from './pages/customer/Marketplace';
import OrderTracking from './pages/customer/OrderTracking';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route wrapper based on user role
function RoleRedirect() {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4fbf7] flex items-center justify-center text-emerald-800 font-bold text-sm">
        Loading CropConnect...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const role = userData?.role || 'customer';
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'farmer') return <Navigate to="/farmer" replace />;
  return <Navigate to="/market" replace />;
}

// Navigational bridge for components that accept onNavigate prop
function RoutedView({ Component, ...rest }) {
  const navigate = useNavigate();

  const handleNavigate = (view, extra) => {
    switch (view) {
      case 'auth':
        navigate('/auth');
        break;
      case 'farmer':
        navigate('/farmer');
        break;
      case 'market':
        navigate('/market');
        break;
      case 'tracking':
        if (extra) navigate(`/tracking/${extra}`);
        else navigate('/tracking');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate(`/${view}`);
    }
  };

  return <Component onNavigate={handleNavigate} {...rest} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/auth" element={<RoutedView Component={AuthScreen} />} />
          <Route path="/farmer" element={<RoutedView Component={FarmerDashboard} />} />
          <Route path="/market" element={<RoutedView Component={Marketplace} />} />
          <Route path="/tracking" element={<RoutedView Component={OrderTracking} />} />
          <Route path="/tracking/:orderId" element={<RoutedView Component={OrderTracking} />} />
          <Route path="/admin" element={<RoutedView Component={AdminDashboard} />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}