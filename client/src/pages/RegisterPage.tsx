import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm.js';
import { useAuth } from '../context/AuthContext.js';

export const RegisterPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === 'PROGRAM_MANAGER' ? '/manager' : '/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--gradient-right)',
    }}>
      <AuthForm mode="register" />
    </div>
  );
};

