import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">Insurance MS</h1>
            <p className="text-muted-foreground mt-1">Manage your policies with ease</p>
          </Link>
        </div>
        <Outlet />
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2024 Insurance Management System
        </p>
      </div>
    </div>
  );
}
