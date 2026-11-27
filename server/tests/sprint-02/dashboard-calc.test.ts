import { describe, it, expect } from 'vitest';
import {
  computeParticipantDashboard,
  DashboardHabitInput,
  DashboardHabitLogInput,
  getMonToSunWeekWindow,
  isValidIsoDateString,
} from '../../src/utils/dashboard-calc.js';
import { isHabitScheduledForDate } from '../../src/utils/frequency.js';

describe('Dashboard Calculation Utilities (UT-S2-03)', () => {
  it('validates strict YYYY-MM-DD calendar dates and rejects rollovers', () => {
    expect(isValidIsoDateString('2026-11-26')).toBe(true);
    expect(isValidIsoDateString('2024-02-29')).toBe(true);
    expect(isValidIsoDateString('2026-02-31')).toBe(false);
    expect(isValidIsoDateString('2026-13-01')).toBe(false);
    expect(isValidIsoDateString('26-11-2026')).toBe(false);
    expect(isValidIsoDateString('invalid-date')).toBe(false);
  });

  it('computes Mon-Sun week boundaries across mid-week, Monday, Sunday, and year transitions', () => {
    const midWeek = getMonToSunWeekWindow('2026-11-26'); // Thu
    expect(midWeek.weekStart).toBe('2026-11-23');
    expect(midWeek.weekEnd).toBe('2026-11-29');
    expect(midWeek.weekDays).toHaveLength(7);
    expect(midWeek.weekDays[0]).toEqual({
      date: '2026-11-23',
      dayLabel: 'Mon',
      dayNumber: 23,
      isToday: false,
    });
    expect(midWeek.weekDays[3]).toEqual({
      date: '2026-11-26',
      dayLabel: 'Thu',
      dayNumber: 26,
      isToday: true,
    });
    expect(midWeek.weekDays[6].dayLabel).toBe('Sun');

    const sunday = getMonToSunWeekWindow('2026-11-29');
    expect(sunday.weekStart).toBe('2026-11-23');
    expect(sunday.weekEnd).toBe('2026-11-29');
    expect(sunday.weekDays[6].isToday).toBe(true);

    const yearBoundary = getMonToSunWeekWindow('2026-12-31'); // Thu
    expect(yearBoundary.weekStart).toBe('2026-12-28');
    expect(yearBoundary.weekEnd).toBe('2027-01-03');
  });

  it('evaluates weekly habit progress across DAILY, WEEKDAYS, THREE_TIMES_WEEKLY, CUSTOM_DAYS, WEEKLY, and mid-week bounds', () => {
    const habits: DashboardHabitInput[] = [
      {
        id: 1,
        title: 'Daily Walk',
        category: 'Health & Fitness',
        colorHex: '#448aff',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: null,
        isActive: true,
        programId: null,
      },
      {
        id: 2,
        title: 'Weekday Focus',
        category: 'Productivity',
        colorHex: '#ff9800',
        frequency: 'WEEKDAYS',
        daysOfWeek: [1, 2, 3, 4, 5],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: null,
        isActive: true,
        programId: null,
      },
      {
        id: 3,
        title: 'MWF Strength',
        category: null,
        colorHex: '#009688',
        frequency: 'THREE_TIMES_WEEKLY',
        daysOfWeek: [1, 3, 5],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: null,
        isActive: true,
        programId: null,
      },
      {
        id: 4,
        title: 'Tue/Thu/Sat Reading',
        category: 'Learning',
        colorHex: '#1565c0',
        frequency: 'CUSTOM_DAYS',
        daysOfWeek: [2, 4, 6],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: null,
        isActive: true,
        programId: null,
      },
      {
        id: 5,
        title: 'Weekly Review',
        category: 'Mindfulness',
        colorHex: '#8bc34a',
        frequency: 'WEEKLY',
        daysOfWeek: [7], // Sun
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: null,
        isActive: true,
        programId: null,
      },
      {
        id: 6,
        title: 'Mid-Week Daily Start',
        category: 'Sleep & Recovery',
        colorHex: '#ffc107',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-26T00:00:00.000Z', // Thursday -> 4 scheduled days (Thu..Sun)
        endDate: null,
        isActive: true,
        programId: null,
      },
      {
        id: 7,
        title: 'Future Habit',
        category: null,
        colorHex: '#f44336',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-12-01T00:00:00.000Z', // Outside week -> excluded
        endDate: null,
        isActive: true,
        programId: null,
      },
    ];

    const logs: DashboardHabitLogInput[] = [
      // Daily Walk: Mon, Tue, Thu (3/7)
      { habitId: 1, logDate: '2026-11-23', completed: true },
      { habitId: 1, logDate: '2026-11-24', completed: true },
      { habitId: 1, logDate: '2026-11-26', completed: true },
      // Weekday Focus: Mon, Wed, Sat (Sat is unscheduled -> ignored in numerator) => 2/5
      { habitId: 2, logDate: '2026-11-23', completed: true },
      { habitId: 2, logDate: '2026-11-25', completed: true },
      { habitId: 2, logDate: '2026-11-28', completed: true },
      // Mid-Week Daily Start: Thu => 1/4
      { habitId: 6, logDate: '2026-11-26', completed: true },
    ];

    const result = computeParticipantDashboard(habits, logs, '2026-11-26'); // Thu

    // Today's Focus (Thu): Daily Walk, Weekday Focus, Tue/Thu/Sat Reading, Mid-Week Daily Start
    expect(result.todayFocus.totalScheduled).toBe(4);
    expect(result.todayFocus.completedCount).toBe(2);
    expect(result.todayFocus.items.map((i) => i.habitId)).toEqual([1, 2, 4, 6]);

    // Weekly Progress
    expect(result.weeklyProgress.find((w) => w.habitId === 7)).toBeUndefined();
    expect(result.weeklyProgress.find((w) => w.habitId === 1)).toMatchObject({
      completedDaysThisWeek: 3,
      scheduledDaysThisWeek: 7,
      percentage: 43,
    });
    expect(result.weeklyProgress.find((w) => w.habitId === 2)).toMatchObject({
      completedDaysThisWeek: 2,
      scheduledDaysThisWeek: 5,
      percentage: 40,
    });
    expect(result.weeklyProgress.find((w) => w.habitId === 3)).toMatchObject({
      completedDaysThisWeek: 0,
      scheduledDaysThisWeek: 3,
      percentage: 0,
    });
    expect(result.weeklyProgress.find((w) => w.habitId === 4)?.scheduledDaysThisWeek).toBe(3);
    expect(result.weeklyProgress.find((w) => w.habitId === 5)?.scheduledDaysThisWeek).toBe(1);
    expect(result.weeklyProgress.find((w) => w.habitId === 6)).toMatchObject({
      completedDaysThisWeek: 1,
      scheduledDaysThisWeek: 4,
      percentage: 25,
    });
  });

  it('computes global programCompletion across active challenge habits and guards 0 denominator', () => {
    const emptyRes = computeParticipantDashboard([], [], '2026-11-26');
    expect(emptyRes.programCompletion).toEqual({
      activeProgramsCount: 0,
      totalCompletedLogs: 0,
      totalScheduledDaysToDate: 0,
      percentage: 0,
    });

    const habits: DashboardHabitInput[] = [
      {
        id: 10,
        title: 'Challenge Daily',
        category: 'Health & Fitness',
        colorHex: '#448aff',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-23T00:00:00.000Z', // Mon -> Thu (4 scheduled days through 2026-11-26)
        endDate: '2026-11-30T00:00:00.000Z',
        isActive: true,
        programId: 50,
      },
      {
        id: 11,
        title: 'Challenge Ended Yesterday',
        category: 'Health & Fitness',
        colorHex: '#009688',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-23T00:00:00.000Z',
        endDate: '2026-11-25T00:00:00.000Z', // Mon..Wed (3 scheduled days)
        isActive: true,
        programId: 50,
      },
      {
        id: 12,
        title: 'Archived Challenge Habit',
        category: 'Health & Fitness',
        colorHex: '#ff9800',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-23T00:00:00.000Z',
        endDate: null,
        isActive: false, // Ignored
        programId: 51,
      },
    ];

    const logs: DashboardHabitLogInput[] = [
      { habitId: 10, logDate: '2026-11-23', completed: true },
      { habitId: 10, logDate: '2026-11-24', completed: true },
      { habitId: 10, logDate: '2026-11-27', completed: true }, // Future relative to anchor 2026-11-26 -> ignored
      { habitId: 11, logDate: '2026-11-23', completed: true },
      { habitId: 11, logDate: '2026-11-25', completed: true },
      { habitId: 11, logDate: '2026-11-26', completed: true }, // After habit endDate -> ignored
    ];

    const res = computeParticipantDashboard(habits, logs, '2026-11-26');
    expect(res.programCompletion).toEqual({
      activeProgramsCount: 1,
      totalCompletedLogs: 4, // 2 + 2
      totalScheduledDaysToDate: 7, // 4 + 3
      percentage: 57,
    });
  });

  it('maintains parity defaults when daysOfWeek is empty on THREE_TIMES_WEEKLY and WEEKLY', () => {
    expect(
      isHabitScheduledForDate(
        {
          frequency: 'THREE_TIMES_WEEKLY',
          daysOfWeek: [],
          startDate: '2026-11-01T00:00:00.000Z',
        },
        '2026-11-23' // Mon
      )
    ).toBe(true);
    expect(
      isHabitScheduledForDate(
        {
          frequency: 'WEEKLY',
          daysOfWeek: [],
          startDate: '2026-11-01T00:00:00.000Z',
        },
        '2026-11-23' // Mon
      )
    ).toBe(true);
  });
});
