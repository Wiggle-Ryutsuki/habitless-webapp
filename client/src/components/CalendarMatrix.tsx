import React, { useState, useEffect } from 'react';
import { CalendarHabit, CalendarMatrixResponse } from '../types/habit.js';
import { fetchCalendarMatrix, toggleHabitCompletion } from '../services/habits.service.js';

export interface CalendarMatrixProps {
  initialMonth?: number;
  initialYear?: number;
  onEditHabit: (habit: CalendarHabit) => void;
  onNewHabitClick?: () => void;
  refreshKey?: number;
}

export const CalendarMatrix: React.FC<CalendarMatrixProps> = ({
  initialMonth,
  initialYear,
  onEditHabit,
  onNewHabitClick,
  refreshKey,
}) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(() => initialMonth || now.getUTCMonth() + 1);
  const [currentYear, setCurrentYear] = useState(() => initialYear || now.getUTCFullYear());

  const [matrixData, setMatrixData] = useState<CalendarMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load calendar matrix on month/year/refreshKey change
  useEffect(() => {
    let isCancelled = false;
    const loadMatrix = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchCalendarMatrix(currentMonth, currentYear);
        if (!isCancelled) {
          setMatrixData(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Unable to load calendar data.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMatrix();
    return () => {
      isCancelled = true;
    };
  }, [currentMonth, currentYear, refreshKey]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Check if a given day is "today"
  const todayUtc = new Date();
  const isCurrentMonthAndYear =
    todayUtc.getUTCFullYear() === currentYear && todayUtc.getUTCMonth() + 1 === currentMonth;
  const todayDayNum = todayUtc.getUTCDate();

  // Max allowed log date: tomorrow UTC
  const maxAllowedDate = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate() + 1));

  const isFutureDay = (day: number) => {
    const targetDate = new Date(Date.UTC(currentYear, currentMonth - 1, day));
    return targetDate.getTime() > maxAllowedDate.getTime();
  };

  // Toggle cell completion
  const handleCellClick = async (habit: CalendarHabit, day: number) => {
    if (isFutureDay(day)) {
      setToastMessage('Future dates cannot be logged yet.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const dayKey = String(day);
    const wasCompleted = !!habit.days[dayKey];
    const willBeCompleted = !wasCompleted;

    // Formatted date string YYYY-MM-DD
    const monthStr = String(currentMonth).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

    // Optimistic UI update
    setMatrixData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.habitId !== habit.habitId) return h;
          const updatedDays = { ...h.days, [dayKey]: willBeCompleted };
          const updatedAchieved = willBeCompleted ? h.goalAchievedCount + 1 : Math.max(0, h.goalAchievedCount - 1);
          return {
            ...h,
            days: updatedDays,
            goalAchievedCount: updatedAchieved,
          };
        }),
      };
    });

    try {
      await toggleHabitCompletion(habit.habitId, dateStr, willBeCompleted);
    } catch {
      // Rollback on error
      setToastMessage('Could not save log. Reverting.');
      setTimeout(() => setToastMessage(null), 3500);

      setMatrixData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          habits: prev.habits.map((h) => {
            if (h.habitId !== habit.habitId) return h;
            return {
              ...h,
              days: { ...h.days, [dayKey]: wasCompleted },
              goalAchievedCount: habit.goalAchievedCount,
            };
          }),
        };
      });
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthTitle = `${monthNames[currentMonth - 1]} ${currentYear}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#724319',
            color: '#feeac7',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(114, 67, 25, 0.3)',
            zIndex: 1100,
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Calendar Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(114, 67, 25, 0.06)',
          border: '1px solid #feeac7',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            style={{
              height: '36px',
              width: '36px',
              borderRadius: '6px',
              border: '1px solid #feeac7',
              backgroundColor: '#ffffff',
              color: '#724319',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            ‹
          </button>

          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              color: '#724319',
              fontWeight: 700,
              minWidth: '160px',
              textAlign: 'center',
            }}
          >
            {monthTitle}
          </h2>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            style={{
              height: '36px',
              width: '36px',
              borderRadius: '6px',
              border: '1px solid #feeac7',
              backgroundColor: '#ffffff',
              color: '#724319',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            ›
          </button>
        </div>

        {onNewHabitClick && (
          <button
            type="button"
            onClick={onNewHabitClick}
            style={{
              backgroundColor: '#724319',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(114, 67, 25, 0.2)',
            }}
          >
            + New Habit
          </button>
        )}
      </div>

      {/* Error State */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: '#feeac7',
            border: '1px solid #d88180',
            color: '#724319',
            padding: '14px 18px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => {
              setCurrentMonth((m) => m);
            }}
            style={{
              backgroundColor: '#724319',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !matrixData && (
        <div
          aria-busy="true"
          aria-label="Loading calendar matrix"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '32px',
            textAlign: 'center',
            color: '#724319',
            border: '1px solid #feeac7',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading habit tracking calendar...</div>
        </div>
      )}

      {/* Empty State: 0 Habits */}
      {!isLoading && matrixData && matrixData.habits.length === 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #feeac7',
            boxShadow: '0 2px 8px rgba(114, 67, 25, 0.04)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', color: '#724319', fontSize: '18px' }}>No habits created yet</h3>
          <p style={{ margin: '0 0 16px', color: '#724319', opacity: 0.75, fontSize: '14px' }}>
            Click &quot;+ New Habit&quot; to define your first habit and start tracking daily progress.
          </p>
          {onNewHabitClick && (
            <button
              type="button"
              onClick={onNewHabitClick}
              style={{
                backgroundColor: '#724319',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + New Habit
            </button>
          )}
        </div>
      )}

      {/* Desktop Calendar Grid Matrix */}
      {matrixData && matrixData.habits.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(114, 67, 25, 0.08)',
            border: '1px solid #feeac7',
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'center',
              fontSize: '13px',
              minWidth: '960px',
            }}
          >
            <thead>
              {/* Header Row 1: Day numbers */}
              <tr style={{ backgroundColor: '#fffdf9', borderBottom: '1px solid #feeac7' }}>
                <th
                  style={{
                    position: 'sticky',
                    left: 0,
                    backgroundColor: '#fffdf9',
                    zIndex: 2,
                    textAlign: 'left',
                    padding: '10px 14px',
                    color: '#724319',
                    fontWeight: 700,
                    width: '210px',
                    minWidth: '210px',
                    borderRight: '1px solid #feeac7',
                  }}
                >
                  HABITS
                </th>

                {Array.from({ length: matrixData.daysInMonth }, (_, i) => i + 1).map((d) => {
                  const isToday = isCurrentMonthAndYear && d === todayDayNum;
                  return (
                    <th
                      key={`day-num-${d}`}
                      aria-current={isToday ? 'date' : undefined}
                      style={{
                        padding: '6px 2px',
                        color: isToday ? '#ffffff' : '#724319',
                        backgroundColor: isToday ? '#724319' : 'transparent',
                        fontWeight: 700,
                        fontSize: '12px',
                        minWidth: '26px',
                        borderRight: '1px solid #fcf7ed',
                      }}
                    >
                      {d}
                    </th>
                  );
                })}

                <th
                  style={{
                    position: 'sticky',
                    right: 0,
                    backgroundColor: '#fffdf9',
                    zIndex: 2,
                    padding: '10px 14px',
                    color: '#724319',
                    fontWeight: 700,
                    width: '120px',
                    minWidth: '120px',
                    borderLeft: '1px solid #feeac7',
                  }}
                >
                  GOAL ACHIEVED
                </th>
              </tr>

              {/* Header Row 2: Day-of-week initials (M T W T F S S) */}
              <tr style={{ backgroundColor: '#fffbf3', borderBottom: '2px solid #feeac7' }}>
                <th
                  style={{
                    position: 'sticky',
                    left: 0,
                    backgroundColor: '#fffbf3',
                    zIndex: 2,
                    padding: '6px 14px',
                    borderRight: '1px solid #feeac7',
                  }}
                />

                {Array.from({ length: matrixData.daysInMonth }, (_, i) => i + 1).map((d, index) => {
                  const isToday = isCurrentMonthAndYear && d === todayDayNum;
                  const initial = matrixData.dayInitials[index] || 'M';
                  return (
                    <th
                      key={`day-initial-${d}`}
                      style={{
                        padding: '4px 2px',
                        color: isToday ? '#d88180' : '#724319',
                        fontWeight: 600,
                        fontSize: '11px',
                        opacity: isToday ? 1 : 0.7,
                        backgroundColor: isToday ? 'rgba(216, 129, 128, 0.15)' : 'transparent',
                        borderRight: '1px solid #fcf7ed',
                      }}
                    >
                      {initial}
                    </th>
                  );
                })}

                <th
                  style={{
                    position: 'sticky',
                    right: 0,
                    backgroundColor: '#fffbf3',
                    zIndex: 2,
                    padding: '6px 14px',
                    borderLeft: '1px solid #feeac7',
                  }}
                />
              </tr>
            </thead>

            <tbody>
              {matrixData.habits.map((h, habitIdx) => {
                const habitColor = h.colorHex || '#ff9800';
                return (
                  <tr
                    key={h.habitId}
                    style={{
                      borderBottom: '1px solid #feeac7',
                      backgroundColor: habitIdx % 2 === 0 ? '#ffffff' : '#fefcf8',
                    }}
                  >
                    {/* Habit Title Column (Sticky Left) */}
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        backgroundColor: habitIdx % 2 === 0 ? '#ffffff' : '#fefcf8',
                        zIndex: 1,
                        padding: '10px 14px',
                        textAlign: 'left',
                        borderRight: '1px solid #feeac7',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: habitColor,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            title={h.title}
                            style={{
                              color: '#724319',
                              fontWeight: 600,
                              fontSize: '13px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '120px',
                            }}
                          >
                            {h.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onEditHabit(h)}
                          aria-label={`Edit ${h.title}`}
                          style={{
                            background: 'transparent',
                            border: '1px solid #d88180',
                            color: '#724319',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>

                    {/* Day Cells 1..daysInMonth */}
                    {Array.from({ length: matrixData.daysInMonth }, (_, i) => i + 1).map((d) => {
                      const isCompleted = !!h.days[String(d)];
                      const isToday = isCurrentMonthAndYear && d === todayDayNum;
                      const isFuture = isFutureDay(d);

                      return (
                        <td
                          key={`cell-${h.habitId}-${d}`}
                          style={{
                            padding: '4px 2px',
                            backgroundColor: isToday ? 'rgba(202, 209, 130, 0.18)' : 'transparent',
                            borderRight: '1px solid #fcf7ed',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleCellClick(h, d)}
                            disabled={isFuture}
                            aria-label={`${h.title}, Day ${d}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              border: isCompleted
                                ? `1px solid ${habitColor}`
                                : isToday
                                ? '1px solid #724319'
                                : '1px solid #e0d8c8',
                              backgroundColor: isCompleted
                                ? habitColor
                                : isFuture
                                ? '#f5f5f5'
                                : 'transparent',
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: isFuture ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              lineHeight: 1,
                              outline: 'none',
                              opacity: isFuture ? 0.35 : 1,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isCompleted ? '✓' : ''}
                          </button>
                        </td>
                      );
                    })}

                    {/* Goal Achieved Column (Sticky Right) */}
                    <td
                      style={{
                        position: 'sticky',
                        right: 0,
                        backgroundColor: habitIdx % 2 === 0 ? '#ffffff' : '#fefcf8',
                        zIndex: 1,
                        padding: '10px 14px',
                        borderLeft: '1px solid #feeac7',
                        fontWeight: 600,
                        color: '#724319',
                      }}
                    >
                      <span style={{ marginRight: '6px', opacity: 0.85 }}>{h.targetCount}</span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor:
                            h.goalAchievedCount >= h.targetCount ? '#cad182' : 'rgba(216, 129, 128, 0.25)',
                          color: '#724319',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {h.goalAchievedCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

