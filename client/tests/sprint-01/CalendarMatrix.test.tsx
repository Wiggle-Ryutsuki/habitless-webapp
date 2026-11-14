import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarMatrix } from '../../src/components/CalendarMatrix.js';
import * as HabitsService from '../../src/services/habits.service.js';
import type { CalendarMatrixResponse } from '../../src/types/habit.js';

describe('Calendar Desktop Matrix Component (UI-04)', () => {
  const sampleMatrixData: CalendarMatrixResponse = {
    month: 3,
    year: 2021,
    daysInMonth: 31,
    dayInitials: [
      'M', 'T', 'W', 'T', 'F', 'S', 'S',
      'M', 'T', 'W', 'T', 'F', 'S', 'S',
      'M', 'T', 'W', 'T', 'F', 'S', 'S',
      'M', 'T', 'W', 'T', 'F', 'S', 'S',
      'M', 'T', 'W'
    ],
    habits: [
      {
        habitId: 101,
        title: 'Morning Yoga',
        colorHex: '#009688',
        targetCount: 20,
        goalAchievedCount: 19,
        days: {
          '1': true,
          '2': false,
          '15': true,
        },
      },
      {
        habitId: 102,
        title: 'Evening Journal',
        colorHex: '#ff9800',
        targetCount: 20,
        goalAchievedCount: 14,
        days: {
          '1': true,
          '2': true,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders month title, 1–31 header columns, day initials, sticky HABITS and GOAL ACHIEVED columns', async () => {
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(sampleMatrixData);
    const mockOnEdit = vi.fn();

    render(
      <CalendarMatrix
        initialMonth={3}
        initialYear={2021}
        onEditHabit={mockOnEdit}
      />
    );

    // Verify month heading
    await waitFor(() => {
      expect(screen.getByText('March 2021')).toBeInTheDocument();
    });

    // Verify column headers
    expect(screen.getByText('HABITS')).toBeInTheDocument();
    expect(screen.getByText('GOAL ACHIEVED')).toBeInTheDocument();

    // Verify days 1 and 31 exist
    expect(screen.getByRole('columnheader', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '31' })).toBeInTheDocument();

    // Verify habit names rendered
    expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    expect(screen.getByText('Evening Journal')).toBeInTheDocument();

    // Verify goal counts rendered
    expect(screen.getAllByText('19').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('14').length).toBeGreaterThanOrEqual(1);
  });

  it('renders checkmark glyph ✓ and accessible aria-labels on completed cells', async () => {
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(sampleMatrixData);
    const mockOnEdit = vi.fn();

    render(
      <CalendarMatrix
        initialMonth={3}
        initialYear={2021}
        onEditHabit={mockOnEdit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    // Day 1 for Morning Yoga is completed
    const day1Button = screen.getByLabelText('Morning Yoga, Day 1: Completed');
    expect(day1Button).toBeInTheDocument();
    expect(day1Button.textContent).toBe('✓');

    // Day 2 for Morning Yoga is not completed
    const day2Button = screen.getByLabelText('Morning Yoga, Day 2: Not completed');
    expect(day2Button).toBeInTheDocument();
    expect(day2Button.textContent).toBe('');
  });

  it('triggers edit callback when clicking inline Edit button on habit row', async () => {
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(sampleMatrixData);
    const mockOnEdit = vi.fn();

    render(
      <CalendarMatrix
        initialMonth={3}
        initialYear={2021}
        onEditHabit={mockOnEdit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    const editBtn = screen.getByLabelText('Edit Morning Yoga');
    fireEvent.click(editBtn);

    expect(mockOnEdit).toHaveBeenCalledWith(expect.objectContaining({
      habitId: 101,
      title: 'Morning Yoga',
    }));
  });

  it('handles cell toggle optimistically and calls toggleHabitCompletion', async () => {
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(sampleMatrixData);
    const mockToggle = vi.spyOn(HabitsService, 'toggleHabitCompletion').mockResolvedValue({
      habitId: 101,
      date: '2021-03-02',
      completed: true,
    });

    render(
      <CalendarMatrix
        initialMonth={3}
        initialYear={2021}
        onEditHabit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    const day2Button = screen.getByLabelText('Morning Yoga, Day 2: Not completed');
    fireEvent.click(day2Button);

    // Optimistically becomes completed
    expect(day2Button.textContent).toBe('✓');
    expect(mockToggle).toHaveBeenCalledWith(101, '2021-03-02', true);
  });

  it('renders empty state when participant has 0 habits', async () => {
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue({
      month: 3,
      year: 2021,
      daysInMonth: 31,
      dayInitials: [],
      habits: [],
    });

    render(
      <CalendarMatrix
        initialMonth={3}
        initialYear={2021}
        onEditHabit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No habits created yet')).toBeInTheDocument();
    });
  });

  it('keeps today and previous days interactive but disables tomorrow and subsequent future days', async () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const todayDay = today.getDate();

    const currentMonthData: CalendarMatrixResponse = {
      month: currentMonth,
      year: currentYear,
      daysInMonth: 31,
      dayInitials: Array(31).fill('M'),
      habits: [
        {
          habitId: 201,
          title: 'Daily Meditation',
          colorHex: '#448aff',
          targetCount: 20,
          goalAchievedCount: 5,
          days: {},
        },
      ],
    };

    const mockToggle = vi.spyOn(HabitsService, 'toggleHabitCompletion').mockResolvedValue({
      habitId: 201,
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`,
      completed: true,
    });
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(currentMonthData);

    render(
      <CalendarMatrix
        initialMonth={currentMonth}
        initialYear={currentYear}
        onEditHabit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Daily Meditation')).toBeInTheDocument();
    });

    // Today cell is interactive (not disabled)
    const todayCell = screen.getByLabelText(`Daily Meditation, Day ${todayDay}: Not completed`);
    expect(todayCell).not.toBeDisabled();

    // Previous day (if today > 1) is interactive (not disabled)
    if (todayDay > 1) {
      const yesterdayCell = screen.getByLabelText(`Daily Meditation, Day ${todayDay - 1}: Not completed`);
      expect(yesterdayCell).not.toBeDisabled();
    }

    // Tomorrow (day after today, if within 31 days) is disabled
    if (todayDay < 31) {
      const tomorrowCell = screen.getByLabelText(`Daily Meditation, Day ${todayDay + 1}: Not completed`);
      expect(tomorrowCell).toBeDisabled();

      // Clicking tomorrow cell should not trigger toggleHabitCompletion
      fireEvent.click(tomorrowCell);
      expect(mockToggle).not.toHaveBeenCalled();
    }
  });

  it('filters habits so only habits due for that day appear in the habit bar on the calendar', async () => {
    // March 2021:
    // Day 1 is Monday (ISO day 1)
    // Day 6 is Saturday (ISO day 6)
    const scheduleMatrixData: CalendarMatrixResponse = {
      month: 3,
      year: 2021,
      daysInMonth: 31,
      dayInitials: Array(31).fill('M'),
      habits: [
        {
          habitId: 301,
          title: 'Monday Only Yoga',
          colorHex: '#009688',
          frequency: 'WEEKLY',
          daysOfWeek: [1], // Monday only
          targetCount: 4,
          goalAchievedCount: 1,
          days: {},
        },
        {
          habitId: 302,
          title: 'Weekend Hike',
          colorHex: '#ff9800',
          frequency: 'CUSTOM_DAYS',
          daysOfWeek: [6, 7], // Sat, Sun only
          targetCount: 8,
          goalAchievedCount: 2,
          days: {},
        },
      ],
    };

    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(scheduleMatrixData);

    render(
      <CalendarMatrix
        initialMonth={3}
        initialYear={2021}
        onEditHabit={vi.fn()}
      />
    );

    // Initial active day in March 2021 defaults to Day 1 (Monday)
    await waitFor(() => {
      expect(screen.getByText('Monday Only Yoga')).toBeInTheDocument();
    });
    // Weekend Hike is NOT due on Monday -> should not appear!
    expect(screen.queryByText('Weekend Hike')).not.toBeInTheDocument();

    // Click Day 6 header (Saturday)
    const day6Header = screen.getByRole('columnheader', { name: '6' });
    fireEvent.click(day6Header);

    // Now Weekend Hike IS due on Saturday -> should appear!
    await waitFor(() => {
      expect(screen.getByText('Weekend Hike')).toBeInTheDocument();
    });
    // Monday Only Yoga is NOT due on Saturday -> should not appear!
    expect(screen.queryByText('Monday Only Yoga')).not.toBeInTheDocument();
  });
});
