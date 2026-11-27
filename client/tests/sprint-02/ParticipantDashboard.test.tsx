import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../../src/pages/DashboardPage.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';
import * as HabitsService from '../../src/services/habits.service.js';
import type { ParticipantDashboardResponse } from '../../src/types/habit.js';

describe('Participant Dashboard & Header Navigation (UI-S2-03)', () => {
  const mockParticipant = {
    id: 1,
    email: 'alex@example.com',
    fullName: 'Alex Rivera',
    role: 'PARTICIPANT' as const,
    isActive: true,
  };

  const sampleDashboard: ParticipantDashboardResponse = {
    date: '2026-11-26',
    weekStart: '2026-11-23',
    weekEnd: '2026-11-29',
    weekDays: [
      { date: '2026-11-23', dayLabel: 'Mon', dayNumber: 23, isToday: false },
      { date: '2026-11-24', dayLabel: 'Tue', dayNumber: 24, isToday: false },
      { date: '2026-11-25', dayLabel: 'Wed', dayNumber: 25, isToday: false },
      { date: '2026-11-26', dayLabel: 'Thu', dayNumber: 26, isToday: true },
      { date: '2026-11-27', dayLabel: 'Fri', dayNumber: 27, isToday: false },
      { date: '2026-11-28', dayLabel: 'Sat', dayNumber: 28, isToday: false },
      { date: '2026-11-29', dayLabel: 'Sun', dayNumber: 29, isToday: false },
    ],
    todayFocus: {
      totalScheduled: 2,
      completedCount: 1,
      items: [
        {
          habitId: 101,
          title: 'Journal',
          category: 'Mindfulness',
          colorHex: '#ff9800',
          frequency: 'DAILY',
          isCompleted: true,
        },
        {
          habitId: 102,
          title: 'Drink Water',
          category: null,
          colorHex: '#448aff',
          frequency: 'DAILY',
          isCompleted: false,
        },
      ],
    },
    weeklyProgress: [
      {
        habitId: 101,
        title: 'Journal',
        category: 'Mindfulness',
        colorHex: '#ff9800',
        frequency: 'DAILY',
        completedDaysThisWeek: 3,
        scheduledDaysThisWeek: 7,
        percentage: 43,
      },
      {
        habitId: 102,
        title: 'Drink Water',
        category: null,
        colorHex: '#448aff',
        frequency: 'DAILY',
        completedDaysThisWeek: 2,
        scheduledDaysThisWeek: 7,
        percentage: 29,
      },
    ],
    programCompletion: {
      activeProgramsCount: 1,
      totalCompletedLogs: 18,
      totalScheduledDaysToDate: 25,
      percentage: 72,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockParticipant,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  const renderDashboard = () =>
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    );

  it('renders Header Participant links without under-construction toast and displays all 3 Dashboard sections', async () => {
    vi.spyOn(HabitsService, 'fetchParticipantDashboard').mockResolvedValue(sampleDashboard);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Participant Dashboard' })).toBeInTheDocument();
    });

    // Header links (desktop + no under-construction toast on Dashboard click)
    expect(screen.getByRole('link', { name: 'Habit Calendar' })).toHaveAttribute('href', '/calendar');
    const dashLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashLink).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Habits' })).toHaveAttribute('href', '/habits');
    expect(screen.getByRole('link', { name: 'Challenges' })).toHaveAttribute('href', '/challenges');
    fireEvent.click(dashLink);
    expect(screen.queryByText(/dashboard is still under construction/i)).not.toBeInTheDocument();

    // Mobile hamburger drawer also contains all 4 links
    fireEvent.click(screen.getByLabelText('Toggle Navigation Menu'));
    expect(screen.getAllByRole('link', { name: 'Habits' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Challenges' })).toHaveLength(2);

    // Mon-Sun strip with aria-current="date" on Thu 26
    const strip = screen.getByRole('region', { name: 'Current week calendar strip' });
    expect(strip).toHaveTextContent('Mon');
    expect(strip).toHaveTextContent('Sun');
    const todayCell = strip.querySelector('[aria-current="date"]');
    expect(todayCell).toHaveTextContent('Thu');
    expect(todayCell).toHaveTextContent('26');

    // Section 1: Today's Focus Snippet
    expect(screen.getByText('1 / 2 completed')).toBeInTheDocument();
    expect(screen.getAllByText('Uncategorized').length).toBeGreaterThanOrEqual(1);

    // Section 2: Weekly Habit Progress Bars in each habit's Sprint 1 palette colorHex
    const journalBar = screen.getByRole('progressbar', { name: 'Journal weekly progress' });
    expect(journalBar).toHaveAttribute('aria-valuenow', '3');
    expect(journalBar).toHaveAttribute('aria-valuemax', '7');
    expect(journalBar.firstElementChild).toHaveStyle({
      width: '43%',
      backgroundColor: '#ff9800',
    });
    expect(screen.getByText('3 / 7 (43%)')).toBeInTheDocument();

    // Section 3: Program Completion Bar
    const programBar = screen.getByRole('progressbar', { name: 'Active Program Completion' });
    expect(programBar).toHaveAttribute('aria-valuenow', '72');
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText(/18 \/ 25 scheduled challenge days/i)).toBeInTheDocument();
  });

  it('optimistically toggles Today Focus, refreshes programCompletion, and rolls back on failure', async () => {
    const refreshedDashboard: ParticipantDashboardResponse = {
      ...sampleDashboard,
      todayFocus: {
        ...sampleDashboard.todayFocus,
        completedCount: 2,
        items: sampleDashboard.todayFocus.items.map((item) =>
          item.habitId === 102 ? { ...item, isCompleted: true } : item
        ),
      },
      weeklyProgress: sampleDashboard.weeklyProgress.map((bar) =>
        bar.habitId === 102
          ? { ...bar, completedDaysThisWeek: 3, percentage: 43 }
          : bar
      ),
      programCompletion: {
        activeProgramsCount: 1,
        totalCompletedLogs: 19,
        totalScheduledDaysToDate: 25,
        percentage: 76,
      },
    };

    const fetchSpy = vi
      .spyOn(HabitsService, 'fetchParticipantDashboard')
      .mockResolvedValueOnce(sampleDashboard)
      .mockResolvedValueOnce(refreshedDashboard);

    const toggleSpy = vi
      .spyOn(HabitsService, 'toggleHabitCompletion')
      .mockResolvedValueOnce({ habitId: 102, date: '2026-11-26', completed: true })
      .mockRejectedValueOnce(new Error('Network timeout'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('1 / 2 completed')).toBeInTheDocument();
    });

    const waterCheckbox = screen.getByLabelText('Mark Drink Water as completed');
    fireEvent.click(waterCheckbox);

    // Optimistic updates on focus tally and weekly progress (both Journal and Drink Water are now 3 / 7 (43%))
    expect(screen.getByText('2 / 2 completed')).toBeInTheDocument();
    expect(screen.getAllByText('3 / 7 (43%)')).toHaveLength(2);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(102, '2026-11-26', true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText('76%')).toBeInTheDocument();
    });

    // Second toggle fails -> rolls back optimistic change and displays inline alert
    fireEvent.click(screen.getByLabelText('Mark Drink Water as incomplete'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network timeout');
      expect(screen.getByText('2 / 2 completed')).toBeInTheDocument();
    });
  });

  it('handles empty zero-habit/zero-challenge states and API fetch retry flow', async () => {
    const emptyDashboard: ParticipantDashboardResponse = {
      date: '2026-11-26',
      weekStart: '2026-11-23',
      weekEnd: '2026-11-29',
      weekDays: sampleDashboard.weekDays,
      todayFocus: { totalScheduled: 0, completedCount: 0, items: [] },
      weeklyProgress: [],
      programCompletion: {
        activeProgramsCount: 0,
        totalCompletedLogs: 0,
        totalScheduledDaysToDate: 0,
        percentage: 0,
      },
    };

    const fetchSpy = vi
      .spyOn(HabitsService, 'fetchParticipantDashboard')
      .mockRejectedValueOnce(new Error('Server unreachable'))
      .mockResolvedValueOnce(emptyDashboard);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server unreachable');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText('No habits scheduled for today.')).toBeInTheDocument();
      expect(screen.getByText('No active challenge programs joined yet')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
