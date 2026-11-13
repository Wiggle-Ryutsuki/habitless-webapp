import React from 'react';
import { Header } from '../components/Header.js';
import { useAuth } from '../context/AuthContext.js';

export const ManagerPage: React.FC = () => {
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
            Program Manager Workspace
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Director: <strong>{user?.fullName}</strong> ({user?.email})
          </p>

          <div style={{
            backgroundColor: 'var(--color-surface-tint)',
            border: '1px dashed var(--walnut)',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <h3 style={{ color: 'var(--walnut)', marginBottom: '0.5rem' }}>Challenge Management Hub</h3>
            <p style={{ color: 'var(--color-text-main)', fontSize: '0.9375rem' }}>
              Feature 1 role-based access control and manager session is active.
              <br />
              <strong>Challenge Program Builder</strong> and <strong>Web Deploy Actions</strong> are scheduled for Feature 4.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

