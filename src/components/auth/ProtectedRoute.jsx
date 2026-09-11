import { useAuth } from '../../context/useAuth';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  // Only gate on the initial session-restore, not on isLoading in general -
  // that flag also flips true/false during unrelated actions like Connect
  // Salesforce, which would otherwise unmount and remount every protected
  // page (losing its local state) each time one of those actions runs.
  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div style={{ padding: '2rem' }}>{children}</div>;
};