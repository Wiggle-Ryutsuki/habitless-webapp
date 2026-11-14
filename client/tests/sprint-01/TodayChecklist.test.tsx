import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodayChecklist } from '../../src/components/TodayChecklist.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';
import * as HabitsService from '../../src/services/habits.service.js';

describe("Today's Checklist Component (UI-03)", () => {
  const mockUser = {
    id: 10,
    email: 'alex@example.com',
    fullName: 'Alex Rivera',
    role: 'PARTICIPANT' as const,
    isActive: true,
  };

  const sampleChecklistData = {
    date: '2026-11-13',
    totalScheduled: 2,
    completedCount: 1,
    items: [
      {
        habitId: 101,
        title: 'Morning Yoga',
        description: '30 mins stretch',
        colorHex: '#009688',
        frequency: 'DAILY' as const,
        isCompleted: true,
        logId: 501,
      },
      {
        habitId: 102,
        title: 'Read 20 mins',
        description: 'Non-fiction book',
        colorHex: '#448aff',
        frequency: 'DAILY' as const,
        isCompleted: false,
        logId: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('renders greeting, date, completion tally, and scheduled habit cards with color strips', async () => {
    vi.spyOn(HabitsService, 'fetchTodayChecklist').mockResolvedValue(sampleChecklistData);

    render(<TodayChecklist />);

    // Initially loading
    expect(screen.getByText(/loading today’s schedule/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, alex rivera!/i)).toBeInTheDocument();
      expect(screen.getByText(/1 of 2 habits completed today/i)).toBeInTheDocument();
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      expect(screen.getByText('Read 20 mins')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ new habit/i })).toBeInTheDocument();
    });

    // Yoga is completed: should have strikethrough text and checked checkbox
    const yogaCheckbox = screen.getByRole('checkbox', { name: /mark morning yoga as incomplete/i });
    expect(yogaCheckbox).toHaveAttribute('aria-checked', 'true');
    expect(yogaCheckbox).toHaveTextContent('✓');

    // Read 20 mins is incomplete: should not have checkmark
    const readCheckbox = screen.getByRole('checkbox', { name: /mark read 20 mins as completed/i });
    expect(readCheckbox).toHaveAttribute('aria-checked', 'false');
    expect(readCheckbox).not.toHaveTextContent('✓');
  });

  it('optimistically toggles habit completion and calls toggleHabitCompletion API', async () => {
    vi.spyOn(HabitsService, 'fetchTodayChecklist').mockResolvedValue(sampleChecklistData);
    const mockToggle = vi.spyOn(HabitsService, 'toggleHabitCompletion').mockResolvedValue({
      habitId: 102,
      date: '2026-11-13',
      completed: true,
    });

    render(<TodayChecklist />);

    await waitFor(() => {
      expect(screen.getByText('Read 20 mins')).toBeInTheDocument();
    });

    const readCheckbox = screen.getByRole('checkbox', { name: /mark read 20 mins as completed/i });
    fireEvent.click(readCheckbox);

    // Optimistically updates immediately
    expect(readCheckbox).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/2 of 2 habits completed today/i)).toBeInTheDocument();

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(102, '2026-11-13', true);
  });

  it('rolls back optimistic toggle and displays error banner when toggle API fails', async () => {
    vi.spyOn(HabitsService, 'fetchTodayChecklist').mockResolvedValue(sampleChecklistData);
    vi.spyOn(HabitsService, 'toggleHabitCompletion').mockRejectedValue(new Error('Network offline'));

    render(<TodayChecklist />);

    await waitFor(() => {
      expect(screen.getByText('Read 20 mins')).toBeInTheDocument();
    });

    const readCheckbox = screen.getByRole('checkbox', { name: /mark read 20 mins as completed/i });
    fireEvent.click(readCheckbox);

    await waitFor(() => {
      // Reverted to unchecked
      expect(readCheckbox).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByText(/1 of 2 habits completed today/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to save habit status\. please retry\./i)).toBeInTheDocument();
    });
  });

  it('renders empty checklist state when no habits are scheduled for today', async () => {
    vi.spyOn(HabitsService, 'fetchTodayChecklist').mockResolvedValue({
      date: '2026-11-13',
      totalScheduled: 0,
      completedCount: 0,
      items: [],
    });

    render(<TodayChecklist />);

    await waitFor(() => {
      expect(screen.getByText(/no habits scheduled for today!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ create your first habit/i })).toBeInTheDocument();
    });
  });

  it('renders initial fetch error and allows retry', async () => {
    const mockFetch = vi
      .spyOn(HabitsService, 'fetchTodayChecklist')
      .mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce(sampleChecklistData);

    render(<TodayChecklist />);

    await waitFor(() => {
      expect(screen.getByText(/server unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('opens and closes the New Habit modal when + New Habit is clicked', async () => {
    vi.spyOn(HabitsService, 'fetchTodayChecklist').mockResolvedValue(sampleChecklistData);

    render(<TodayChecklist />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ new habit/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ new habit/i }));

    // Modal dialog is opened
    expect(screen.getByRole('dialog', { name: /\+ create new habit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/habit name/i)).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

