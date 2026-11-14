import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ChecklistItem, TodayChecklistResponse, Habit } from '../types/habit.js';
import { fetchTodayChecklist, toggleHabitCompletion } from '../services/habits.service.js';
import { NewHabitModal } from './NewHabitModal.js';

export const TodayChecklist: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TodayChecklistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const newHabitBtnRef = useRef<HTMLButtonElement>(null);

  // Local calendar date (YYYY-MM-DD)
  const localDateStr = new Date().toLocaleDateString('en-CA');

  // Calendar date breakdown
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // Days in current month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Day initials for each day of month (M, T, W, T, F, S, S)
  const monthDays = useMemo(() => {
    const initials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(currentYear, currentMonth, d);
      days.push({
        dayNumber: d,
        initial: initials[dayDate.getDay()],
        isToday: d === currentDay,
      });
    }
    return days;
  }, [currentYear, currentMonth, daysInMonth, currentDay]);

  const monthYearLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
  }, [now]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const loadChecklist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchTodayChecklist(localDateStr);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load today’s habits.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, []);

  const handleToggle = async (item: ChecklistItem) => {
    if (!data) return;
    setToggleError(null);

    const previousCompleted = item.isCompleted;
    const newCompleted = !previousCompleted;

    // 1. Optimistic Update
    const previousItems = [...data.items];
    const previousCompletedCount = data.completedCount;

    const updatedItems = data.items.map((i) =>
      i.habitId === item.habitId ? { ...i, isCompleted: newCompleted } : i
    );
    const updatedCount = newCompleted
      ? data.completedCount + 1
      : Math.max(0, data.completedCount - 1);

    setData({
      ...data,
      completedCount: updatedCount,
      items: updatedItems,
    });

    // 2. Dispatch to API
    try {
      await toggleHabitCompletion(item.habitId, data.date, newCompleted);
    } catch (err) {
      // 3. Rollback on failure
      setData({
        ...data,
        completedCount: previousCompletedCount,
        items: previousItems,
      });
      setToggleError('Failed to save habit status. Please retry.');
    }
  };

  const handleHabitCreated = (_newHabit: Habit) => {
    loadChecklist();
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '1.5rem auto', padding: '0 1rem' }}>
      {/* Main Container Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid var(--papaya-whip)',
          boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
        }}
      >
        {/* Top Header Bar: Month Navigator, Greeting, Tally & + New Habit */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h1 style={{ color: 'var(--walnut)', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                Welcome back, {user?.fullName || 'Participant'}!
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                {formattedDate}
              </p>
            </div>

            {/* Month Navigator & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--papaya-whip)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  color: 'var(--walnut)',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                }}
              >
                <span>&lt;</span>
                <span>{monthYearLabel}</span>
                <span>&gt;</span>
              </div>

              <span
                style={{
                  backgroundColor: 'var(--golden-sand)',
                  color: 'var(--walnut)',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {data ? `${data.completedCount} of ${data.totalScheduled} habits completed today` : 'Loading tally...'}
              </span>

              <button
                ref={newHabitBtnRef}
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  backgroundColor: 'var(--walnut)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 1.25rem',
                  height: '40px',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  boxShadow: '0 2px 8px rgba(114, 67, 25, 0.15)',
                }}
              >
                + New Habit
              </button>
            </div>
          </div>

          {/* Illuminated Date Indicator Bar */}
          <div
            style={{
              backgroundColor: '#fffdf5',
              border: '2px solid var(--golden-sand)',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--walnut)',
              fontSize: '0.9375rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>💡</span>
              <span>
                <strong>Active Tracking Column:</strong> Day {currentDay} ({formattedDate.split(',')[0]}) is illuminated below and ready for checking off habits.
              </span>
            </div>
            <span
              style={{
                backgroundColor: 'var(--papaya-whip)',
                color: 'var(--walnut)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}
            >
              Column {currentDay} Editable
            </span>
          </div>
        </div>

        {/* Temporary Error Banner */}
        {toggleError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{toggleError}</span>
            <button
              type="button"
              onClick={() => setToggleError(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--walnut)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 1rem',
                border: '4px solid var(--papaya-whip)',
                borderTopColor: 'var(--walnut)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Loading today’s schedule...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Initial Fetch Error State */}
        {!isLoading && error && (
          <div
            style={{
              border: '1px solid var(--color-error)',
              backgroundColor: 'var(--color-error-bg)',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--color-error)', fontWeight: 600, marginBottom: '1rem' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={loadChecklist}
              style={{
                backgroundColor: 'var(--walnut)',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && data.items.length === 0 && (
          <div
            style={{
              border: '1px dashed var(--walnut)',
              backgroundColor: 'var(--color-surface-tint)',
              borderRadius: '8px',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <h3 style={{ color: 'var(--walnut)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
              No habits scheduled for today!
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
              You don't have any habits scheduled on today's calendar. Create a new habit to begin tracking!
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: 'var(--walnut)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0 1.5rem',
                height: '42px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Create Your First Habit
            </button>
          </div>
        )}

        {/* Unified Habit Calendar Desktop Matrix */}
        {!isLoading && !error && data && data.items.length > 0 && (
          <div
            style={{
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid var(--papaya-whip)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
                minWidth: '950px',
              }}
            >
              <thead>
                {/* Row 1: Day initials */}
                <tr style={{ backgroundColor: '#fff9ed', borderBottom: '1px solid var(--papaya-whip)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      color: 'var(--walnut)',
                      fontWeight: 700,
                      width: '260px',
                      minWidth: '240px',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#fff9ed',
                      zIndex: 2,
                    }}
                  >
                    HABITS (Daily Habits)
                  </th>
                  {monthDays.map((d) => (
                    <th
                      key={`initial-${d.dayNumber}`}
                      style={{
                        textAlign: 'center',
                        padding: '4px 2px',
                        width: '26px',
                        minWidth: '24px',
                        color: d.isToday ? 'var(--walnut)' : 'var(--color-text-muted)',
                        fontWeight: d.isToday ? 700 : 500,
                        backgroundColor: d.isToday ? 'var(--papaya-whip)' : 'transparent',
                        borderLeft: d.isToday ? '2px solid var(--walnut)' : '1px solid #f9eedc',
                        borderRight: d.isToday ? '2px solid var(--walnut)' : 'none',
                      }}
                    >
                      {d.initial}
                    </th>
                  ))}
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '8px 12px',
                      color: 'var(--walnut)',
                      fontWeight: 700,
                      width: '120px',
                      minWidth: '110px',
                    }}
                  >
                    GOAL ACHIEVED
                  </th>
                </tr>

                {/* Row 2: Day numbers */}
                <tr style={{ backgroundColor: '#fff9ed', borderBottom: '2px solid var(--walnut)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '4px 12px 8px 12px',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#fff9ed',
                      zIndex: 2,
                    }}
                  >
                    Today's assigned list
                  </th>
                  {monthDays.map((d) => (
                    <th
                      key={`num-${d.dayNumber}`}
                      aria-current={d.isToday ? 'date' : undefined}
                      style={{
                        textAlign: 'center',
                        padding: '2px 2px 6px 2px',
                        fontSize: '0.8125rem',
                        color: d.isToday ? 'var(--walnut)' : 'var(--color-text-main)',
                        fontWeight: d.isToday ? 800 : 600,
                        backgroundColor: d.isToday ? 'var(--papaya-whip)' : 'transparent',
                        borderLeft: d.isToday ? '2px solid var(--walnut)' : '1px solid #f9eedc',
                        borderRight: d.isToday ? '2px solid var(--walnut)' : 'none',
                      }}
                    >
                      {d.isToday ? `[${d.dayNumber}*]` : d.dayNumber}
                    </th>
                  ))}
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '4px 12px 8px 12px',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Target / Done
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.items.map((item, index) => (
                  <tr
                    key={item.habitId}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fcfaf6',
                      borderBottom: '1px solid var(--papaya-whip)',
                    }}
                  >
                    {/* Left Column: Side list of daily habits */}
                    <td
                      style={{
                        padding: '10px 12px',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fcfaf6',
                        zIndex: 1,
                        borderRight: '1px solid var(--papaya-whip)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* 6px Color Strip */}
                        <div
                          style={{
                            width: '6px',
                            height: '28px',
                            borderRadius: '3px',
                            backgroundColor: item.colorHex,
                            flexShrink: 0,
                          }}
                        />

                        {/* Title & Frequency */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: item.isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                                textDecoration: item.isCompleted ? 'line-through' : 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                backgroundColor: 'var(--papaya-whip)',
                                color: 'var(--walnut)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}
                            >
                              {item.frequency}
                            </span>
                          </div>
                        </div>

                        {/* Inline [Edit] Trigger */}
                        <button
                          type="button"
                          aria-label={`Edit ${item.title}`}
                          style={{
                            background: 'none',
                            border: '1px solid var(--papaya-whip)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: 'var(--walnut)',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            // Opens edit trigger
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>

                    {/* Center 1-31 Columns: Today's column is illuminated and interactive! */}
                    {monthDays.map((d) => {
                      if (d.isToday) {
                        return (
                          <td
                            key={`cell-${item.habitId}-${d.dayNumber}`}
                            style={{
                              textAlign: 'center',
                              padding: '2px',
                              backgroundColor: 'rgba(254, 234, 199, 0.45)',
                              borderLeft: '2px solid var(--walnut)',
                              borderRight: '2px solid var(--walnut)',
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '34px',
                              }}
                            >
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={item.isCompleted}
                                aria-label={`Mark ${item.title} as ${item.isCompleted ? 'incomplete' : 'completed'}`}
                                onClick={() => handleToggle(item)}
                                onKeyDown={(e) => {
                                  if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    handleToggle(item);
                                  }
                                }}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  border: `2px solid var(--walnut)`,
                                  backgroundColor: item.isCompleted ? item.colorHex : '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: item.isCompleted ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                                  transition: 'background-color 0.15s ease',
                                }}
                              >
                                {item.isCompleted && (
                                  <span
                                    style={{
                                      color: '#ffffff',
                                      fontWeight: 700,
                                      fontSize: '14px',
                                      lineHeight: 1,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>
                        );
                      }

                      // Other days (display subtle check/blank cell)
                      return (
                        <td
                          key={`cell-${item.habitId}-${d.dayNumber}`}
                          style={{
                            textAlign: 'center',
                            padding: '2px',
                            color: '#b0a497',
                            fontSize: '0.75rem',
                          }}
                        >
                          <span style={{ opacity: 0.35 }}>·</span>
                        </td>
                      );
                    })}

                    {/* Right Column: Goal Achieved */}
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '8px 12px',
                        color: 'var(--walnut)',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ marginRight: '6px' }}>20</span>
                      <span
                        style={{
                          backgroundColor: item.isCompleted ? 'var(--papaya-whip)' : '#f0ece4',
                          color: 'var(--walnut)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                        }}
                      >
                        [ {item.isCompleted ? 1 : 0} ]
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Section: Notes Feed & + New Note */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--papaya-whip)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ color: 'var(--walnut)', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
              Notes
            </h3>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: '1px solid var(--walnut)',
                color: 'var(--walnut)',
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              + New Note
            </button>
          </div>

          <div
            style={{
              backgroundColor: '#fffcf7',
              border: '1px solid var(--papaya-whip)',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              {formattedDate} at 9:00 pm
            </div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)' }}>
              Completed daily habit checkoffs directly from the illuminated calendar column. Feeling motivated!
            </div>
          </div>
        </div>
      </div>

      {/* New Habit Creation Modal */}
      <NewHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onHabitCreated={handleHabitCreated}
        triggerElement={newHabitBtnRef.current}
      />
    </div>
  );
};
