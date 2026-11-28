import { daysInMonth, isHabitScheduledForDate } from './frequency.js';
import { addUtcDays, toUtcDateKey, toUtcMidnight } from './dashboard-calc.js';

export interface StatsHabitInput {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  colorHex: string;
  frequency: string;
  daysOfWeek: number[];
  startDate: Date | string;
  endDate: Date | string | null;
  targetCount: number;
  programId: number | null;
}

export interface StatsHabitLogInput {
  logDate: Date | string;
  completed: boolean;
}

export interface HabitHeatmapCell {
  key: string;
  label: string;
  scheduled: boolean;
  completedCount: number;
  scheduledCount: number;
  opacity: number;
  weekday?: number;
  weekIndex?: number;
  month?: number;
}

export interface HabitHeatmapData {
  mode: 'month' | 'year';
  month: number | null;
  year: number;
  cells: HabitHeatmapCell[];
}

export interface HabitStreakSummary {
  currentStreak: number;
  highestStreak: number;
}

export interface HabitStatsResult {
  habit: {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    colorHex: string;
    frequency: string;
    daysOfWeek: number[];
    startDate: string;
    endDate: string | null;
    targetCount: number;
    programId: number | null;
  };
  streaks: HabitStreakSummary;
  heatmap: HabitHeatmapData;
}

/**
 * Computes Current Streak and Highest Streak skipping non-scheduled days (BR-S2-05).
 */
export function computeHabitStreaks(
  habit: StatsHabitInput,
  completedSet: Set<string>,
  anchorToday: Date
): HabitStreakSummary {
  const habitStart = toUtcMidnight(habit.startDate);
  const habitEnd = habit.endDate ? toUtcMidnight(habit.endDate) : null;
  const effectiveStreakEnd =
    habitEnd && habitEnd.getTime() < anchorToday.getTime() ? habitEnd : anchorToday;

  if (habitStart.getTime() > effectiveStreakEnd.getTime()) {
    return { currentStreak: 0, highestStreak: 0 };
  }

  // 1. Highest Streak across [habitStart, effectiveStreakEnd]
  let runningStreak = 0;
  let highestStreak = 0;

  for (
    let cursor = habitStart;
    cursor.getTime() <= effectiveStreakEnd.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    if (!isHabitScheduledForDate(habit, cursor)) {
      continue;
    }
    if (completedSet.has(toUtcDateKey(cursor))) {
      runningStreak++;
      if (runningStreak > highestStreak) {
        highestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // 2. Current Streak walking backward from effectiveStreakEnd with unlogged anchorToday grace
  let currentStreak = 0;
  const anchorTodayKey = toUtcDateKey(anchorToday);

  for (
    let cursor = effectiveStreakEnd;
    cursor.getTime() >= habitStart.getTime();
    cursor = addUtcDays(cursor, -1)
  ) {
    const cursorKey = toUtcDateKey(cursor);
    if (
      cursorKey === anchorTodayKey &&
      isHabitScheduledForDate(habit, anchorToday) &&
      !completedSet.has(anchorTodayKey)
    ) {
      continue;
    }
    if (!isHabitScheduledForDate(habit, cursor)) {
      continue;
    }
    if (completedSet.has(cursorKey)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, highestStreak };
}

/**
 * Builds daily Month heatmap cells (0 or 1.0 opacity) for the requested month/year.
 */
export function buildMonthHeatmap(
  habit: StatsHabitInput,
  completedSet: Set<string>,
  year: number,
  month: number
): HabitHeatmapData {
  const totalDays = daysInMonth(year, month - 1);
  const cells: HabitHeatmapCell[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const dayDate = new Date(Date.UTC(year, month - 1, day));
    const key = toUtcDateKey(dayDate);
    const scheduled = isHabitScheduledForDate(habit, dayDate);
    const isCompleted = completedSet.has(key);

    cells.push({
      key,
      label: String(day),
      scheduled,
      completedCount: isCompleted ? 1 : 0,
      scheduledCount: scheduled ? 1 : 0,
      opacity: isCompleted ? 1.0 : 0,
    });
  }

  return {
    mode: 'month',
    month,
    year,
    cells,
  };
}

/**
 * Builds chronological 365/366 daily Year heatmap cells (Jan 1 - Dec 31)
 * aligned to a 7-row (Mon-Sun) x ~53-column GitHub/AniList contribution grid.
 */
export function buildYearHeatmap(
  habit: StatsHabitInput,
  completedSet: Set<string>,
  year: number,
  anchorToday: Date
): HabitHeatmapData {
  const cells: HabitHeatmapCell[] = [];
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1JsDay = jan1.getUTCDay();
  const jan1Weekday = jan1JsDay === 0 ? 7 : jan1JsDay;
  const leadingSpacers = jan1Weekday - 1;

  let dayIndex0 = 0;

  for (let month = 1; month <= 12; month++) {
    const totalDays = daysInMonth(year, month - 1);

    for (let day = 1; day <= totalDays; day++) {
      const dayDate = new Date(Date.UTC(year, month - 1, day));
      const key = toUtcDateKey(dayDate);
      const jsDay = dayDate.getUTCDay();
      const weekday = jsDay === 0 ? 7 : jsDay;
      const weekIndex = Math.floor((leadingSpacers + dayIndex0) / 7);
      const scheduled = isHabitScheduledForDate(habit, dayDate);
      const isFuture = dayDate.getTime() > anchorToday.getTime();
      const isCompleted = !isFuture && completedSet.has(key);

      cells.push({
        key,
        label: String(day),
        weekday,
        weekIndex,
        month,
        scheduled,
        completedCount: isCompleted ? 1 : 0,
        scheduledCount: scheduled ? 1 : 0,
        opacity: isCompleted ? 1.0 : 0,
      });

      dayIndex0++;
    }
  }

  return {
    mode: 'year',
    month: null,
    year,
    cells,
  };
}

/**
 * Computes streaks and Month/Year heatmap data for GET /api/habits/:id/stats.
 */
export function computeHabitStats(
  habit: StatsHabitInput,
  logs: StatsHabitLogInput[],
  options: {
    mode: 'month' | 'year';
    month: number;
    year: number;
    anchorTodayStr: string;
  }
): HabitStatsResult {
  const anchorToday = toUtcMidnight(options.anchorTodayStr);
  const completedSet = new Set<string>();

  for (const log of logs) {
    if (log.completed) {
      completedSet.add(toUtcDateKey(log.logDate));
    }
  }

  const streaks = computeHabitStreaks(habit, completedSet, anchorToday);
  const heatmap =
    options.mode === 'year'
      ? buildYearHeatmap(habit, completedSet, options.year, anchorToday)
      : buildMonthHeatmap(habit, completedSet, options.year, options.month);

  return {
    habit: {
      id: habit.id,
      title: habit.title,
      description: habit.description,
      category: habit.category,
      colorHex: habit.colorHex,
      frequency: habit.frequency,
      daysOfWeek: habit.daysOfWeek,
      startDate: new Date(habit.startDate).toISOString(),
      endDate: habit.endDate ? new Date(habit.endDate).toISOString() : null,
      targetCount: habit.targetCount,
      programId: habit.programId,
    },
    streaks,
    heatmap,
  };
}
