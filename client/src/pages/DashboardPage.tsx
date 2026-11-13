import React from 'react';
import { Header } from '../components/Header.js';
import { useAuth } from '../context/AuthContext.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--papaya-whip)' }}>
      <Header />
      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{
          backgroundColor: 'var(--color-surface)',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid var(--powder-blush)',
          boxShadow: '0 4px 12px rgba(114, 67, 25, 0.05)',
        }}>
          <h2 style={{ color: 'var(--walnut)', marginBottom: '0.5rem' }}>
            Welcome back, {user?.fullName}!
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Role: <strong>Participant</strong> • Session Active
          </p>

          <div style={{
            backgroundColor: 'var(--color-surface-tint)',
            border: '1px dashed var(--walnut)',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <h3 style={{ color: 'var(--walnut)', marginBottom: '0.5rem' }}>Participant Dashboard</h3>
            <p style={{ color: 'var(--color-text-main)', fontSize: '0.9375rem' }}>
              Feature 1 authentication and session management is active.
              <br />
              <strong>Today's Checklist</strong> and <strong>Daily Habit Tracker Calendar</strong> are scheduled for Feature 2 &amp; Feature 3.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

