import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { HABIT_CATEGORY_PRESETS } from '../components/CategorySelector.js';
import {
  getFrequencyLabel,
  getInitialDaysOfWeek,
} from '../components/DayOfWeekSelector.js';
import { fetchHabits } from '../services/habits.service.js';
import { Habit } from '../types/habit.js';
import { ChallengeInfoModal } from '../components/ChallengeInfoModal.js';

const outlinedButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--walnut)',
  color: 'var(--walnut)',
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.875rem',
  textDecoration: 'none',
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
};

function formatFrequencySummary(habit: Habit): string {
  if (habit.frequency === 'MONTHLY') {
    return 'Monthly';
  }
  return getFrequencyLabel(getInitialDaysOfWeek(habit.frequency, habit.daysOfWeek));
}

/**
 * All Habits Directory (/habits) allowing search, category filtering, and navigation to stats.
 */
export const HabitsDirectoryPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [selectedChallengeProgramId, setSelectedChallengeProgramId] = useState<number | null>(null);
  const [selectedChallengeStatus, setSelectedChallengeStatus] = useState<'ACTIVE' | 'ENDED' | null>(null);

  const handleOpenChallengeModal = (programId: number, status?: 'ACTIVE' | 'ENDED' | null) => {
    setSelectedChallengeProgramId(programId);
    setSelectedChallengeStatus(status || null);
    setChallengeModalOpen(true);
  };

  const loadHabits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHabits('active');
      setHabits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(HABIT_CATEGORY_PRESETS);
    for (const h of habits) {
      if (h.category && h.category.trim()) {
        set.add(h.category.trim());
      }
    }
    return Array.from(set);
  }, [habits]);

  const filteredHabits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return habits.filter((habit) => {
      if (selectedCategory === 'UNCATEGORIZED' && habit.category) {
        return false;
      }
      if (
        selectedCategory !== 'ALL' &&
        selectedCategory !== 'UNCATEGORIZED' &&
        habit.category !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      const titleMatch = habit.title.toLowerCase().includes(q);
      const descMatch = (habit.description || '').toLowerCase().includes(q);
      return titleMatch || descMatch;
    });
  }, [habits, searchQuery, selectedCategory]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
      <Header />

      <main
        style={{
          maxWidth: '1040px',
          margin: '2rem auto',
          padding: '0 1rem 3rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h1
              style={{
                color: 'var(--walnut)',
                fontSize: '1.75rem',
                fontWeight: 800,
                margin: 0,
              }}
            >
              All Habits
            </h1>
            <p
              style={{
                color: 'var(--color-text-main)',
                fontSize: '0.9375rem',
                margin: '0.25rem 0 0 0',
              }}
            >
              Select any habit to view its completion heatmap and streak statistics
            </p>
          </div>
          <Link to="/calendar" style={outlinedButtonStyle}>
            Back to Calendar
          </Link>
        </div>

        {/* Search & Category Filter */}
        {!isLoading && !error && habits.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--papaya-whip)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
            }}
          >
            <input
              type="search"
              aria-label="Search habits"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid var(--papaya-whip)',
                padding: '0 0.875rem',
                backgroundColor: '#ffffff',
                color: 'var(--color-text-main)',
              }}
            />

            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid var(--papaya-whip)',
                padding: '0 0.875rem',
                backgroundColor: '#ffffff',
                color: 'var(--color-text-main)',
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="UNCATEGORIZED">Uncategorized</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--papaya-whip)',
              borderRadius: '12px',
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--walnut)',
              fontWeight: 600,
            }}
          >
            Loading your habits...
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--color-error)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--color-error)', fontWeight: 600, marginBottom: '1rem' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={loadHabits}
              style={{
                backgroundColor: 'var(--walnut)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0 1.25rem',
                minHeight: '44px',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && habits.length === 0 && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--papaya-whip)',
              borderRadius: '12px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <h2 style={{ color: 'var(--walnut)', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
              No habits yet
            </h2>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.25rem 0' }}>
              Create active habits on your Habit Calendar to track completion heatmaps and streaks.
            </p>
            <Link
              to="/calendar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
                backgroundColor: 'var(--walnut)',
                color: '#ffffff',
                padding: '0 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go to Habit Calendar
            </Link>
          </div>
        )}

        {!isLoading && !error && habits.length > 0 && filteredHabits.length === 0 && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--papaya-whip)',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 600, margin: '0 0 1rem 0' }}>
              No habits match your filter
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--walnut)',
                color: 'var(--walnut)',
                borderRadius: '8px',
                padding: '0 1rem',
                minHeight: '44px',
                fontWeight: 600,
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {!isLoading && !error && filteredHabits.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--papaya-whip)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
              overflow: 'hidden',
            }}
          >
            <ul
              aria-label="All habits list"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {filteredHabits.map((habit, idx) => (
                <li
                  key={habit.id}
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--papaya-whip)' : 'none',
                    padding: '0.9375rem 1.25rem',
                    minHeight: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem 1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      minWidth: '180px',
                      flex: '1 1 260px',
                    }}
                  >
                    <span
                      data-testid={`habit-swatch-${habit.id}`}
                      aria-hidden="true"
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: habit.colorHex,
                        flexShrink: 0,
                      }}
                    />
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--walnut)',
                        wordBreak: 'break-word',
                      }}
                    >
                      <Link
                        to={`/habits/${habit.id}/stats`}
                        style={{
                          color: 'inherit',
                          textDecoration: 'none',
                        }}
                      >
                        {habit.title}
                      </Link>
                    </h2>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem 0.75rem',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: 'var(--papaya-whip)',
                        color: 'var(--walnut)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '999px',
                      }}
                    >
                      {habit.category || 'Uncategorized'}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'var(--golden-sand)',
                        color: 'var(--walnut)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '999px',
                      }}
                    >
                      {formatFrequencySummary(habit)}
                    </span>
                    {habit.programId && (
                      <button
                        type="button"
                        onClick={() => handleOpenChallengeModal(habit.programId!, habit.challengeStatus)}
                        aria-label={habit.challengeStatus === 'ENDED' ? 'View ended challenge details' : 'View challenge details'}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: habit.challengeStatus === 'ENDED' ? '#ffebee' : '#fff8e1',
                          color: habit.challengeStatus === 'ENDED' ? '#c62828' : '#b78103',
                          border: `1px solid ${habit.challengeStatus === 'ENDED' ? '#ef9a9a' : '#ffe082'}`,
                          cursor: 'pointer',
                        }}
                      >
                        {habit.challengeStatus === 'ENDED' ? 'Challenge (Ended)' : 'Challenge'}
                      </button>
                    )}
                    <Link
                      to={`/habits/${habit.id}/stats`}
                      style={outlinedButtonStyle}
                    >
                      View Stats
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <ChallengeInfoModal
        isOpen={challengeModalOpen}
        programId={selectedChallengeProgramId}
        initialChallengeStatus={selectedChallengeStatus}
        onClose={() => setChallengeModalOpen(false)}
        onEnrollmentChanged={loadHabits}
      />
    </div>
  );
};
