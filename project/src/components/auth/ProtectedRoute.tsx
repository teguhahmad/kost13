import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        if (!session) {
          // Save the intended destination
          if (location.pathname.startsWith('/marketplace')) {
            navigate('/marketplace/auth', { state: { from: location.pathname } });
          } else {
            navigate('/login', { state: { from: location.pathname } });
          }
          return;
        }

        // Check backoffice role first
        const { data: backofficeUser } = await supabase
          .from('backoffice_users')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        // If trying to access backoffice routes but not a backoffice user
        if (location.pathname.startsWith('/backoffice') && !backofficeUser) {
          setError('You do not have access to the backoffice');
          navigate('/login');
          return;
        }

        // Set role based on backoffice role or user metadata
        const role = backofficeUser?.role || session.user.user_metadata?.role || 'tenant';
        setUserRole(role);

        // Redirect based on role if not allowed
        if (allowedRoles && !allowedRoles.includes(role)) {
          switch (role) {
            case 'superadmin':
              navigate('/backoffice');
              break;
            case 'admin':
              navigate('/properties');
              break;
            case 'tenant':
              navigate('/marketplace');
              break;
            default:
              navigate('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
