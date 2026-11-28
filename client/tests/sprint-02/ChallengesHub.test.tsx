import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChallengesHubPage } from '../../src/pages/ChallengesHubPage.js';
import { CalendarMatrix } from '../../src/components/CalendarMatrix.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';
import * as ChallengesService from '../../src/services/challenges.service.js';
import * as HabitsService from '../../src/services/habits.service.js';
import type { ChallengeItem, PublicChallenge } from '../../src/types/challenge.types.js';
import type { CalendarMatrixResponse } from '../../src/types/habit.js';

describe('ChallengesHub & Challenge Info Modal (UI-S2-05)', () => {
  const sampleChallenges: ChallengeItem[] = [
    {
      id: 1,
      title: '30-Day Cardio Blast',
      description: 'Daily cardio workouts to boost stamina.',
      category: 'Health & Fitness',
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.000Z',
      status: 'PUBLISHED',
      version: 1,
      manager: { fullName: 'Coach Sarah' },
      activitiesCount: 2,
      enrollmentsCount: 15,
      averageRating: 4.8,
      ratingsCount: 6,
      myEnrollment: {
        status: 'ACTIVE',
        enrolledAt: '2026-11-02T10:00:00.000Z',
        hasUnresolvedEndedHabits: false,
        updateAvailable: false,
      },
    },
    {
      id: 2,
      title: 'Mindfulness & Meditation',
      description: 'Calm the mind with weekday meditation.',
      category: 'Mindfulness',
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.000Z',
      status: 'PUBLISHED',
      version: 2,
      manager: { fullName: 'Dr. Jane' },
      activitiesCount: 1,
      enrollmentsCount: 8,
      averageRating: 4.5,
      ratingsCount: 4,
      myEnrollment: null,
    },
    {
      id: 3,
      title: 'Productivity Sprint',
      description: 'Deep work blocks.',
      category: 'Productivity',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T23:59:59.000Z',
      status: 'PUBLISHED',
      version: 1,
      manager: { fullName: 'Alex Manager' },
      activitiesCount: 1,
      enrollmentsCount: 5,
      averageRating: 4.0,
      ratingsCount: 2,
      myEnrollment: {
        status: 'COMPLETED',
        enrolledAt: '2026-10-01T00:00:00.000Z',
        hasUnresolvedEndedHabits: false,
        updateAvailable: false,
      },
    },
  ];

  const sampleDetail: PublicChallenge = {
    ...sampleChallenges[0],
    myRating: 5,
    activities: [
      {
        id: 10,
        title: 'Morning 5K Jog',
        description: 'Steady pace running',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        targetCount: 20,
      },
    ],
    comments: [
      {
        id: 101,
        programId: 1,
        parentCommentId: null,
        content: 'Loved this routine!',
        createdAt: '2026-11-15T12:00:00.000Z',
        author: {
          id: 5,
          fullName: 'Participant Bob',
          role: 'PARTICIPANT',
        },
        replies: [
          {
            id: 102,
            programId: 1,
            parentCommentId: 101,
            content: 'Great consistency Bob!',
            createdAt: '2026-11-15T14:00:00.000Z',
            author: {
              id: 9,
              fullName: 'Coach Sarah',
              role: 'PROGRAM_MANAGER',
            },
          },
        ],
      },
    ],
  };

  const sampleMatrix: CalendarMatrixResponse = {
    month: 11,
    year: 2026,
    daysInMonth: 30,
    dayInitials: Array(30).fill('M'),
    habits: [
      {
        habitId: 201,
        title: 'Morning 5K Jog',
        description: 'Challenge habit',
        category: 'Health & Fitness',
        colorHex: '#448aff',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-30T00:00:00.000Z',
        targetCount: 20,
        goalAchievedCount: 12,
        programId: 1,
        challengeStatus: 'ACTIVE',
        days: {},
      },
      {
        habitId: 202,
        title: 'Old Ended Challenge Habit',
        description: 'Ended challenge',
        category: 'Productivity',
        colorHex: '#ff9800',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-30T00:00:00.000Z',
        targetCount: 20,
        goalAchievedCount: 15,
        programId: 3,
        challengeStatus: 'ENDED',
        days: {},
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'participant@example.com',
        fullName: 'Pat Participant',
        role: 'PARTICIPANT',
        isActive: true,
      },
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    vi.spyOn(ChallengesService, 'fetchChallenges').mockResolvedValue(sampleChallenges);
    vi.spyOn(ChallengesService, 'fetchPublicChallenge').mockResolvedValue(sampleDetail);
    vi.spyOn(HabitsService, 'fetchCalendarMatrix').mockResolvedValue(sampleMatrix);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ChallengesHubPage with search, category dropdown, and status filter tabs', async () => {
    render(
      <MemoryRouter>
        <ChallengesHubPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Challenges Hub/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by title or description/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Filter by category/i })).toBeInTheDocument();

    // Verify status tabs
    expect(screen.getByRole('button', { name: /All Challenges/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Available/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enrolled/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ended/i })).toBeInTheDocument();

    // Verify challenge cards rendered
    expect(await screen.findByText('30-Day Cardio Blast')).toBeInTheDocument();
    expect(screen.getByText('Mindfulness & Meditation')).toBeInTheDocument();
  });

  it('triggers search and category filtering on user input', async () => {
    render(
      <MemoryRouter>
        <ChallengesHubPage />
      </MemoryRouter>
    );

    await screen.findByText('30-Day Cardio Blast');

    const searchInput = screen.getByPlaceholderText(/Search by title or description/i);
    fireEvent.change(searchInput, { target: { value: 'Meditation' } });

    await waitFor(() => {
      expect(ChallengesService.fetchChallenges).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'Meditation' })
      );
    });

    const categorySelect = screen.getByRole('combobox', { name: /Filter by category/i });
    fireEvent.change(categorySelect, { target: { value: 'Health & Fitness' } });

    await waitFor(() => {
      expect(ChallengesService.fetchChallenges).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Health & Fitness' })
      );
    });
  });

  it('opens ChallengeInfoModal and renders metadata, ratings, comments, and activities', async () => {
    render(
      <MemoryRouter>
        <ChallengesHubPage />
      </MemoryRouter>
    );

    const viewDetailsBtn = await screen.findByRole('button', {
      name: /View details for 30-Day Cardio Blast/i,
    });
    fireEvent.click(viewDetailsBtn);

    // Modal opens
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: '30-Day Cardio Blast' })).toBeInTheDocument();
    expect(within(dialog).getAllByText(/Coach Sarah/i).length).toBeGreaterThanOrEqual(1);
    expect(within(dialog).getByText('Morning 5K Jog')).toBeInTheDocument();

    // Comments thread rendered
    expect(within(dialog).getByText('Loved this routine!')).toBeInTheDocument();
    expect(within(dialog).getByText('Great consistency Bob!')).toBeInTheDocument();
  });

  it('renders "Update Available" banner and triggers sync when clicked', async () => {
    const detailWithUpdate: PublicChallenge = {
      ...sampleDetail,
      version: 2,
      myEnrollment: {
        status: 'ACTIVE',
        enrolledAt: '2026-11-02T10:00:00.000Z',
        hasUnresolvedEndedHabits: false,
        updateAvailable: true,
      },
    };
    vi.spyOn(ChallengesService, 'fetchPublicChallenge').mockResolvedValue(detailWithUpdate);
    vi.spyOn(ChallengesService, 'syncChallenge').mockResolvedValue({
      programId: 1,
      syncedVersion: 2,
      updatedCount: 1,
      addedCount: 1,
    });

    render(
      <MemoryRouter>
        <ChallengesHubPage />
      </MemoryRouter>
    );

    const viewDetailsBtn = await screen.findByRole('button', {
      name: /View details for 30-Day Cardio Blast/i,
    });
    fireEvent.click(viewDetailsBtn);

    // Update Available banner is visible
    expect(await screen.findByTestId('update-available-banner')).toBeInTheDocument();
    const syncBtn = screen.getByRole('button', { name: /Sync Changes/i });
    expect(syncBtn).toBeInTheDocument();

    fireEvent.click(syncBtn);
    await waitFor(() => {
      expect(ChallengesService.syncChallenge).toHaveBeenCalledWith(1);
    });
  });

  it('prompts Keep as Personal Habits vs Remove Habits and handles leave action', async () => {
    vi.spyOn(ChallengesService, 'leaveChallenge').mockResolvedValue({
      programId: 1,
      action: 'KEEP',
      affectedHabitsCount: 1,
      message: 'Challenge habits converted to personal habits.',
    });

    render(
      <MemoryRouter>
        <ChallengesHubPage />
      </MemoryRouter>
    );

    const viewDetailsBtn = await screen.findByRole('button', {
      name: /View details for 30-Day Cardio Blast/i,
    });
    fireEvent.click(viewDetailsBtn);

    // Click Leave Challenge button in footer
    const leaveBtn = await screen.findByRole('button', { name: 'Leave Challenge' });
    fireEvent.click(leaveBtn);

    // Keep vs Remove prompt appears
    expect(await screen.findByTestId('keep-remove-prompt')).toBeInTheDocument();
    const keepBtn = screen.getByRole('button', { name: /Keep as Personal Habits/i });
    const removeBtn = screen.getByRole('button', { name: /Remove Habits/i });
    expect(keepBtn).toBeInTheDocument();
    expect(removeBtn).toBeInTheDocument();

    // Click Keep
    fireEvent.click(keepBtn);
    await waitFor(() => {
      expect(ChallengesService.leaveChallenge).toHaveBeenCalledWith(1, 'KEEP');
    });
  });

  it('renders clickable "Challenge" and "Challenge (Ended)" badges in CalendarMatrix opening the modal', async () => {
    render(
      <MemoryRouter>
        <CalendarMatrix
          onEditHabit={vi.fn()}
          onQuickViewHabit={vi.fn()}
        />
      </MemoryRouter>
    );

    // Golden Sand "Challenge" badge for habit 201
    const challengeBadge = await screen.findByRole('button', { name: 'View challenge details' });
    expect(challengeBadge).toBeInTheDocument();
    expect(challengeBadge).toHaveTextContent('Challenge');

    // Light Coral "Challenge (Ended)" badge for habit 202
    const endedBadge = screen.getByRole('button', { name: 'View ended challenge details' });
    expect(endedBadge).toBeInTheDocument();
    expect(endedBadge).toHaveTextContent('Challenge (Ended)');

    // Clicking badge opens ChallengeInfoModal
    fireEvent.click(challengeBadge);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
