import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchParticipantDashboard,
  toggleHabitCompletion,
} from '../services/habits.service.js';
import {
  DashboardFocusItem,
  ParticipantDashboardResponse,
} from '../types/habit.js';

/**
 * Participant Dashboard (/dashboard) with Today's Focus, Weekly Progress Bars, and Program Completion.
 * Retains the non-API Program Manager fallback card until Feature 9 implements /manager/dashboard.
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'PROGRAM_MANAGER';

  const [dashboard, setDashboard] = useState<ParticipantDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!isManager);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const localDateStr = new Date().toLocaleDateString('en-CA');

  const loadDashboard = async (silent = false) => {
    if (isManager) return;
    if (!silent) {
      setIsLoading(true);
    }
    setFetchError(null);
    try {
      const res = await fetchParticipantDashboard(localDateStr);
      setDashboard(res);
    } catch (err) {
      if (!silent) {
        setFetchError(
          err instanceof Error ? err.message : 'Unable to load dashboard data.'
        );
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isManager && user?.role === 'PARTICIPANT') {
      loadDashboard();
    } else if (isManager) {
      setIsLoading(false);
    }
  }, [user?.role]);

  const handleToggleFocus = async (item: DashboardFocusItem) => {
    if (!dashboard) return;
    setToggleError(null);

    const previousSnapshot = dashboard;
    const nextCompleted = !item.isCompleted;
    const delta = nextCompleted ? 1 : -1;

    const updatedItems = dashboard.todayFocus.items.map((entry) =>
      entry.habitId === item.habitId
        ? { ...entry, isCompleted: nextCompleted }
        : entry
    );
    const updatedCompletedCount = Math.max(
      0,
      dashboard.todayFocus.completedCount + delta
    );

    const updatedWeeklyProgress = dashboard.weeklyProgress.map((bar) => {
      if (bar.habitId !== item.habitId) return bar;
      const nextCompletedDays = Math.min(
        bar.scheduledDaysThisWeek,
        Math.max(0, bar.completedDaysThisWeek + delta)
      );
      const nextPercentage =
        bar.scheduledDaysThisWeek === 0
          ? 0
          : Math.min(
              100,
              Math.round((nextCompletedDays / bar.scheduledDaysThisWeek) * 100)
            );
      return {
        ...bar,
        completedDaysThisWeek: nextCompletedDays,
        percentage: nextPercentage,
      };
    });

    setDashboard({
      ...dashboard,
      todayFocus: {
        ...dashboard.todayFocus,
        completedCount: updatedCompletedCount,
        items: updatedItems,
      },
      weeklyProgress: updatedWeeklyProgress,
    });

    try {
      await toggleHabitCompletion(item.habitId, dashboard.date, nextCompleted);
      await loadDashboard(true);
    } catch (err) {
      setDashboard(previousSnapshot);
      setToggleError(
        err instanceof Error
          ? err.message
          : 'Failed to save habit completion. Reverted change.'
      );
    }
  };

  if (isManager) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
        <Header />
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
              The Program Manager Dashboard is currently under construction. Please use the Programs tab to manage and deploy your challenges.
            </p>
            <Link
              to="/manager"
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
              }}
            >
              Go to Programs
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
              Participant Dashboard
            </h1>
            <p
              style={{
                color: 'var(--color-text-main)',
                fontSize: '0.9375rem',
                margin: '0.25rem 0 0 0',
              }}
            >
              Today&apos;s focus, weekly habit momentum, and active challenge progress
            </p>
          </div>
          <Link
            to="/calendar"
            style={{
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
            }}
          >
            Open Habit Calendar
          </Link>
        </div>

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
            Loading your dashboard...
          </div>
        )}

        {!isLoading && fetchError && (
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
            <p
              style={{
                color: 'var(--color-error)',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              {fetchError}
            </p>
            <button
              type="button"
              onClick={() => loadDashboard()}
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

        {!isLoading && !fetchError && dashboard && (
          <>
            {/* Section 3: Active Program Completion Bar (Global Indicator) */}
            <section
              aria-labelledby="program-completion-heading"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--papaya-whip)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <h2
                    id="program-completion-heading"
                    style={{
                      color: 'var(--walnut)',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Active Program Completion
                  </h2>
                  <p
                    style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {dashboard.programCompletion.activeProgramsCount === 0
                      ? 'No active challenge programs joined yet'
                      : `${dashboard.programCompletion.activeProgramsCount} active ${
                          dashboard.programCompletion.activeProgramsCount === 1
                            ? 'program'
                            : 'programs'
                        } • ${dashboard.programCompletion.totalCompletedLogs} / ${
                          dashboard.programCompletion.totalScheduledDaysToDate
                        } scheduled challenge days`}
                  </p>
                </div>

                <span
                  style={{
                    backgroundColor: 'var(--golden-sand)',
                    color: 'var(--walnut)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  {dashboard.programCompletion.percentage}%
                </span>
              </div>

              <div
                role="progressbar"
                aria-label="Active Program Completion"
                aria-valuenow={dashboard.programCompletion.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  width: '100%',
                  height: '14px',
                  backgroundColor: 'var(--papaya-whip)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${dashboard.programCompletion.percentage}%`,
                    height: '100%',
                    backgroundColor: 'var(--walnut)',
                    borderRadius: '999px',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>
            </section>

            <div className="dashboard-focus-grid">
              {/* Section 1: Today's Focus Snippet with Mon-Sun Week Strip */}
              <section
                aria-labelledby="todays-focus-heading"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--papaya-whip)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
                }}
              >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <h2
                  id="todays-focus-heading"
                  style={{
                    color: 'var(--walnut)',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Today&apos;s Focus
                </h2>
                <span
                  style={{
                    backgroundColor: 'var(--papaya-whip)',
                    color: 'var(--walnut)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  {dashboard.todayFocus.completedCount} / {dashboard.todayFocus.totalScheduled} completed
                </span>
              </div>

              {/* Mon-Sun 7-Day Strip */}
              <div
                role="region"
                aria-label="Current week calendar strip"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(40px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  overflowX: 'auto',
                }}
              >
                {dashboard.weekDays.map((wd) => (
                  <div
                    key={wd.date}
                    aria-current={wd.isToday ? 'date' : undefined}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem 0.25rem',
                      borderRadius: '8px',
                      border: wd.isToday
                        ? '2px solid var(--walnut)'
                        : '1px solid var(--papaya-whip)',
                      backgroundColor: wd.isToday ? 'var(--papaya-whip)' : '#fffcf7',
                      color: wd.isToday ? 'var(--walnut)' : 'var(--color-text-muted)',
                      fontWeight: wd.isToday ? 700 : 500,
                    }}
                  >
                    <span style={{ fontSize: '0.75rem' }}>{wd.dayLabel}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {wd.dayNumber}
                    </span>
                  </div>
                ))}
              </div>

              {toggleError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'var(--color-error-bg)',
                    color: 'var(--color-error)',
                    border: '1px solid var(--light-coral)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                  }}
                >
                  {toggleError}
                </div>
              )}

              {dashboard.todayFocus.items.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#fffaf0',
                    border: '1px dashed var(--papaya-whip)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600 }}>
                    No habits scheduled for today.
                  </p>
                  <Link
                    to="/calendar"
                    style={{
                      color: 'var(--walnut)',
                      fontWeight: 700,
                      textDecoration: 'underline',
                    }}
                  >
                    Schedule habits in your Habit Calendar
                  </Link>
                </div>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  {dashboard.todayFocus.items.map((item) => (
                    <li
                      key={item.habitId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '8px',
                        border: '1px solid var(--papaya-whip)',
                        backgroundColor: item.isCompleted ? '#fcfdf4' : '#ffffff',
                        minHeight: '48px',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          flex: 1,
                          minHeight: '44px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleFocus(item)}
                          aria-label={`Mark ${item.title} as ${
                            item.isCompleted ? 'incomplete' : 'completed'
                          }`}
                          style={{
                            width: '20px',
                            height: '20px',
                            accentColor: 'var(--walnut)',
                            cursor: 'pointer',
                          }}
                        />
                        <span
                          aria-hidden="true"
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: item.colorHex,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-text-main)',
                            textDecoration: item.isCompleted ? 'line-through' : 'none',
                            opacity: item.isCompleted ? 0.75 : 1,
                          }}
                        >
                          {item.title}
                        </span>
                      </label>

                      <span
                        style={{
                          backgroundColor: 'var(--papaya-whip)',
                          color: 'var(--walnut)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.category || 'Uncategorized'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Section 2: Compact Weekly Habit Progress Bars beside Today's Focus */}
            <section
              aria-labelledby="weekly-progress-heading"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--papaya-whip)',
                borderRadius: '12px',
                padding: '1.125rem 1.25rem',
                boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: '0.25rem 0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <h2
                  id="weekly-progress-heading"
                  style={{
                    color: 'var(--walnut)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Weekly Habit Progress
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {dashboard.weekStart} to {dashboard.weekEnd}
                </span>
              </div>

              {dashboard.weeklyProgress.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  No habits scheduled for this week yet. Visit your Habit Calendar to create one.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {dashboard.weeklyProgress.map((bar, idx) => (
                    <div
                      key={bar.habitId}
                      style={{
                        paddingBottom: idx < dashboard.weeklyProgress.length - 1 ? '0.625rem' : 0,
                        borderBottom:
                          idx < dashboard.weeklyProgress.length - 1
                            ? '1px solid var(--papaya-whip)'
                            : 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.3rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: bar.colorHex,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            title={bar.title}
                            style={{
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              color: 'var(--walnut)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {bar.title}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--color-text-main)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {bar.completedDaysThisWeek} / {bar.scheduledDaysThisWeek} ({bar.percentage}%)
                        </span>
                      </div>

                      <div
                        role="progressbar"
                        aria-label={`${bar.title} weekly progress`}
                        aria-valuenow={bar.completedDaysThisWeek}
                        aria-valuemin={0}
                        aria-valuemax={bar.scheduledDaysThisWeek}
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'var(--papaya-whip)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${bar.percentage}%`,
                            height: '100%',
                            backgroundColor: bar.colorHex,
                            borderRadius: '999px',
                            transition: 'width 0.25s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            </div>
          </>
        )}
      </main>

      <style>{`
        .dashboard-focus-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.85fr) minmax(240px, 0.85fr);
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 767px) {
          .dashboard-focus-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
