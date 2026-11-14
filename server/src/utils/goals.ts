export interface LogRecord {
  logDate: Date | string;
  completed: boolean;
}

/**
 * Calculates monthly goal achievements for a habit.
 * Aggregates the count of completed logs within the specified month/year.
 *
 * @param logs Array of habit completion log records
 * @param targetCount Target completions for the month (clamped between 1 and 31)
 * @param month Target calendar month (1-12)
 * @param year Target calendar year (4-digit)
 */
export function calculateMonthlyGoals(
  logs: LogRecord[],
  targetCount: number,
  month?: number,
  year?: number
): { achieved: number; target: number } {
  let achievedCount = 0;

  for (const log of logs) {
    if (!log.completed) continue;
    const date = new Date(log.logDate);
    if (isNaN(date.getTime())) continue;

    if (month !== undefined && year !== undefined) {
      if (date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month) {
        achievedCount++;
      }
    } else {
      achievedCount++;
    }
  }

  const rawTarget = typeof targetCount === 'number' && !isNaN(targetCount) ? targetCount : 20;
  const normalizedTarget = Math.max(1, Math.min(31, Math.floor(rawTarget)));

  return {
    achieved: achievedCount,
    target: normalizedTarget,
  };
}
