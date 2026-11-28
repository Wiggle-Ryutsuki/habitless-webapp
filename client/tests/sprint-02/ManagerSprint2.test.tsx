import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ManagerDashboardPage } from '../../src/pages/ManagerDashboardPage.js';
import { ManagerDirectoryPage } from '../../src/pages/ManagerDirectoryPage.js';
import { ManagerChallengeDetailPage } from '../../src/pages/ManagerChallengeDetailPage.js';
import { ProgramBuilder } from '../../src/components/ProgramBuilder.js';
import * as AuthContextModule from '../../src/context/AuthContext.js';
import * as ManagerService from '../../src/services/manager.service.js';
import type {
  ManagerAnalyticsData,
  ManagerDirectoryItem,
  ManagerDirectoryDetail,
  ChallengeProgram,
  ChallengeCommentItem,
} from '../../src/types/challenge.types.js';

describe('Sprint 2 Feature 9: Manager Analytics & Directory', () => {
  const mockManagerUser = {
    id: 10,
    email: 'manager@test.com',
    fullName: 'Manager Alice',
    role: 'PROGRAM_MANAGER' as const,
  };

  const sampleAnalytics: ManagerAnalyticsData = {
    summary: {
      totalPublishedChallenges: 5,
      totalActiveEnrollments: 24,
      totalCompletedEnrollments: 12,
    },
    mostPopularChallenges: [
      {
        id: 101,
        title: 'Morning Yoga Challenge',
        category: 'Health & Fitness',
        durationDays: 30,
        managerName: 'Manager Alice',
        enrollmentCount: 15,
        averageRating: 4.8,
      },
      {
        id: 102,
        title: 'Deep Work Daily',
        category: 'Productivity',
        durationDays: 21,
        managerName: 'Manager Bob',
        enrollmentCount: 9,
        averageRating: 4.2,
      },
    ],
    topCategories: [
      {
        category: 'Health & Fitness',
        isPreset: true,
        challengesCount: 3,
        totalEnrollments: 18,
        completionRate: 67,
      },
      {
        category: 'Other',
        isPreset: false,
        challengesCount: 2,
        totalEnrollments: 6,
        completionRate: 50,
        customCategories: [
          {
            category: 'Guitar Practice',
            challengesCount: 1,
            totalEnrollments: 4,
            completionRate: 50,
          },
          {
            category: 'Language Learning',
            challengesCount: 1,
            totalEnrollments: 2,
            completionRate: 50,
          },
        ],
      },
    ],
  };

  const sampleDirectory: ManagerDirectoryItem[] = [
    {
      id: 101,
      title: 'Morning Yoga Challenge',
      description: 'Start your morning with energizing stretches.',
      category: 'Health & Fitness',
      durationDays: 30,
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.000Z',
      status: 'PUBLISHED',
      version: 1,
      manager: { id: 10, fullName: 'Manager Alice' },
      isOwnedByMe: true,
      activitiesCount: 2,
      enrollmentsCount: 15,
      averageRating: 4.8,
      ratingsCount: 5,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 102,
      title: 'Deep Work Daily',
      description: 'Focus blocks for distraction-free coding.',
      category: 'Productivity',
      durationDays: 21,
      startDate: '2026-11-05T00:00:00.000Z',
      endDate: '2026-11-25T23:59:59.000Z',
      status: 'PUBLISHED',
      version: 1,
      manager: { id: 20, fullName: 'Manager Bob' },
      isOwnedByMe: false,
      activitiesCount: 1,
      enrollmentsCount: 9,
      averageRating: 4.2,
      ratingsCount: 3,
      createdAt: '2026-11-05T00:00:00.000Z',
      updatedAt: '2026-11-05T00:00:00.000Z',
    },
  ];

  const sampleDetail: ManagerDirectoryDetail = {
    id: 101,
    title: 'Morning Yoga Challenge',
    description: 'Start your morning with energizing stretches.',
    category: 'Health & Fitness',
    durationDays: 30,
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: '2026-11-30T23:59:59.000Z',
    status: 'PUBLISHED',
    version: 1,
    manager: { id: 10, fullName: 'Manager Alice' },
    isOwnedByMe: true,
    activities: [
      {
        id: 1,
        title: 'Sun Salutation',
        description: '10 minutes of flow',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        targetCount: 1,
      },
    ],
    enrollmentsCount: 15,
    averageRating: 4.8,
    ratingsCount: 5,
    comments: [
      {
        id: 501,
        programId: 101,
        parentCommentId: null,
        content: 'Loved this routine! Kept me consistent.',
        createdAt: '2026-11-10T12:00:00.000Z',
        author: { id: 100, fullName: 'Participant John', role: 'PARTICIPANT' },
        replies: [
          {
            id: 502,
            programId: 101,
            parentCommentId: 501,
            content: 'Great work John! Keep up the momentum.',
            createdAt: '2026-11-10T14:00:00.000Z',
            author: { id: 10, fullName: 'Manager Alice', role: 'PROGRAM_MANAGER' },
          },
        ],
      },
    ],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockManagerUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ManagerDashboardPage (/manager/dashboard)', () => {
    it('renders KPI summary cards, popular challenges, and category breakdown with Other drilldown', async () => {
      vi.spyOn(ManagerService, 'fetchManagerAnalytics').mockResolvedValue(sampleAnalytics);

      render(
        <MemoryRouter initialEntries={['/manager/dashboard']}>
          <ManagerDashboardPage />
        </MemoryRouter>
      );

      // Verify KPI Strip
      await waitFor(() => {
        expect(screen.getByTestId('kpi-published-challenges')).toHaveTextContent('5');
      });
      expect(screen.getByTestId('kpi-active-enrollments')).toHaveTextContent('24');
      expect(screen.getByTestId('kpi-completed-enrollments')).toHaveTextContent('12');

      // Verify Popular Challenges
      expect(screen.getByText('Morning Yoga Challenge')).toBeInTheDocument();
      expect(screen.getByText('Deep Work Daily')).toBeInTheDocument();

      // Verify Top Categories & Completion Rates
      const topCategoriesSection = screen.getByTestId('top-categories-section');
      expect(within(topCategoriesSection).getByText('Health & Fitness')).toBeInTheDocument();
      expect(within(topCategoriesSection).getByText('Other')).toBeInTheDocument();
      expect(within(topCategoriesSection).getByText('Custom Aggregate')).toBeInTheDocument();

      // Accordion drill-down
      const accordionBtn = screen.getByTestId('other-categories-accordion-toggle');
      expect(accordionBtn).toBeInTheDocument();
      fireEvent.click(accordionBtn);

      await waitFor(() => {
        expect(screen.getByText('Guitar Practice')).toBeInTheDocument();
        expect(screen.getByText('Language Learning')).toBeInTheDocument();
      });
    });
  });

  describe('ManagerDirectoryPage (/manager/challenges)', () => {
    it('renders global challenges directory with Your Program badge and navigation', async () => {
      vi.spyOn(ManagerService, 'fetchManagerDirectory').mockResolvedValue(sampleDirectory);

      render(
        <MemoryRouter initialEntries={['/manager/challenges']}>
          <ManagerDirectoryPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga Challenge')).toBeInTheDocument();
      });

      // Verify "Your Program" badge is only on owned challenge
      expect(screen.getByTestId('your-program-badge')).toBeInTheDocument();
      expect(screen.getByText('Manager Bob')).toBeInTheDocument();

      // Search and Filter controls
      expect(screen.getByTestId('directory-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('directory-category-filter')).toBeInTheDocument();
    });
  });

  describe('ManagerChallengeDetailPage (/manager/challenges/:id)', () => {
    it('renders read-only program view, back button, and comment thread with manager reply support', async () => {
      vi.spyOn(ManagerService, 'fetchManagerDirectoryDetail').mockResolvedValue(sampleDetail);
      const postReplyMock = vi.spyOn(ManagerService, 'postManagerReply').mockResolvedValue({
        id: 503,
        programId: 101,
        parentCommentId: 501,
        content: 'Another manager tip!',
        createdAt: '2026-11-10T15:00:00.000Z',
        author: { id: 10, fullName: 'Manager Alice', role: 'PROGRAM_MANAGER' },
      });

      render(
        <MemoryRouter initialEntries={['/manager/challenges/101']}>
          <Routes>
            <Route path="/manager/challenges/:id" element={<ManagerChallengeDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga Challenge')).toBeInTheDocument();
      });

      // Back to directory button
      expect(screen.getByTestId('back-to-directory-btn')).toBeInTheDocument();

      // Read-only isolation: NO edit, publish, unpublish, delete buttons
      expect(screen.queryByText('Edit Challenge')).not.toBeInTheDocument();
      expect(screen.queryByText('Publish')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Draft')).not.toBeInTheDocument();

      // Comments and Replies
      expect(screen.getByText('Loved this routine! Kept me consistent.')).toBeInTheDocument();
      expect(screen.getByText('Great work John! Keep up the momentum.')).toBeInTheDocument();

      // Reply as manager
      const replyBtn = screen.getByTestId('reply-btn-501');
      fireEvent.click(replyBtn);

      const textarea = screen.getByTestId('reply-textarea-501');
      fireEvent.change(textarea, { target: { value: 'Another manager tip!' } });

      const submitBtn = screen.getByTestId('submit-reply-btn-501');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postReplyMock).toHaveBeenCalledWith(101, 501, 'Another manager tip!');
        expect(screen.getByText('Another manager tip!')).toBeInTheDocument();
      });
    });

    it('renders Back to Dashboard button when arriving from most popular challenges with from=dashboard', async () => {
      vi.spyOn(ManagerService, 'fetchManagerDirectoryDetail').mockResolvedValue(sampleDetail);

      render(
        <MemoryRouter initialEntries={['/manager/challenges/101?from=dashboard']}>
          <Routes>
            <Route path="/manager/challenges/:id" element={<ManagerChallengeDetailPage />} />
            <Route path="/manager/dashboard" element={<div>Manager Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Yoga Challenge')).toBeInTheDocument();
      });

      const backBtn = screen.getByTestId('back-to-dashboard-btn');
      expect(backBtn).toHaveTextContent('← Back to Dashboard');
      fireEvent.click(backBtn);

      await waitFor(() => {
        expect(screen.getByText('Manager Dashboard Page')).toBeInTheDocument();
      });
    });
  });

  describe('ProgramBuilder In-Place Preview (UI-S2-09, FR-S2-17)', () => {
    it('supports Edit | Preview segmented tabs in modal and row Preview button', async () => {
      const sampleProgram: ChallengeProgram = {
        id: 201,
        title: '30-Day Fitness',
        category: 'Health & Fitness',
        description: 'Get in shape',
        durationDays: 30,
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-30T23:59:59.000Z',
        status: 'DRAFT',
        activities: [
          {
            id: 1,
            title: 'Pushups',
            frequency: 'DAILY',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            targetCount: 20,
          },
        ],
      };

      vi.spyOn(ManagerService, 'fetchManagerPrograms').mockResolvedValue([sampleProgram]);

      render(
        <MemoryRouter>
          <ProgramBuilder />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('30-Day Fitness')).toBeInTheDocument();
      });

      // Row Preview button
      const previewBtn = screen.getByRole('button', { name: 'Preview' });
      expect(previewBtn).toBeInTheDocument();
      fireEvent.click(previewBtn);

      // Verify row preview modal opened
      await waitFor(() => {
        expect(screen.getByText('Challenge Layout Preview')).toBeInTheDocument();
        expect(screen.getByTestId('preview-mode-banner')).toBeInTheDocument();
        expect(screen.getByTestId('preview-mode-join-disabled')).toBeInTheDocument();
      });

      // Close preview modal
      fireEvent.click(screen.getByRole('button', { name: 'Close Preview' }));

      // Open Create modal
      fireEvent.click(screen.getByText('+ Create Challenge'));

      // Check segmented tabs
      const editTab = screen.getByRole('tab', { name: 'Edit' });
      const previewTab = screen.getByRole('tab', { name: 'Preview' });
      expect(editTab).toBeInTheDocument();
      expect(previewTab).toBeInTheDocument();

      // Switch to preview tab
      fireEvent.click(previewTab);
      await waitFor(() => {
        expect(screen.getByTestId('preview-mode-banner')).toBeInTheDocument();
      });
    });
  });
});
