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
});
