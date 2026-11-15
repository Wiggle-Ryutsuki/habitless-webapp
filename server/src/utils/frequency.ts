export interface HabitScheduleInput {
  frequency: string;
  daysOfWeek?: number[] | null;
  startDate: Date | string;
  endDate?: Date | string | null;
}

export function getIsoDayOfWeek(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function isLastDayOfMonth(date: Date): boolean {
  const nextDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return nextDay.getUTCDate() === 1;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function isHabitScheduledForDate(
  habit: HabitScheduleInput,
  queryDate: Date | string
): boolean {
  const qDate = new Date(queryDate);
  const sDate = new Date(habit.startDate);

  if (isNaN(qDate.getTime()) || isNaN(sDate.getTime())) {
    return false;
  }

  // Normalize to UTC date boundaries (midnight)
  const qUtc = Date.UTC(qDate.getUTCFullYear(), qDate.getUTCMonth(), qDate.getUTCDate());
  const sUtc = Date.UTC(sDate.getUTCFullYear(), sDate.getUTCMonth(), sDate.getUTCDate());

  // Check start date boundary
  if (qUtc < sUtc) {
    return false;
  }

  // Check end date boundary
  if (habit.endDate) {
    const eDate = new Date(habit.endDate);
    if (!isNaN(eDate.getTime())) {
      const eUtc = Date.UTC(eDate.getUTCFullYear(), eDate.getUTCMonth(), eDate.getUTCDate());
      if (qUtc > eUtc) {
        return false;
      }
    }
  }

  const isoDay = getIsoDayOfWeek(qDate);
  const days = Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : [];

  switch (habit.frequency) {
    case 'DAILY':
      return true;

    case 'WEEKDAYS':
      return isoDay >= 1 && isoDay <= 5;

    case 'THREE_TIMES_WEEKLY':
    case 'WEEKLY':
    case 'CUSTOM_DAYS':
      return days.includes(isoDay);

    case 'MONTHLY': {
      const targetDay = sDate.getUTCDate();
      const currentDay = qDate.getUTCDate();
      if (currentDay === targetDay) {
        return true;
      }
      // Shorter month fallback if start day > total days in current month
      const maxDaysInCurrentMonth = daysInMonth(qDate.getUTCFullYear(), qDate.getUTCMonth());
      if (targetDay > maxDaysInCurrentMonth && isLastDayOfMonth(qDate)) {
        return true;
      }
      return false;
    }

    default:
      return true;
  }
}

export function deriveFrequencyFromDays(selectedDays: number[]): string {
  const count = selectedDays.length;
  if (count >= 7) return 'DAILY';
  if (count === 5 && [1, 2, 3, 4, 5].every((d) => selectedDays.includes(d))) {
    return 'WEEKDAYS';
  }
  if (count === 3 && [1, 3, 5].every((d) => selectedDays.includes(d))) {
    return 'THREE_TIMES_WEEKLY';
  }
  if (count === 1) return 'WEEKLY';
  return 'CUSTOM_DAYS';
}

export function getDaysFromFrequency(frequency?: string | null, daysOfWeek?: number[] | null): number[] {
  if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
    return [...daysOfWeek].sort((a, b) => a - b);
  }
  if (frequency === 'WEEKDAYS') return [1, 2, 3, 4, 5];
  if (frequency === 'THREE_TIMES_WEEKLY') return [1, 3, 5];
  if (frequency === 'WEEKLY') return [1];
  return [1, 2, 3, 4, 5, 6, 7];
}


