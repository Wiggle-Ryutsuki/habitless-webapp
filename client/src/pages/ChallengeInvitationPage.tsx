import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { ChallengeInvitationCard } from '../components/ChallengeInvitationCard.js';
import { PublicChallenge } from '../types/challenge.types.js';
import { fetchPublicChallenge } from '../services/challenges.service.js';
import { useAuth } from '../context/AuthContext.js';

export const ChallengeInvitationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadChallenge(parseInt(id, 10));
    }
  }, [id]);

  const loadChallenge = async (challengeId: number) => {
    try {
      setLoading(true);
      setNotFound(false);
      const data = await fetchPublicChallenge(challengeId);
      setChallenge(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
      {user ? (
        <Header />
      ) : (
        <header
          style={{
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--papaya-whip)',
            padding: '0 1.5rem',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/login"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--walnut)',
              textDecoration: 'none',
            }}
          >
            HabitLess
          </Link>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              to="/login"
              style={{
                color: 'var(--walnut)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                backgroundColor: 'var(--walnut)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Sign Up
            </Link>
          </div>
        </header>
      )}

      <main style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', color: 'var(--walnut)' }}>
            <h2>Loading challenge details...</h2>
          </div>
        ) : notFound || !challenge ? (
          <div
            style={{
              maxWidth: '540px',
              margin: '4rem auto',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1px solid var(--papaya-whip)',
              padding: '2.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
            }}
          >
            <h2 style={{ color: 'var(--walnut)', margin: '0 0 0.75rem 0' }}>Challenge Not Found</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This challenge program does not exist, has been archived, or has not yet been published by its Program Manager.
            </p>
            <Link
              to={user ? (user.role === 'PROGRAM_MANAGER' ? '/manager' : '/calendar') : '/login'}
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--walnut)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.9375rem',
              }}
            >
              {user ? 'Return to Workspace' : 'Sign In'}
            </Link>
          </div>
        ) : (
          <ChallengeInvitationCard challenge={challenge} />
        )}
      </main>
    </div>
  );
};
