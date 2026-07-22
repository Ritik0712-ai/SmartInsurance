import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomerListPage from './pages/customer/CustomerListPage';
import CustomerDetailPage from './pages/customer/CustomerDetailPage';
import CustomerCreatePage from './pages/customer/CustomerCreatePage';
import PolicyListPage from './pages/policy/PolicyListPage';
import PolicyDetailPage from './pages/policy/PolicyDetailPage';
import PolicyCreatePage from './pages/policy/PolicyCreatePage';
import ClaimListPage from './pages/claims/ClaimListPage';
import ClaimDetailPage from './pages/claims/ClaimDetailPage';
import ClaimCreatePage from './pages/claims/ClaimCreatePage';
import PremiumListPage from './pages/premium/PremiumListPage';
import PremiumCreatePage from './pages/premium/PremiumCreatePage';
import DocumentListPage from './pages/document/DocumentListPage';
import ProfilePage from './pages/settings/ProfilePage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Customers - Admin/Agent only */}
        <Route path="/customers">
          <Route index element={<CustomerListPage />} />
          <Route path="new" element={<CustomerCreatePage />} />
          <Route path=":id" element={<CustomerDetailPage />} />
        </Route>

        {/* Policies */}
        <Route path="/policies">
          <Route index element={<PolicyListPage />} />
          <Route path="new" element={<PolicyCreatePage />} />
          <Route path=":id" element={<PolicyDetailPage />} />
        </Route>

        {/* Claims */}
        <Route path="/claims">
          <Route index element={<ClaimListPage />} />
          <Route path="new" element={<ClaimCreatePage />} />
          <Route path=":id" element={<ClaimDetailPage />} />
        </Route>

        {/* Premiums */}
        <Route path="/premiums">
          <Route index element={<PremiumListPage />} />
          <Route path="new" element={<PremiumCreatePage />} />
        </Route>

        {/* Documents */}
        <Route path="/documents" element={<DocumentListPage />} />

        {/* Settings */}
        <Route path="/settings" element={<ProfilePage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
