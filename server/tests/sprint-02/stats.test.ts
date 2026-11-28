import { describe, it, expect } from 'vitest';
import {
  computeHabitStats,
  StatsHabitInput,
  StatsHabitLogInput,
} from '../../src/utils/habit-stats.js';

describe('Habit Streaks & Heatmap Computation (UT-S2-02)', () => {
  const makeHabit = (overrides: Partial<StatsHabitInput> = {}): StatsHabitInput => ({
    id: 101,
    title: 'Journal',
    description: 'Daily notes',
    category: 'Mindfulness',
    colorHex: '#ff9800',
    frequency: 'DAILY',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: null,
    targetCount: 20,
    programId: null,
    ...overrides,
  });

  it('computes 0/0 streaks when brand-new habit has 0 logs', () => {
    const res = computeHabitStats(makeHabit(), [], {
      mode: 'month',
      month: 11,
      year: 2026,
      anchorTodayStr: '2026-11-26',
    });

    expect(res.streaks).toEqual({ currentStreak: 0, highestStreak: 0 });
    expect(res.heatmap.mode).toBe('month');
    expect(res.heatmap.cells).toHaveLength(30);
    expect(res.heatmap.cells.every((c) => c.opacity === 0)).toBe(true);
  });

  it('skips non-due days without breaking streaks across THREE_TIMES_WEEKLY, WEEKDAYS, CUSTOM_DAYS, and WEEKLY', () => {
    // 2026-11-02 = Mon, 04 = Wed, 06 = Fri, 09 = Mon, 11 = Wed, 13 = Fri, 16 = Mon (missed!), 18 = Wed, 20 = Fri, 23 = Mon, 25 = Wed
    // anchorToday = Thu 2026-11-26 (non-due day)
    const mwfHabit = makeHabit({
      frequency: 'THREE_TIMES_WEEKLY',
      daysOfWeek: [1, 3, 5],
      startDate: '2026-11-02T00:00:00.000Z',
    });

    const logs: StatsHabitLogInput[] = [
      // Run of 6 consecutive scheduled days
      { logDate: '2026-11-02', completed: true },
      { logDate: '2026-11-04', completed: true },
      { logDate: '2026-11-06', completed: true },
      { logDate: '2026-11-09', completed: true },
      { logDate: '2026-11-11', completed: true },
      { logDate: '2026-11-13', completed: true },
      // Missed 2026-11-16 (Mon)
      // Current streak of 4 consecutive scheduled days
      { logDate: '2026-11-18', completed: true },
      { logDate: '2026-11-20', completed: true },
      { logDate: '2026-11-23', completed: true },
      { logDate: '2026-11-25', completed: true },
    ];

    const mwfRes = computeHabitStats(mwfHabit, logs, {
      mode: 'month',
      month: 11,
      year: 2026,
      anchorTodayStr: '2026-11-26',
    });
    expect(mwfRes.streaks).toEqual({ currentStreak: 4, highestStreak: 6 });

    // WEEKDAYS skipping Sat/Sun: Fri Nov 20, Mon Nov 23, Tue Nov 24, Wed Nov 25, anchorToday Thu Nov 26 unlogged (grace rule)
    const weekdayHabit = makeHabit({
      frequency: 'WEEKDAYS',
      daysOfWeek: [1, 2, 3, 4, 5],
      startDate: '2026-11-20T00:00:00.000Z',
    });
    const weekdayLogs: StatsHabitLogInput[] = [
      { logDate: '2026-11-20', completed: true },
      { logDate: '2026-11-23', completed: true },
      { logDate: '2026-11-24', completed: true },
      { logDate: '2026-11-25', completed: true },
    ];
    const weekdayRes = computeHabitStats(weekdayHabit, weekdayLogs, {
      mode: 'month',
      month: 11,
      year: 2026,
      anchorTodayStr: '2026-11-26',
    });
    expect(weekdayRes.streaks).toEqual({ currentStreak: 4, highestStreak: 4 });

    // CUSTOM_DAYS & WEEKLY
    const customHabit = makeHabit({
      frequency: 'CUSTOM_DAYS',
      daysOfWeek: [2, 4], // Tue, Thu
      startDate: '2026-11-17T00:00:00.000Z', // Tue
    });
    const customRes = computeHabitStats(
      customHabit,
      [
        { logDate: '2026-11-17', completed: true },
        { logDate: '2026-11-19', completed: true },
        { logDate: '2026-11-24', completed: true },
        { logDate: '2026-11-26', completed: true },
      ],
      { mode: 'month', month: 11, year: 2026, anchorTodayStr: '2026-11-26' }
    );
    expect(customRes.streaks).toEqual({ currentStreak: 4, highestStreak: 4 });

    const weeklyHabit = makeHabit({
      frequency: 'WEEKLY',
      daysOfWeek: [1], // Mon
      startDate: '2026-11-09T00:00:00.000Z',
    });
    const weeklyRes = computeHabitStats(
      weeklyHabit,
      [
        { logDate: '2026-11-09', completed: true },
        { logDate: '2026-11-16', completed: true },
        { logDate: '2026-11-23', completed: true },
      ],
      { mode: 'month', month: 11, year: 2026, anchorTodayStr: '2026-11-26' }
    );
    expect(weeklyRes.streaks).toEqual({ currentStreak: 3, highestStreak: 3 });
  });

  it('generates Month Mode cells across leap-year Feb and reflects off-day completions accurately', () => {
    const weekdayHabit = makeHabit({
      frequency: 'WEEKDAYS',
      daysOfWeek: [1, 2, 3, 4, 5],
      startDate: '2024-02-01T00:00:00.000Z',
    });

    // 2024-02-03 is Saturday (unscheduled), logged as completed
    const res = computeHabitStats(
      weekdayHabit,
      [
        { logDate: '2024-02-01', completed: true },
        { logDate: '2024-02-03', completed: true },
      ],
      {
        mode: 'month',
        month: 2,
        year: 2024,
        anchorTodayStr: '2024-02-29',
      }
    );

    expect(res.heatmap.cells).toHaveLength(29);
    const feb1 = res.heatmap.cells.find((c) => c.key === '2024-02-01');
    const feb3 = res.heatmap.cells.find((c) => c.key === '2024-02-03');
    const feb4 = res.heatmap.cells.find((c) => c.key === '2024-02-04');

    expect(feb1).toMatchObject({ scheduled: true, completedCount: 1, opacity: 1.0 });
    expect(feb3).toMatchObject({ scheduled: false, completedCount: 1, opacity: 1.0 });
    expect(feb4).toMatchObject({ scheduled: false, completedCount: 0, opacity: 0 });
  });

  it('generates 365/366 daily Year Mode cells (Jan 1 - Dec 31) with weekday/weekIndex alignment and 0/1.0 opacity', () => {
    const dailyHabit = makeHabit({
      startDate: '2026-11-01T00:00:00.000Z',
    });

    const logs: StatsHabitLogInput[] = [
      { logDate: '2026-11-01', completed: true },
      { logDate: '2026-11-05', completed: true },
      // Future log past anchorToday should remain opacity: 0
      { logDate: '2026-12-01', completed: true },
    ];

    const res2026 = computeHabitStats(dailyHabit, logs, {
      mode: 'year',
      month: 11,
      year: 2026,
      anchorTodayStr: '2026-11-10',
    });

    expect(res2026.heatmap.mode).toBe('year');
    expect(res2026.heatmap.month).toBeNull();
    expect(res2026.heatmap.cells).toHaveLength(365);

    // 2026-01-01 is Thursday (weekday 4), before startDate (2026-11-01)
    expect(res2026.heatmap.cells[0]).toMatchObject({
      key: '2026-01-01',
      label: '1',
      weekday: 4,
      weekIndex: 0,
      month: 1,
      scheduled: false,
      completedCount: 0,
      scheduledCount: 0,
      opacity: 0,
    });

    // 2026-11-01 is Sunday (weekday 7), weekIndex 43, completed -> opacity 1.0
    const nov1 = res2026.heatmap.cells.find((c) => c.key === '2026-11-01');
    expect(nov1).toMatchObject({
      key: '2026-11-01',
      label: '1',
      weekday: 7,
      weekIndex: 43,
      month: 11,
      scheduled: true,
      completedCount: 1,
      scheduledCount: 1,
      opacity: 1.0,
    });

    // Unlogged scheduled day -> opacity 0
    const nov2 = res2026.heatmap.cells.find((c) => c.key === '2026-11-02');
    expect(nov2).toMatchObject({
      key: '2026-11-02',
      weekday: 1,
      weekIndex: 44,
      month: 11,
      scheduled: true,
      completedCount: 0,
      scheduledCount: 1,
      opacity: 0,
    });

    // Future date relative to anchorToday (2026-11-10) -> opacity 0
    const dec1 = res2026.heatmap.cells.find((c) => c.key === '2026-12-01');
    expect(dec1).toMatchObject({
      key: '2026-12-01',
      month: 12,
      completedCount: 0,
      opacity: 0,
    });

    expect(res2026.heatmap.cells[364]).toMatchObject({
      key: '2026-12-31',
      weekday: 4,
      weekIndex: 52,
      month: 12,
    });

    // Leap year 2024 (starts Monday -> weekday 1, 366 days ending Tuesday Dec 31 weekIndex 52)
    const leapHabit = makeHabit({
      startDate: '2024-01-01T00:00:00.000Z',
    });
    const res2024 = computeHabitStats(
      leapHabit,
      [{ logDate: '2024-02-29', completed: true }],
      {
        mode: 'year',
        month: 2,
        year: 2024,
        anchorTodayStr: '2024-03-01',
      }
    );
    expect(res2024.heatmap.cells).toHaveLength(366);
    expect(res2024.heatmap.cells[0]).toMatchObject({
      key: '2024-01-01',
      weekday: 1,
      weekIndex: 0,
      month: 1,
    });
    expect(res2024.heatmap.cells.find((c) => c.key === '2024-02-29')).toMatchObject({
      completedCount: 1,
      scheduledCount: 1,
      opacity: 1.0,
    });
    expect(res2024.heatmap.cells[365]).toMatchObject({
      key: '2024-12-31',
      weekday: 2,
      weekIndex: 52,
      month: 12,
    });
  });
});
