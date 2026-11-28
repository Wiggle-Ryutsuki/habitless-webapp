import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header.js';
import {
  getFrequencyLabel,
  getInitialDaysOfWeek,
} from '../components/DayOfWeekSelector.js';
import { fetchHabitStats, HabitApiError } from '../services/habits.service.js';
import { HabitStatsResponse } from '../types/habit.js';

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const YEAR_ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''] as const;
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const EMPTY_TILE_BG = '#efe6da';
const EMPTY_TILE_BORDER = '1px solid rgba(114, 67, 25, 0.12)';
const YEAR_TILE_SIZE = 13;
const YEAR_TILE_GAP = 3;

function getMonthLeadingOffset(year: number, month: number): number {
  const jsDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun..6=Sat
  const isoDay = jsDay === 0 ? 7 : jsDay; // 1=Mon..7=Sun
  return isoDay - 1;
}

function getIsoWeekdayFromKey(dateKey: string): number {
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 1;
  const jsDay = parsed.getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getMonthFromKey(dateKey: string): number {
  const parts = dateKey.split('-');
  if (parts.length >= 2) {
    const parsedMonth = parseInt(parts[1], 10);
    if (parsedMonth >= 1 && parsedMonth <= 12) return parsedMonth;
  }
  return 1;
}

function formatMonthYearLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function isLightHexColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.68;
}

/**
 * Individual Habit Statistics page (/habits/:id/stats) with Streaks and Month/Year Heatmaps.
 */
export const HabitStatsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = id && /^\d+$/.test(id) ? parseInt(id, 10) : NaN;

  const now = new Date();
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [stats, setStats] = useState<HabitStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const localDateStr = new Date().toLocaleDateString('en-CA');

  const loadStats = async () => {
    if (isNaN(numericId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setError(null);

    try {
      const res = await fetchHabitStats(numericId, {
        mode,
        month: mode === 'month' ? month : undefined,
        year,
        date: localDateStr,
      });
      setStats(res);
    } catch (err) {
      if (err instanceof HabitApiError && err.code === 'HABIT_NOT_FOUND') {
        setNotFound(true);
      } else {
        setError(
          err instanceof Error ? err.message : 'Unable to load habit statistics.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [numericId, mode, month, year]);

  const handlePrevPeriod = () => {
    if (mode === 'year') {
      setYear((y) => y - 1);
      return;
    }
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextPeriod = () => {
    if (mode === 'year') {
      setYear((y) => y + 1);
      return;
    }
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const frequencyLabel = stats
    ? stats.habit.frequency === 'MONTHLY'
      ? 'Monthly'
      : getFrequencyLabel(
          getInitialDaysOfWeek(stats.habit.frequency, stats.habit.daysOfWeek)
        )
    : '';

  const leadingOffsets =
    stats && stats.heatmap.mode === 'month' && stats.heatmap.month
      ? getMonthLeadingOffset(stats.heatmap.year, stats.heatmap.month)
      : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
      <Header />

      <main
        style={{
          maxWidth: '960px',
          margin: '2rem auto',
          padding: '0 1rem 3rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div>
          <Link
            to="/habits"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '44px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--walnut)',
              color: 'var(--walnut)',
              borderRadius: '8px',
              padding: '0 1rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            &larr; Back to Habits
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
            Loading habit statistics...
          </div>
        )}

        {!isLoading && notFound && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--papaya-whip)',
              borderRadius: '12px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <h1 style={{ color: 'var(--walnut)', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
              Habit not found
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.25rem 0' }}>
              This habit does not exist, has been archived, or is unavailable.
            </p>
            <Link
              to="/habits"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
                backgroundColor: 'var(--walnut)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '0 1.25rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Back to Habits
            </Link>
          </div>
        )}

        {!isLoading && !notFound && error && (
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
              onClick={loadStats}
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

        {!isLoading && !notFound && !error && stats && (
          <>
            {/* Habit Header Metadata Card */}
            <section
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--papaya-whip)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span
                  data-testid="stats-color-chip"
                  aria-hidden="true"
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: stats.habit.colorHex,
                    flexShrink: 0,
                  }}
                />
                <h1
                  style={{
                    margin: 0,
                    color: 'var(--walnut)',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                  }}
                >
                  {stats.habit.title}
                </h1>
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
                  {stats.habit.category || 'Uncategorized'}
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
                  {frequencyLabel}
                </span>
              </div>
              {stats.habit.description && (
                <p
                  style={{
                    margin: '0.75rem 0 0 0',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9375rem',
                  }}
                >
                  {stats.habit.description}
                </p>
              )}
            </section>

            {/* Streak Counters */}
            <section
              aria-label="Habit streak counters"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--walnut)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Current Streak
                </div>
                <div
                  data-testid="current-streak-value"
                  style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--walnut)', marginTop: '0.25rem' }}
                >
                  {stats.streaks.currentStreak} {stats.streaks.currentStreak === 1 ? 'day' : 'days'}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--papaya-whip)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 16px rgba(114, 67, 25, 0.06)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Highest Streak
                </div>
                <div
                  data-testid="highest-streak-value"
                  style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--walnut)', marginTop: '0.25rem' }}
                >
                  {stats.streaks.highestStreak} {stats.streaks.highestStreak === 1 ? 'day' : 'days'}
                </div>
              </div>
            </section>

            {/* Completion Heatmap Card */}
            <section
              aria-labelledby="heatmap-heading"
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
                  gap: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <h2
                  id="heatmap-heading"
                  style={{
                    color: 'var(--walnut)',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Completion Heatmap
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Mode Toggle */}
                  <div
                    role="group"
                    aria-label="Heatmap view mode"
                    style={{
                      display: 'inline-flex',
                      border: '1px solid var(--walnut)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      aria-pressed={mode === 'month'}
                      onClick={() => setMode('month')}
                      style={{
                        minHeight: '44px',
                        padding: '0 1rem',
                        border: 'none',
                        backgroundColor: mode === 'month' ? 'var(--walnut)' : '#ffffff',
                        color: mode === 'month' ? '#ffffff' : 'var(--walnut)',
                        fontWeight: 600,
                      }}
                    >
                      Month
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === 'year'}
                      onClick={() => setMode('year')}
                      style={{
                        minHeight: '44px',
                        padding: '0 1rem',
                        border: 'none',
                        borderLeft: '1px solid var(--walnut)',
                        backgroundColor: mode === 'year' ? 'var(--walnut)' : '#ffffff',
                        color: mode === 'year' ? '#ffffff' : 'var(--walnut)',
                        fontWeight: 600,
                      }}
                    >
                      Year
                    </button>
                  </div>

                  {/* Period Navigation */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handlePrevPeriod}
                      aria-label={mode === 'year' ? 'Previous year' : 'Previous month'}
                      style={{
                        minWidth: '44px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: '1px solid var(--papaya-whip)',
                        backgroundColor: '#fffaf0',
                        color: 'var(--walnut)',
                        fontWeight: 700,
                      }}
                    >
                      &lsaquo;
                    </button>
                    <span
                      data-testid="heatmap-period-label"
                      style={{
                        minWidth: mode === 'year' ? '64px' : '130px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'var(--walnut)',
                      }}
                    >
                      {mode === 'year'
                        ? String(stats.heatmap.year)
                        : formatMonthYearLabel(
                            stats.heatmap.year,
                            stats.heatmap.month || month
                          )}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextPeriod}
                      aria-label={mode === 'year' ? 'Next year' : 'Next month'}
                      style={{
                        minWidth: '44px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: '1px solid var(--papaya-whip)',
                        backgroundColor: '#fffaf0',
                        color: 'var(--walnut)',
                        fontWeight: 700,
                      }}
                    >
                      &rsaquo;
                    </button>
                  </div>
                </div>
              </div>

              {stats.heatmap.mode === 'month' ? (
                <div>
                  <div style={{ maxWidth: '352px', margin: '0 auto' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(36px, 44px))',
                        gap: '6px',
                        marginBottom: '6px',
                      }}
                    >
                      {WEEKDAY_HEADERS.map((wd) => (
                        <div
                          key={wd}
                          style={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {wd}
                        </div>
                      ))}
                    </div>

                    <div
                      role="grid"
                      aria-label="Monthly completion heatmap"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(36px, 44px))',
                        gap: '6px',
                      }}
                    >
                      {Array.from({ length: leadingOffsets }, (_, idx) => (
                        <div key={`spacer-${idx}`} aria-hidden="true" />
                      ))}

                      {stats.heatmap.cells.map((cell) => {
                        const tooltipText =
                          cell.completedCount > 0
                            ? `${cell.key}: Completed`
                            : `${cell.key}: Not completed`;
                        const useDarkText =
                          cell.opacity === 0 || isLightHexColor(stats.habit.colorHex);

                        return (
                          <div
                            key={cell.key}
                            role="gridcell"
                            tabIndex={0}
                            title={tooltipText}
                            aria-label={tooltipText}
                            style={{
                              position: 'relative',
                              aspectRatio: '1 / 1',
                              minHeight: '36px',
                              borderRadius: '6px',
                              border: EMPTY_TILE_BORDER,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              backgroundColor: EMPTY_TILE_BG,
                            }}
                          >
                            <span
                              data-testid={`heatmap-fill-${cell.key}`}
                              aria-hidden="true"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: stats.habit.colorHex,
                                opacity: cell.opacity,
                              }}
                            />
                            <span
                              style={{
                                position: 'relative',
                                zIndex: 1,
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                color: useDarkText ? 'var(--color-text-main)' : '#ffffff',
                              }}
                            >
                              {cell.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  const yearCells = stats.heatmap.cells;
                  const yearLeadingOffsets =
                    yearCells.length > 0
                      ? (yearCells[0].weekday ?? getIsoWeekdayFromKey(yearCells[0].key)) - 1
                      : getMonthLeadingOffset(stats.heatmap.year, 1);

                  const totalColumns =
                    yearCells.length > 0
                      ? Math.max(
                          ...yearCells.map(
                            (cell, idx) =>
                              cell.weekIndex ?? Math.floor((yearLeadingOffsets + idx) / 7)
                          )
                        ) + 1
                      : 53;

                  const monthHeaderMap = new Map<number, number>();
                  yearCells.forEach((cell, idx) => {
                    const m = cell.month ?? getMonthFromKey(cell.key);
                    if (!monthHeaderMap.has(m)) {
                      const colIdx =
                        cell.weekIndex ?? Math.floor((yearLeadingOffsets + idx) / 7);
                      monthHeaderMap.set(m, colIdx);
                    }
                  });

                  const monthHeaders = Array.from(monthHeaderMap.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([monthNum, colIndex]) => ({
                      monthNum,
                      label: MONTH_LABELS[monthNum - 1] ?? String(monthNum),
                      colIndex,
                    }));

                  return (
                    <div>
                      <div
                        data-testid="year-heatmap-scroll-container"
                        style={{
                          overflowX: 'auto',
                          paddingBottom: '0.375rem',
                        }}
                      >
                        <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
                          {/* Top Month Labels */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px',
                            }}
                          >
                            <div style={{ width: '28px', flexShrink: 0 }} aria-hidden="true" />
                            <div
                              aria-label="Year heatmap month headers"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${totalColumns}, ${YEAR_TILE_SIZE}px)`,
                                gap: `${YEAR_TILE_GAP}px`,
                              }}
                            >
                              {monthHeaders.map((mh) => (
                                <span
                                  key={mh.monthNum}
                                  style={{
                                    gridColumnStart: mh.colIndex + 1,
                                    gridRowStart: 1,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-muted)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'visible',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {mh.label}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Left Weekday Labels + 7-row x ~53-col Daily Contribution Matrix */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div
                              aria-hidden="true"
                              style={{
                                width: '28px',
                                flexShrink: 0,
                                display: 'grid',
                                gridTemplateRows: `repeat(7, ${YEAR_TILE_SIZE}px)`,
                                gap: `${YEAR_TILE_GAP}px`,
                              }}
                            >
                              {YEAR_ROW_LABELS.map((rowLabel, rowIdx) => (
                                <span
                                  key={rowIdx}
                                  style={{
                                    height: `${YEAR_TILE_SIZE}px`,
                                    lineHeight: `${YEAR_TILE_SIZE}px`,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-muted)',
                                    textAlign: 'right',
                                  }}
                                >
                                  {rowLabel}
                                </span>
                              ))}
                            </div>

                            <div
                              role="grid"
                              aria-label="Yearly completion heatmap"
                              style={{
                                display: 'grid',
                                gridAutoFlow: 'column',
                                gridTemplateRows: `repeat(7, ${YEAR_TILE_SIZE}px)`,
                                gridAutoColumns: `${YEAR_TILE_SIZE}px`,
                                gap: `${YEAR_TILE_GAP}px`,
                              }}
                            >
                              {Array.from({ length: yearLeadingOffsets }, (_, idx) => (
                                <div
                                  key={`year-spacer-${idx}`}
                                  data-testid="year-heatmap-spacer"
                                  aria-hidden="true"
                                  style={{
                                    width: `${YEAR_TILE_SIZE}px`,
                                    height: `${YEAR_TILE_SIZE}px`,
                                  }}
                                />
                              ))}

                              {yearCells.map((cell) => {
                                const tooltipText =
                                  cell.completedCount > 0
                                    ? `${cell.key}: Completed`
                                    : `${cell.key}: Not completed`;

                                return (
                                  <div
                                    key={cell.key}
                                    role="gridcell"
                                    tabIndex={0}
                                    title={tooltipText}
                                    aria-label={tooltipText}
                                    style={{
                                      position: 'relative',
                                      width: `${YEAR_TILE_SIZE}px`,
                                      height: `${YEAR_TILE_SIZE}px`,
                                      borderRadius: '3px',
                                      border: EMPTY_TILE_BORDER,
                                      backgroundColor: EMPTY_TILE_BG,
                                      overflow: 'hidden',
                                      boxSizing: 'border-box',
                                    }}
                                  >
                                    <span
                                      data-testid={`heatmap-fill-${cell.key}`}
                                      aria-hidden="true"
                                      style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: stats.habit.colorHex,
                                        opacity: cell.opacity,
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Year Mode Legend */}
                      <div
                        aria-label="Heatmap legend"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.875rem',
                          marginTop: '0.875rem',
                          flexWrap: 'wrap',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: `${YEAR_TILE_SIZE}px`,
                              height: `${YEAR_TILE_SIZE}px`,
                              borderRadius: '3px',
                              border: EMPTY_TILE_BORDER,
                              backgroundColor: EMPTY_TILE_BG,
                              display: 'inline-block',
                            }}
                          />
                          <span>Not completed</span>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: `${YEAR_TILE_SIZE}px`,
                              height: `${YEAR_TILE_SIZE}px`,
                              borderRadius: '3px',
                              border: EMPTY_TILE_BORDER,
                              backgroundColor: stats.habit.colorHex,
                              opacity: 1,
                              display: 'inline-block',
                            }}
                          />
                          <span>Completed</span>
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
