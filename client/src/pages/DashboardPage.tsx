import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { useAuth } from '../context/AuthContext.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [toastVisible, setToastVisible] = useState(true);
  const isParticipant = user?.role === 'PARTICIPANT';

  useEffect(() => {
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
      <Header />

      {/* Under Construction Toast Notification */}
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '76px',
            right: '1.5rem',
            backgroundColor: 'var(--walnut)',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(114, 67, 25, 0.25)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
          }}
        >
          <span>🚧 Dashboard is still under construction</span>
          <button
            onClick={() => setToastVisible(false)}
            aria-label="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <main style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: '16px',
            border: '1px solid var(--papaya-whip)',
            boxShadow: '0 6px 20px rgba(114, 67, 25, 0.08)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
          <h1
            style={{
              color: 'var(--walnut)',
              fontSize: '1.875rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            Dashboard Under Construction
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '1.0625rem',
              lineHeight: 1.6,
              maxWidth: '520px',
              margin: '0 auto 2rem auto',
            }}
          >
            {isParticipant
              ? 'The Participant Dashboard is currently under construction. Please use the Habit Calendar to track your daily habits.'
              : 'The Program Manager Dashboard is currently under construction. Please use the Programs tab to manage and deploy your challenges.'}
          </p>
          <Link
            to={isParticipant ? '/calendar' : '/manager'}
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--walnut)',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(114, 67, 25, 0.2)',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#5a3514';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--walnut)';
            }}
          >
            {isParticipant ? 'Go to Habit Calendar' : 'Go to Programs'}
          </Link>
        </div>
      </main>
    </div>
  );
};
