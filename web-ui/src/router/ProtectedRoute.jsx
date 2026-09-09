import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';

// A route wrapper that allows access only to authenticated users
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { token, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
