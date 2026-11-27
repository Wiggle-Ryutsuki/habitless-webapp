import { getIsoDayOfWeek, isHabitScheduledForDate } from './frequency.js';

export interface DashboardHabitInput {
  id: number;
  title: string;
  category: string | null;
  colorHex: string;
  frequency: string;
  daysOfWeek: number[];
  startDate: Date | string;
  endDate: Date | string | null;
  isActive: boolean;
  programId: number | null;
}

export interface DashboardHabitLogInput {
  habitId: number;
  logDate: Date | string;
  completed: boolean;
}

export interface DashboardWeekDay {
  date: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
}

export interface DashboardFocusItem {
  habitId: number;
  title: string;
  category: string | null;
  colorHex: string;
  frequency: string;
  isCompleted: boolean;
}

export interface DashboardWeeklyProgressItem {
  habitId: number;
  title: string;
  category: string | null;
  colorHex: string;
  frequency: string;
  completedDaysThisWeek: number;
  scheduledDaysThisWeek: number;
  percentage: number;
}

export interface DashboardProgramCompletion {
  activeProgramsCount: number;
  totalCompletedLogs: number;
  totalScheduledDaysToDate: number;
  percentage: number;
}

export interface ParticipantDashboardResult {
  date: string;
  weekStart: string;
  weekEnd: string;
  weekDays: DashboardWeekDay[];
  todayFocus: {
    totalScheduled: number;
    completedCount: number;
    items: DashboardFocusItem[];
  };
  weeklyProgress: DashboardWeeklyProgressItem[];
  programCompletion: DashboardProgramCompletion;
}

const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Validates strict YYYY-MM-DD formatting and rejects calendar rollovers (e.g., 2026-02-31).
 */
export function isValidIsoDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * Normalizes a Date or date string to UTC midnight.
 */
export function toUtcMidnight(value: Date | string): Date {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Formats a Date or date string to YYYY-MM-DD in UTC.
 */
export function toUtcDateKey(value: Date | string): string {
  return toUtcMidnight(value).toISOString().split('T')[0];
}

/**
 * Returns a new UTC midnight Date shifted by `days`.
 */
export function addUtcDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days)
  );
}

/**
 * Builds the Monday-through-Sunday week window enclosing `anchorDateStr`.
 */
export function getMonToSunWeekWindow(anchorDateStr: string): {
  anchorDate: Date;
  weekStartDate: Date;
  weekEndDate: Date;
  weekStart: string;
  weekEnd: string;
  weekDays: DashboardWeekDay[];
} {
  const anchorDate = new Date(`${anchorDateStr}T00:00:00.000Z`);
  const isoDay = getIsoDayOfWeek(anchorDate); // 1 = Mon .. 7 = Sun
  const weekStartDate = addUtcDays(anchorDate, -(isoDay - 1));
  const weekEndDate = addUtcDays(weekStartDate, 6);

  const weekDays: DashboardWeekDay[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const dayDate = addUtcDays(weekStartDate, offset);
    const dateKey = toUtcDateKey(dayDate);
    weekDays.push({
      date: dateKey,
      dayLabel: WEEK_DAY_LABELS[offset],
      dayNumber: dayDate.getUTCDate(),
      isToday: dateKey === anchorDateStr,
    });
  }

  return {
    anchorDate,
    weekStartDate,
    weekEndDate,
    weekStart: toUtcDateKey(weekStartDate),
    weekEnd: toUtcDateKey(weekEndDate),
    weekDays,
  };
}

/**
 * Computes Today's Focus, Weekly Habit Progress Bars, and Global Program Completion.
 */
export function computeParticipantDashboard(
  habits: DashboardHabitInput[],
  logs: DashboardHabitLogInput[],
  anchorDateStr: string
): ParticipantDashboardResult {
  const { anchorDate, weekStart, weekEnd, weekDays } = getMonToSunWeekWindow(anchorDateStr);
  const activeHabits = habits.filter((h) => h.isActive);

  const completedLogKeys = new Set<string>();
  for (const log of logs) {
    if (log.completed) {
      completedLogKeys.add(`${log.habitId}:${toUtcDateKey(log.logDate)}`);
    }
  }

  // 1. Today's Focus Snippet (FR-S2-04)
  const focusItems: DashboardFocusItem[] = [];
  let focusCompletedCount = 0;
  for (const habit of activeHabits) {
    if (!isHabitScheduledForDate(habit, anchorDate)) {
      continue;
    }
    const isCompleted = completedLogKeys.has(`${habit.id}:${anchorDateStr}`);
    if (isCompleted) {
      focusCompletedCount++;
    }
    focusItems.push({
      habitId: habit.id,
      title: habit.title,
      category: habit.category,
      colorHex: habit.colorHex,
      frequency: habit.frequency,
      isCompleted,
    });
  }

  // 2. Weekly Habit Progress Bars (FR-S2-05, BR-S2-04)
  const weekDayDates = weekDays.map((wd) => new Date(`${wd.date}T00:00:00.000Z`));
  const weeklyProgress: DashboardWeeklyProgressItem[] = [];

  for (const habit of activeHabits) {
    let scheduledDaysThisWeek = 0;
    let completedDaysThisWeek = 0;

    for (let i = 0; i < weekDayDates.length; i++) {
      const dayDate = weekDayDates[i];
      if (!isHabitScheduledForDate(habit, dayDate)) {
        continue;
      }
      scheduledDaysThisWeek++;
      if (completedLogKeys.has(`${habit.id}:${weekDays[i].date}`)) {
        completedDaysThisWeek++;
      }
    }

    if (scheduledDaysThisWeek === 0) {
      continue;
    }

    const percentage = Math.min(
      100,
      Math.round((completedDaysThisWeek / scheduledDaysThisWeek) * 100)
    );

    weeklyProgress.push({
      habitId: habit.id,
      title: habit.title,
      category: habit.category,
      colorHex: habit.colorHex,
      frequency: habit.frequency,
      completedDaysThisWeek,
      scheduledDaysThisWeek,
      percentage,
    });
  }

  // 3. Global Program Completion Bar (FR-S2-06, BR-S2-11)
  const challengeHabits = activeHabits.filter(
    (h) => h.programId !== null && h.programId !== undefined
  );
  const activeProgramsCount = new Set(
    challengeHabits.map((h) => h.programId as number)
  ).size;

  let totalScheduledDaysToDate = 0;
  let totalCompletedLogs = 0;

  for (const habit of challengeHabits) {
    const rangeStart = toUtcMidnight(habit.startDate);
    const habitEnd = habit.endDate ? toUtcMidnight(habit.endDate) : null;
    const rangeEnd =
      habitEnd && habitEnd.getTime() < anchorDate.getTime() ? habitEnd : anchorDate;

    if (rangeStart.getTime() > rangeEnd.getTime()) {
      continue;
    }

    for (
      let cursor = rangeStart;
      cursor.getTime() <= rangeEnd.getTime();
      cursor = addUtcDays(cursor, 1)
    ) {
      if (!isHabitScheduledForDate(habit, cursor)) {
        continue;
      }
      totalScheduledDaysToDate++;
      if (completedLogKeys.has(`${habit.id}:${toUtcDateKey(cursor)}`)) {
        totalCompletedLogs++;
      }
    }
  }

  const programPercentage =
    totalScheduledDaysToDate === 0
      ? 0
      : Math.min(100, Math.round((totalCompletedLogs / totalScheduledDaysToDate) * 100));

  return {
    date: anchorDateStr,
    weekStart,
    weekEnd,
    weekDays,
    todayFocus: {
      totalScheduled: focusItems.length,
      completedCount: focusCompletedCount,
      items: focusItems,
    },
    weeklyProgress,
    programCompletion: {
      activeProgramsCount,
      totalCompletedLogs,
      totalScheduledDaysToDate,
      percentage: programPercentage,
    },
  };
}
