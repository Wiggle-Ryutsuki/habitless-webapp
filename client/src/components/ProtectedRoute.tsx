import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Role } from '../types/auth.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Eliminate page refresh race condition with INITIALIZING / AUTH_LOADING state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--powder-blush)',
        color: 'var(--walnut)',
        gap: '1rem',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '4px solid var(--papaya-whip)',
          borderTopColor: 'var(--walnut)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Initializing HabitLess session...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not logged in -> Redirect to login with intended path
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check role restrictions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'PROGRAM_MANAGER' ? '/manager' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

