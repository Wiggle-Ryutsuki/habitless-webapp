import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Role } from '../types/auth.js';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const { login, register, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('PARTICIPANT');

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectParam = searchParams.get('redirect');

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (mode === 'register') {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required.';
      } else if (fullName.trim().length < 2 || fullName.trim().length > 80) {
        errors.fullName = 'Full name must be between 2 and 80 characters.';
      }
    }

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const user = await login(email.trim(), password);
        // Direct routing based on safe redirect or role
        if (redirectParam && redirectParam.startsWith('/')) {
          navigate(redirectParam);
        } else {
          navigate(user.role === 'PROGRAM_MANAGER' ? '/manager' : '/dashboard');
        }
      } else {
        const user = await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role,
        });
        if (redirectParam && redirectParam.startsWith('/')) {
          navigate(redirectParam);
        } else {
          navigate(user.role === 'PROGRAM_MANAGER' ? '/manager' : '/dashboard');
        }
      }
    } catch (err) {
      // Error is captured in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '440px',
      backgroundColor: 'var(--color-surface)',
      borderRadius: '12px',
      border: '1px solid var(--powder-blush)',
      padding: '2rem',
      boxShadow: '0 8px 24px rgba(114, 67, 25, 0.08)',
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: 'var(--walnut)',
          marginBottom: '0.25rem',
        }}>
          HabitLess
        </h1>
        <p style={{
          fontSize: '0.9375rem',
          color: 'var(--color-text-muted)',
        }}>
          Habit and Activity Tracking System
        </p>
      </div>

      {/* Top Banner Error Display */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            border: '1px solid var(--color-error)',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {mode === 'register' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="fullName"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                marginBottom: '0.375rem',
                color: 'var(--color-text-main)',
              }}
            >
              Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoFocus
              disabled={isSubmitting}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
              }}
              placeholder="e.g. Alex Rivera"
              style={{
                width: '100%',
                height: '42px',
                padding: '0 0.75rem',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.fullName ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
                backgroundColor: 'var(--color-surface)',
                outline: 'none',
              }}
            />
            {fieldErrors.fullName && (
              <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {fieldErrors.fullName}
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.875rem',
              marginBottom: '0.375rem',
              color: 'var(--color-text-main)',
            }}
          >
            Email Address <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus={mode === 'login'}
            disabled={isSubmitting}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
            }}
            placeholder="alex@example.com"
            style={{
              width: '100%',
              height: '42px',
              padding: '0 0.75rem',
              borderRadius: '6px',
              border: `1px solid ${fieldErrors.email ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
              backgroundColor: 'var(--color-surface)',
              outline: 'none',
            }}
          />
          {fieldErrors.email && (
            <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.875rem',
              marginBottom: '0.375rem',
              color: 'var(--color-text-main)',
            }}
          >
            Password <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            disabled={isSubmitting}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
            }}
            placeholder="••••••••"
            style={{
              width: '100%',
              height: '42px',
              padding: '0 0.75rem',
              borderRadius: '6px',
              border: `1px solid ${fieldErrors.password ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
              backgroundColor: 'var(--color-surface)',
              outline: 'none',
            }}
          />
          {fieldErrors.password && (
            <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              {fieldErrors.password}
            </p>
          )}
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              color: 'var(--color-text-main)',
            }}>
              Select Role <span style={{ color: 'var(--color-error)' }}>*</span>
            </span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9375rem' }}>
                <input
                  type="radio"
                  name="role"
                  value="PARTICIPANT"
                  checked={role === 'PARTICIPANT'}
                  onChange={() => setRole('PARTICIPANT')}
                  disabled={isSubmitting}
                  style={{ accentColor: 'var(--walnut)' }}
                />
                Participant
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9375rem' }}>
                <input
                  type="radio"
                  name="role"
                  value="PROGRAM_MANAGER"
                  checked={role === 'PROGRAM_MANAGER'}
                  onChange={() => setRole('PROGRAM_MANAGER')}
                  disabled={isSubmitting}
                  style={{ accentColor: 'var(--walnut)' }}
                />
                Program Manager
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            height: '44px',
            backgroundColor: isSubmitting ? 'var(--color-text-muted)' : 'var(--walnut)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {isSubmitting ? (
            <span>Processing...</span>
          ) : (
            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          )}
        </button>
      </form>

      {/* Switch Form Link */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        {mode === 'login' ? (
          <>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: 'var(--walnut)' }}>
              Sign Up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--walnut)' }}>
              Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

