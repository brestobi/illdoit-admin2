import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser } from '../api/supabase';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate('/login', { replace: true });
          return;
        }

        const { data: profile } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (!profile || profile.user_type !== 'admin') {
          navigate('/login', { replace: true });
          return;
        }

        setAuthorized(true);
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
};

export default AuthGuard;
