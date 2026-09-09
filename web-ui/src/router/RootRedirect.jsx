import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';

// Decide where to go from "/" based on auth state
export default function RootRedirect() {
  const { token, loading } = useAuth();

  // while checking localStorage token, avoid flicker
  if (loading) {
    return <Spinner />;
  }

  // if user has a token, go to main app, otherwise go to login
  return token ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />;
}
