import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicChallenge } from '../types/challenge.types.js';
import { useAuth } from '../context/AuthContext.js';
import { joinChallenge, ChallengeApiError } from '../services/challenges.service.js';
import { getFrequencyLabel, DAYS_OF_WEEK } from './DayOfWeekSelector.js';

interface ChallengeInvitationCardProps {
  challenge: PublicChallenge;
}

export const ChallengeInvitationCard: React.FC<ChallengeInvitationCardProps> = ({ challenge }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState<boolean>(false);
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isParticipant = user?.role === 'PARTICIPANT';
  const isManager = user?.role === 'PROGRAM_MANAGER';

  const handleJoin = async () => {
    if (!user) {
      navigate(`/login?redirect=/challenges/${challenge.id}`);
      return;
    }

    if (!isParticipant) {
      return;
    }

    try {
      setJoining(true);
      setErrorMessage(null);
      const res = await joinChallenge(challenge.id);
      setEnrolled(true);
      setSuccessMessage(
        `Enrolled in challenge! ${res.habitsCreatedCount} curriculum habits have been added to your Habit Calendar.`
      );
    } catch (err: any) {
      if (err instanceof ChallengeApiError && err.code === 'ALREADY_ENROLLED') {
        setEnrolled(true);
        setSuccessMessage('You are already enrolled in this challenge!');
      } else {
        setErrorMessage(err.message || 'Failed to join challenge. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const daysCount = calculateDays(challenge.startDate, challenge.endDate);

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '2rem auto',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '16px',
        border: '1px solid var(--papaya-whip)',
        boxShadow: '0 8px 30px rgba(114, 67, 25, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--walnut) 0%, #4a290c 100%)',
          color: '#ffffff',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span
            style={{
              backgroundColor: 'var(--golden-sand)',
              color: 'var(--walnut)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {challenge.category}
          </span>
          <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>
            Public Invitation
          </span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', lineHeight: 1.25 }}>
          {challenge.title}
        </h1>

        <div style={{ fontSize: '0.9375rem', opacity: 0.9 }}>
          Organized by <strong>{challenge.manager.fullName}</strong>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Date Duration Card */}
        <div
          style={{
            backgroundColor: 'var(--papaya-whip)',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            color: 'var(--walnut)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            📅 Duration: {challenge.startDate.split('T')[0]} to {challenge.endDate.split('T')[0]}
          </span>
          <span style={{ backgroundColor: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8125rem' }}>
            {daysCount} Days
          </span>
        </div>

        {/* Guidelines / Description */}
        {challenge.description && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--walnut)', margin: '0 0 0.5rem 0' }}>
              Guidelines & Objectives
            </h3>
            <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--color-text-main)' }}>
              {challenge.description}
            </p>
          </div>
        )}

        {/* Standardized Activities */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--walnut)', margin: '0 0 0.75rem 0' }}>
            Curriculum Activities ({challenge.activities.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {challenge.activities.map((act, index) => (
              <div
                key={act.id || index}
                style={{
                  border: '1px solid var(--papaya-whip)',
                  borderRadius: '10px',
                  padding: '1rem',
                  backgroundColor: '#fffcf8',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--walnut)' }}>
                    {act.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--papaya-whip)',
                      color: 'var(--walnut)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {act.daysOfWeek && act.daysOfWeek.length > 0
                      ? getFrequencyLabel(act.daysOfWeek)
                      : act.frequency.replace(/_/g, ' ')}
                  </span>
                </div>

                {act.daysOfWeek && act.daysOfWeek.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', margin: '6px 0 8px 0' }}>
                    {DAYS_OF_WEEK.map((d) => {
                      const isDue = act.daysOfWeek?.includes(d.day);
                      return (
                        <span
                          key={d.day}
                          title={`${d.fullName}: ${isDue ? 'Scheduled' : 'Rest'}`}
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            backgroundColor: isDue ? 'var(--walnut)' : '#eee7dc',
                            color: isDue ? '#ffffff' : '#8c8073',
                          }}
                        >
                          {d.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {act.description && (
                  <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {act.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alert Banners */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            style={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              border: '1px solid #c8e6c9',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Action Button Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!user ? (
            <button
              type="button"
              onClick={handleJoin}
              style={{
                width: '100%',
                backgroundColor: 'var(--walnut)',
                color: '#fff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              Sign In to Join Challenge
            </button>
          ) : isManager ? (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--papaya-whip)',
                borderRadius: '8px',
                color: 'var(--walnut)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              ℹ️ You are signed in as a Program Manager. Challenge participation is reserved for participants.
            </div>
          ) : enrolled ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                disabled
                style={{
                  width: '100%',
                  backgroundColor: 'var(--golden-sand)',
                  color: 'var(--walnut)',
                  border: 'none',
                  padding: '14px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'default',
                }}
              >
                Enrolled ✓
              </button>
              <button
                type="button"
                onClick={() => navigate('/calendar')}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: '2px solid var(--walnut)',
                  color: 'var(--walnut)',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                }}
              >
                Go to Habit Calendar →
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={joining}
              onClick={handleJoin}
              style={{
                width: '100%',
                backgroundColor: 'var(--walnut)',
                color: '#fff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: joining ? 'not-allowed' : 'pointer',
                opacity: joining ? 0.7 : 1,
              }}
            >
              {joining ? 'Enrolling in Challenge...' : 'Join Challenge Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
