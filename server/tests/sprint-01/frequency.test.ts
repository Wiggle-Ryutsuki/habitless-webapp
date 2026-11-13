import { describe, it, expect } from 'vitest';
import { isHabitScheduledForDate } from '../../src/utils/frequency.js';

describe('Frequency Schedule Generator (UT-03)', () => {
  const baseHabit = {
    frequency: 'DAILY',
    startDate: new Date('2026-11-01T00:00:00Z'),
    endDate: null,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
  };

  it('DAILY: Returns true for every day of the week within bounds', () => {
    // 2026-11-02 is Monday, 2026-11-07 is Saturday, 2026-11-08 is Sunday
    expect(isHabitScheduledForDate(baseHabit, '2026-11-02')).toBe(true);
    expect(isHabitScheduledForDate(baseHabit, '2026-11-07')).toBe(true);
    expect(isHabitScheduledForDate(baseHabit, '2026-11-08')).toBe(true);
  });

  it('WEEKDAYS: Returns true for Monday through Friday, false for Saturday and Sunday', () => {
    const weekdayHabit = {
      ...baseHabit,
      frequency: 'WEEKDAYS',
      daysOfWeek: [1, 2, 3, 4, 5],
    };
    // 2026-11-02 is Mon (1), 2026-11-06 is Fri (5), 2026-11-07 is Sat (6), 2026-11-08 is Sun (7)
    expect(isHabitScheduledForDate(weekdayHabit, '2026-11-02')).toBe(true);
    expect(isHabitScheduledForDate(weekdayHabit, '2026-11-06')).toBe(true);
    expect(isHabitScheduledForDate(weekdayHabit, '2026-11-07')).toBe(false);
    expect(isHabitScheduledForDate(weekdayHabit, '2026-11-08')).toBe(false);
  });

  it('THREE_TIMES_WEEKLY: Returns true on configured days (Mon, Wed, Fri), false on others', () => {
    const threeTimesHabit = {
      ...baseHabit,
      frequency: 'THREE_TIMES_WEEKLY',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    };
    expect(isHabitScheduledForDate(threeTimesHabit, '2026-11-02')).toBe(true); // Mon
    expect(isHabitScheduledForDate(threeTimesHabit, '2026-11-03')).toBe(false); // Tue
    expect(isHabitScheduledForDate(threeTimesHabit, '2026-11-04')).toBe(true); // Wed
    expect(isHabitScheduledForDate(threeTimesHabit, '2026-11-05')).toBe(false); // Thu
    expect(isHabitScheduledForDate(threeTimesHabit, '2026-11-06')).toBe(true); // Fri
  });

  it('WEEKLY: Returns true on designated recurrence day', () => {
    const weeklyHabit = {
      ...baseHabit,
      frequency: 'WEEKLY',
      daysOfWeek: [1], // Monday
    };
    expect(isHabitScheduledForDate(weeklyHabit, '2026-11-02')).toBe(true); // Mon
    expect(isHabitScheduledForDate(weeklyHabit, '2026-11-03')).toBe(false); // Tue
  });

  it('MONTHLY: Returns true on day-of-month matching startDate', () => {
    const monthlyHabit = {
      ...baseHabit,
      frequency: 'MONTHLY',
      startDate: new Date('2026-11-15T00:00:00Z'),
    };
    expect(isHabitScheduledForDate(monthlyHabit, '2026-11-15')).toBe(true);
    expect(isHabitScheduledForDate(monthlyHabit, '2026-12-15')).toBe(true);
    expect(isHabitScheduledForDate(monthlyHabit, '2026-11-16')).toBe(false);
  });

  it('CUSTOM_DAYS: Returns true on designated custom days of the week', () => {
    const customHabit = {
      ...baseHabit,
      frequency: 'CUSTOM_DAYS',
      daysOfWeek: [2, 4, 6], // Tue, Thu, Sat
    };
    expect(isHabitScheduledForDate(customHabit, '2026-11-03')).toBe(true); // Tue
    expect(isHabitScheduledForDate(customHabit, '2026-11-05')).toBe(true); // Thu
    expect(isHabitScheduledForDate(customHabit, '2026-11-07')).toBe(true); // Sat
    expect(isHabitScheduledForDate(customHabit, '2026-11-02')).toBe(false); // Mon
  });

  it('Out of bounds: Returns false for dates before startDate or after endDate', () => {
    const boundedHabit = {
      ...baseHabit,
      startDate: new Date('2026-11-10T00:00:00Z'),
      endDate: new Date('2026-11-20T00:00:00Z'),
    };
    expect(isHabitScheduledForDate(boundedHabit, '2026-11-09')).toBe(false);
    expect(isHabitScheduledForDate(boundedHabit, '2026-11-10')).toBe(true);
    expect(isHabitScheduledForDate(boundedHabit, '2026-11-20')).toBe(true);
    expect(isHabitScheduledForDate(boundedHabit, '2026-11-21')).toBe(false);
  });
});

