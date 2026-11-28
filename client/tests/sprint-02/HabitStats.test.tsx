import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HabitsDirectoryPage } from '../../src/pages/HabitsDirectoryPage.js';
import { HabitStatsPage } from '../../src/pages/HabitStatsPage.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';
import * as HabitsService from '../../src/services/habits.service.js';
import type { Habit, HabitStatsResponse } from '../../src/types/habit.js';

describe('Habits Directory & Habit Stats Heatmap Pages (UI-S2-04)', () => {
  const mockParticipant = {
    id: 1,
    email: 'alex@example.com',
    fullName: 'Alex Rivera',
    role: 'PARTICIPANT' as const,
    isActive: true,
  };

  const sampleHabits: Habit[] = [
    {
      id: 101,
      userId: 1,
      title: 'Evening Journal',
      description: 'Daily reflection',
      category: 'Mindfulness',
      colorHex: '#ff9800',
      frequency: 'DAILY',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: null,
      targetCount: 20,
      isActive: true,
      programId: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 102,
      userId: 1,
      title: 'Drink Water',
      description: null,
      category: null,
      colorHex: '#448aff',
      frequency: 'WEEKDAYS',
      daysOfWeek: [1, 2, 3, 4, 5],
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: null,
      targetCount: 20,
      isActive: true,
      programId: null,
      createdAt: '2026-11-02T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
    },
  ];

  const monthStats: HabitStatsResponse = {
    habit: {
      id: 101,
      title: 'Evening Journal',
      description: 'Daily reflection',
      category: 'Mindfulness',
      colorHex: '#ff9800',
      frequency: 'DAILY',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: null,
      targetCount: 20,
      programId: null,
    },
    streaks: {
      currentStreak: 5,
      highestStreak: 12,
    },
    heatmap: {
      mode: 'month',
      month: 11,
      year: 2026,
      cells: [
        {
          key: '2026-11-01',
          label: '1',
          scheduled: true,
          completedCount: 1,
          scheduledCount: 1,
          opacity: 1.0,
        },
        {
          key: '2026-11-02',
          label: '2',
          scheduled: true,
          completedCount: 0,
          scheduledCount: 1,
          opacity: 0,
        },
      ],
    },
  };

  const buildSampleYearCells = (year: number) => {
    const cells: HabitStatsResponse['heatmap']['cells'] = [];
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const jan1JsDay = jan1.getUTCDay();
    const jan1Weekday = jan1JsDay === 0 ? 7 : jan1JsDay;
    const leadingSpacers = jan1Weekday - 1;
    let dayIndex0 = 0;

    for (let m = 1; m <= 12; m++) {
      const daysInM = new Date(Date.UTC(year, m, 0)).getUTCDate();
      for (let d = 1; d <= daysInM; d++) {
        const dt = new Date(Date.UTC(year, m - 1, d));
        const key = dt.toISOString().split('T')[0];
        const jsDay = dt.getUTCDay();
        const weekday = jsDay === 0 ? 7 : jsDay;
        const weekIndex = Math.floor((leadingSpacers + dayIndex0) / 7);
        const isCompleted = key === `${year}-11-01`;
        cells.push({
          key,
          label: String(d),
          weekday,
          weekIndex,
          month: m,
          scheduled: true,
          completedCount: isCompleted ? 1 : 0,
          scheduledCount: 1,
          opacity: isCompleted ? 1.0 : 0,
        });
        dayIndex0++;
      }
    }
    return cells;
  };

  const yearStats: HabitStatsResponse = {
    ...monthStats,
    heatmap: {
      mode: 'year',
      month: null,
      year: 2026,
      cells: buildSampleYearCells(2026),
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

  it('renders HabitsDirectoryPage with color swatches, categories, filters, empty/retry states, and links to stats', async () => {
    const fetchSpy = vi
      .spyOn(HabitsService, 'fetchHabits')
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce(sampleHabits)
      .mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={['/habits']}>
        <HabitsDirectoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'All habits list' })).toBeInTheDocument();
      expect(screen.getByText('Evening Journal')).toBeInTheDocument();
    });
    expect(screen.getByText('Drink Water')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByTestId('habit-swatch-101')).toHaveStyle({ backgroundColor: '#ff9800' });
    expect(screen.getByRole('link', { name: /Evening Journal/i })).toHaveAttribute('href', '/habits/101/stats');
    expect(screen.getAllByRole('link', { name: /View Stats/i })[0]).toHaveAttribute(
      'href',
      '/habits/101/stats'
    );

    // Search filter
    fireEvent.change(screen.getByLabelText('Search habits'), { target: { value: 'Water' } });
    expect(screen.queryByText('Evening Journal')).not.toBeInTheDocument();
    expect(screen.getByText('Drink Water')).toBeInTheDocument();

    // Category filter -> empty match + Clear Filters
    fireEvent.change(screen.getByLabelText('Filter by category'), { target: { value: 'Finance' } });
    expect(screen.getByText('No habits match your filter')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    expect(screen.getByText('Evening Journal')).toBeInTheDocument();

    // Empty habits directory state
    render(
      <MemoryRouter initialEntries={['/habits']}>
        <HabitsDirectoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(screen.getByText('No habits yet')).toBeInTheDocument();
    });
  });

  it('renders HabitStatsPage streaks, Month heatmap, toggles to Year heatmap + legend, navigates periods, and handles 404/Retry', async () => {
    const statsSpy = vi
      .spyOn(HabitsService, 'fetchHabitStats')
      .mockResolvedValueOnce(monthStats)
      .mockResolvedValueOnce(yearStats)
      .mockResolvedValueOnce({ ...yearStats, heatmap: { ...yearStats.heatmap, year: 2025 } });

    render(
      <MemoryRouter initialEntries={['/habits/101/stats']}>
        <Routes>
          <Route path="/habits/:id/stats" element={<HabitStatsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Evening Journal' })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Back to Habits/i })).toHaveAttribute('href', '/habits');
    expect(screen.getByTestId('current-streak-value')).toHaveTextContent('5 days');
    expect(screen.getByTestId('highest-streak-value')).toHaveTextContent('12 days');

    // Month heatmap cells shaded in habit.colorHex with tooltips
    const nov1MonthCell = screen.getByRole('gridcell', { name: '2026-11-01: Completed' });
    expect(nov1MonthCell).toBeInTheDocument();
    expect(nov1MonthCell).toHaveAttribute('title', '2026-11-01: Completed');
    expect(screen.getByTestId('heatmap-fill-2026-11-01')).toHaveStyle({
      backgroundColor: '#ff9800',
      opacity: '1',
    });
    expect(screen.getByRole('gridcell', { name: '2026-11-02: Not completed' })).toHaveAttribute(
      'title',
      '2026-11-02: Not completed'
    );
    expect(screen.getByTestId('heatmap-fill-2026-11-02')).toHaveStyle({
      backgroundColor: '#ff9800',
      opacity: '0',
    });

    // Toggle to Year Mode -> GitHub/AniList 7-row x 53-col grid with 365 daily cells + legend
    fireEvent.click(screen.getByRole('button', { name: 'Year' }));
    await waitFor(() => {
      expect(statsSpy).toHaveBeenCalledWith(101, expect.objectContaining({ mode: 'year' }));
      expect(screen.getByRole('grid', { name: 'Yearly completion heatmap' })).toBeInTheDocument();
    });

    const yearGrid = screen.getByRole('grid', { name: 'Yearly completion heatmap' });
    expect(yearGrid).toHaveStyle({
      gridAutoFlow: 'column',
      gridTemplateRows: 'repeat(7, 13px)',
    });
    expect(screen.getByTestId('year-heatmap-scroll-container')).toHaveStyle({
      overflowX: 'auto',
    });
    // Jan 1, 2026 is Thursday -> 3 leading Mon-Wed spacer cells
    expect(screen.getAllByTestId('year-heatmap-spacer')).toHaveLength(3);
    expect(screen.getAllByRole('gridcell')).toHaveLength(365);

    const monthHeaderRow = screen.getByLabelText('Year heatmap month headers');
    expect(monthHeaderRow).toHaveTextContent('Jan');
    expect(monthHeaderRow).toHaveTextContent('Dec');

    const nov1YearCell = screen.getByRole('gridcell', { name: '2026-11-01: Completed' });
    expect(nov1YearCell).toHaveAttribute('title', '2026-11-01: Completed');
    expect(screen.getByTestId('heatmap-fill-2026-11-01')).toHaveStyle({
      backgroundColor: '#ff9800',
      opacity: '1',
    });
    expect(screen.getByRole('gridcell', { name: '2026-11-02: Not completed' })).toHaveAttribute(
      'title',
      '2026-11-02: Not completed'
    );
    expect(screen.getByTestId('heatmap-fill-2026-11-02')).toHaveStyle({
      backgroundColor: '#ff9800',
      opacity: '0',
    });
    expect(screen.getByLabelText('Heatmap legend')).toHaveTextContent('Not completed');
    expect(screen.getByLabelText('Heatmap legend')).toHaveTextContent('Completed');

    // Navigate to previous year
    fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));
    await waitFor(() => {
      expect(statsSpy).toHaveBeenCalledWith(
        101,
        expect.objectContaining({ mode: 'year', year: 2025 })
      );
    });

    // 404 HABIT_NOT_FOUND renders not found state
    vi.spyOn(HabitsService, 'fetchHabitStats').mockRejectedValueOnce(
      new HabitsService.HabitApiError('Habit not found.', 'HABIT_NOT_FOUND')
    );
    render(
      <MemoryRouter initialEntries={['/habits/999/stats']}>
        <Routes>
          <Route path="/habits/:id/stats" element={<HabitStatsPage />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Habit not found' })).toBeInTheDocument();
    });
  });
});
