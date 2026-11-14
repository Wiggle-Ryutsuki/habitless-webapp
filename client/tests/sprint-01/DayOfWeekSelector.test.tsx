import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DayOfWeekSelector,
  getFrequencyLabel,
  deriveFrequencyType,
  getInitialDaysOfWeek,
  isHabitDueOnDay,
  DAYS_OF_WEEK,
} from '../../src/components/DayOfWeekSelector.js';

describe('DayOfWeekSelector Component (Alarm-Style Frequency)', () => {
  it('renders "Frequency *" title on the left and dynamic summary text on the right', () => {
    render(<DayOfWeekSelector selectedDays={[1, 2, 3, 4, 5, 6, 7]} onChange={vi.fn()} />);

    expect(screen.getByText(/Frequency/)).toBeInTheDocument();
    const summary = screen.getByTestId('frequency-summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('Daily');
  });

  it('renders all 7 day buttons with alarm styling', () => {
    render(<DayOfWeekSelector selectedDays={[1, 2, 3, 4, 5, 6, 7]} onChange={vi.fn()} />);

    DAYS_OF_WEEK.forEach((d) => {
      const button = screen.getByRole('checkbox', { name: d.fullName });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(d.label);
      expect(button).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('computes correct frequency labels: Daily, 6x per week, 5x per week, Weekly', () => {
    expect(getFrequencyLabel([1, 2, 3, 4, 5, 6, 7])).toBe('Daily');
    expect(getFrequencyLabel([1, 2, 3, 4, 5, 6])).toBe('6x per week');
    expect(getFrequencyLabel([1, 2, 3, 4, 5])).toBe('5x per week');
    expect(getFrequencyLabel([1, 2, 3, 4])).toBe('4x per week');
    expect(getFrequencyLabel([1, 2, 3])).toBe('3x per week');
    expect(getFrequencyLabel([1, 2])).toBe('2x per week');
    expect(getFrequencyLabel([1])).toBe('Weekly');
  });

  it('toggles an unselected day to selected', () => {
    const handleChange = vi.fn();
    render(<DayOfWeekSelector selectedDays={[1, 2, 3, 4, 5]} onChange={handleChange} />);

    // Click Saturday (currently unselected)
    const satBtn = screen.getByRole('checkbox', { name: 'Saturday' });
    expect(satBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(satBtn);
    expect(handleChange).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6]);
  });

  it('toggles a selected day to unselected when more than 1 day is selected', () => {
    const handleChange = vi.fn();
    render(<DayOfWeekSelector selectedDays={[1, 2, 3, 4, 5, 6, 7]} onChange={handleChange} />);

    // Click Sunday (day 7)
    const sunBtn = screen.getByRole('checkbox', { name: 'Sunday' });
    fireEvent.click(sunBtn);
    expect(handleChange).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6]);
  });

  it('enforces minimum frequency of Weekly: cannot deselect the last remaining day', () => {
    const handleChange = vi.fn();
    render(<DayOfWeekSelector selectedDays={[1]} onChange={handleChange} />);

    // Click Monday (the only selected day)
    const monBtn = screen.getByRole('checkbox', { name: 'Monday' });
    expect(monBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(monBtn);
    // Should NOT call onChange to remove Monday; min is 1 day (Weekly)
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('derives correct database FrequencyType enum values', () => {
    expect(deriveFrequencyType([1, 2, 3, 4, 5, 6, 7])).toBe('DAILY');
    expect(deriveFrequencyType([1, 2, 3, 4, 5])).toBe('WEEKDAYS');
    expect(deriveFrequencyType([1, 3, 5])).toBe('THREE_TIMES_WEEKLY');
    expect(deriveFrequencyType([1])).toBe('WEEKLY');
    expect(deriveFrequencyType([1, 2, 3, 4, 5, 6])).toBe('CUSTOM_DAYS');
    expect(deriveFrequencyType([2, 4])).toBe('CUSTOM_DAYS');
  });

  it('getInitialDaysOfWeek pre-populates days correctly from frequency and daysOfWeek', () => {
    expect(getInitialDaysOfWeek(undefined, [2, 4, 6])).toEqual([2, 4, 6]);
    expect(getInitialDaysOfWeek('WEEKDAYS')).toEqual([1, 2, 3, 4, 5]);
    expect(getInitialDaysOfWeek('THREE_TIMES_WEEKLY')).toEqual([1, 3, 5]);
    expect(getInitialDaysOfWeek('WEEKLY')).toEqual([1]);
    expect(getInitialDaysOfWeek('DAILY')).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getInitialDaysOfWeek()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('isHabitDueOnDay accurately computes whether a habit is due on a given day', () => {
    // 2026-11-14 is Saturday (ISO day 6)
    // 2026-11-15 is Sunday (ISO day 7)
    // 2026-11-16 is Monday (ISO day 1)

    // Daily habit is due every day
    expect(isHabitDueOnDay({ frequency: 'DAILY' }, 2026, 11, 14)).toBe(true);
    expect(isHabitDueOnDay({ frequency: 'DAILY' }, 2026, 11, 15)).toBe(true);

    // Weekdays habit: due Monday, not due Saturday
    const weekdayHabit = { frequency: 'WEEKDAYS', daysOfWeek: [1, 2, 3, 4, 5] };
    expect(isHabitDueOnDay(weekdayHabit, 2026, 11, 16)).toBe(true); // Monday
    expect(isHabitDueOnDay(weekdayHabit, 2026, 11, 14)).toBe(false); // Saturday

    // Weekend habit: due Saturday, not due Monday
    const weekendHabit = { frequency: 'CUSTOM_DAYS', daysOfWeek: [6, 7] };
    expect(isHabitDueOnDay(weekendHabit, 2026, 11, 14)).toBe(true); // Saturday
    expect(isHabitDueOnDay(weekendHabit, 2026, 11, 16)).toBe(false); // Monday

    // Start date in future: not due yet
    const futureHabit = { frequency: 'DAILY', startDate: '2026-12-01' };
    expect(isHabitDueOnDay(futureHabit, 2026, 11, 14)).toBe(false);

    // End date in past: no longer due
    const expiredHabit = { frequency: 'DAILY', endDate: '2026-11-10' };
    expect(isHabitDueOnDay(expiredHabit, 2026, 11, 14)).toBe(false);
  });
});
