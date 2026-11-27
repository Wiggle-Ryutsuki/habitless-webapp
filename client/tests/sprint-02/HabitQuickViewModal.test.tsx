import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HabitCalendarPage } from '../../src/pages/HabitCalendarPage.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';
import * as HabitsService from '../../src/services/habits.service.js';
import type { CalendarMatrixResponse } from '../../src/types/habit.js';

describe('Habit Quick-View Card Modal (UI-S2-01)', () => {
  const sampleMatrix: CalendarMatrixResponse = {
    month: 11,
    year: 2026,
    daysInMonth: 30,
    dayInitials: Array(30).fill('M'),
    habits: [
      {
        habitId: 101,
        title: 'Evening Reading',
        description: 'Read 20 pages of non-fiction',
        category: 'Learning',
        colorHex: '#009688',
        frequency: 'THREE_TIMES_WEEKLY',
        daysOfWeek: [1, 3, 5],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        targetCount: 15,
        goalAchievedCount: 4,
        programId: null,
        days: { '1': true },
      },
      {
        habitId: 102,
        title: 'Drink Water',
        description: null,
        category: null,
        colorHex: '#448aff',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-05T00:00:00.000Z',
        endDate: null,
        targetCount: 25,
        goalAchievedCount: 10,
        programId: null,
        days: {},
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'alex@example.com',
        fullName: 'Alex Rivera',
        role: 'PARTICIPANT',
        isActive: true,
      },
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
    vi.spyOn(HabitsService, 'fetchNotes').mockResolvedValue([]);
    vi.spyOn(HabitsService, 'fetchHabits').mockResolvedValue([]);
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(sampleMatrix);
  });

  const renderCalendarPage = () =>
    render(
      <MemoryRouter>
        <HabitCalendarPage />
      </MemoryRouter>
    );

  it('opens read-only Quick-View Card on habit title click and closes via Back without mutating', async () => {
    const updateSpy = vi.spyOn(HabitsService, 'updateHabit');
    const archiveSpy = vi.spyOn(HabitsService, 'archiveHabit');

    renderCalendarPage();

    await waitFor(() => {
      expect(screen.getByText('Evening Reading')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /View Evening Reading details/i }));

    const dialog = screen.getByRole('dialog', { name: 'Evening Reading' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
    expect(screen.getByText('Read 20 pages of non-fiction')).toBeInTheDocument();
    expect(screen.getByText('3x per week')).toBeInTheDocument();
    expect(screen.getByText('2026-11-01')).toBeInTheDocument();
    expect(screen.getByText('2026-12-31')).toBeInTheDocument();
    expect(screen.getByText('15 days')).toBeInTheDocument();
    expect(screen.getByTestId('quick-view-color-swatch')).toHaveStyle({ backgroundColor: '#009688' });

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByRole('dialog', { name: 'Evening Reading' })).not.toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
    expect(archiveSpy).not.toHaveBeenCalled();
  });

  it('renders fallback labels for Uncategorized, No description provided, and Ongoing endDate', async () => {
    renderCalendarPage();

    await waitFor(() => {
      expect(screen.getByText('Drink Water')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /View Drink Water details/i }));

    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    expect(screen.getByText('No description provided')).toBeInTheDocument();
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('transitions from Quick-View Edit to EditHabitModal and keeps inline Edit direct', async () => {
    renderCalendarPage();

    await waitFor(() => {
      expect(screen.getByText('Evening Reading')).toBeInTheDocument();
    });

    // Inline Edit button opens EditHabitModal directly without opening Quick-View
    fireEvent.click(screen.getByLabelText('Edit Evening Reading'));
    expect(screen.getByRole('dialog', { name: 'Edit Habit' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Open Quick-View, then click Edit -> transitions to EditHabitModal pre-populated
    fireEvent.click(screen.getByRole('button', { name: /View Evening Reading details/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.queryByRole('dialog', { name: 'Evening Reading' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Edit Habit' })).toBeInTheDocument();
    expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('Learning');
  });

  it('confirms Delete to soft-archive habit and refreshes calendar, or displays API error inline', async () => {
    const fetchMatrixSpy = vi.spyOn(HabitsService, 'fetchCalendarMatrix');
    const archiveSpy = vi
      .spyOn(HabitsService, 'archiveHabit')
      .mockRejectedValueOnce(new HabitsService.HabitApiError('Server archive error', 'ARCHIVE_ERROR'))
      .mockResolvedValueOnce(undefined);

    renderCalendarPage();

    await waitFor(() => {
      expect(screen.getByText('Evening Reading')).toBeInTheDocument();
    });

    const initialFetches = fetchMatrixSpy.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /View Evening Reading details/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      screen.getByText(/Are you sure you want to remove .*Evening Reading.* from your active habits/i)
    ).toBeInTheDocument();

    // First attempt fails -> keeps modal open and shows alert
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server archive error');
    });
    expect(screen.getByRole('dialog', { name: 'Evening Reading' })).toBeInTheDocument();

    // Second attempt succeeds -> archives, closes modal, and refreshes matrix
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    await waitFor(() => {
      expect(archiveSpy).toHaveBeenCalledWith(101);
      expect(screen.queryByRole('dialog', { name: 'Evening Reading' })).not.toBeInTheDocument();
      expect(fetchMatrixSpy.mock.calls.length).toBeGreaterThan(initialFetches);
    });
  });
});
