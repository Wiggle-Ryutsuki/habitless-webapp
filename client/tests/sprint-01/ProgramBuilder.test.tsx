import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgramBuilder } from '../../src/components/ProgramBuilder.js';
import * as ManagerService from '../../src/services/manager.service.js';
import { ChallengeProgram } from '../../src/types/challenge.types.js';

describe('Program Builder Component (UI-07)', () => {
  const samplePrograms: ChallengeProgram[] = [
    {
      id: 1,
      title: '30-Day Wellness Challenge',
      category: 'Wellness',
      description: 'Establish daily healthy habits',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-30T00:00:00.000Z',
      status: 'PUBLISHED',
      activitiesCount: 3,
      inviteUrl: '/challenges/1',
      activities: [
        { title: 'Daily Hydration (2L)', frequency: 'DAILY', targetCount: 1 },
        { title: 'Morning Meditation', frequency: 'DAILY', targetCount: 1 },
        { title: 'Cardio Walk', frequency: 'THREE_TIMES_WEEKLY', targetCount: 3 },
      ],
    },
    {
      id: 2,
      title: 'Mindful Breathing Draft',
      category: 'Mindfulness',
      description: 'Intro to breathwork',
      startDate: '2026-12-05T00:00:00.000Z',
      endDate: '2026-12-20T00:00:00.000Z',
      status: 'DRAFT',
      activitiesCount: 1,
      inviteUrl: null,
      activities: [{ title: 'Box breathing', frequency: 'DAILY', targetCount: 1 }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ManagerService, 'fetchManagerPrograms').mockResolvedValue(samplePrograms);
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders managed programs list and challenge builder form with required inputs', async () => {
    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('30-Day Wellness Challenge')).toBeInTheDocument();
      expect(screen.getByText('Mindful Breathing Draft')).toBeInTheDocument();
    });

    expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();

    // Click + Create Challenge to open modal
    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));

    // Verify form fields inside modal
    expect(screen.getByLabelText(/Program Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description \/ Guidelines/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Activity 1 Title/)).toBeInTheDocument();
  });

  it('dynamically adds and removes activity rows with minimum 1 activity constraint', async () => {
    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Challenge Programs')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));

    // Initially 1 activity row, so remove button shouldn't exist
    expect(screen.queryByLabelText(/Remove activity/)).not.toBeInTheDocument();

    // Click "+ Add Activity"
    const addBtn = screen.getByText('+ Add Activity');
    fireEvent.click(addBtn);

    // Now 2 activity rows exist
    expect(screen.getByLabelText(/Activity 2 Title/)).toBeInTheDocument();
    const removeButtons = screen.getAllByLabelText(/Remove activity/);
    expect(removeButtons).toHaveLength(2);

    // Click remove on row 2
    fireEvent.click(removeButtons[1]);

    // Back to 1 activity row
    expect(screen.queryByLabelText(/Activity 2 Title/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Remove activity/)).not.toBeInTheDocument();
  });

  it('validates date range when end date is before start date', async () => {
    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Challenge Programs')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));

    fireEvent.change(screen.getByLabelText(/Program Title/), { target: { value: 'Fitness Sprint' } });
    fireEvent.change(screen.getByLabelText(/Start Date/), { target: { value: '2026-12-15' } });
    fireEvent.change(screen.getByLabelText(/End Date/), { target: { value: '2026-12-10' } });
    fireEvent.change(screen.getByLabelText(/Activity 1 Title/), { target: { value: 'Running' } });

    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));

    await waitFor(() => {
      expect(screen.getByText('End date must be on or after start date.')).toBeInTheDocument();
    });
  });

  it('submits valid draft challenge form, calling createProgram', async () => {
    const createSpy = vi.spyOn(ManagerService, 'createProgram').mockResolvedValue({
      id: 3,
      title: 'Hydration 101',
      category: 'Wellness',
      description: 'Drink water',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-20T00:00:00.000Z',
      status: 'DRAFT',
      activitiesCount: 1,
    });

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Challenge Programs')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));

    fireEvent.change(screen.getByLabelText(/Program Title/), { target: { value: 'Hydration 101' } });
    fireEvent.change(screen.getByLabelText(/Start Date/), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/), { target: { value: '2026-12-20' } });
    fireEvent.change(screen.getByLabelText(/Activity 1 Title/), { target: { value: 'Drink 2L' } });

    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hydration 101',
          category: 'Wellness',
          activities: [
            expect.objectContaining({
              title: 'Drink 2L',
              daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
              frequency: 'DAILY',
            }),
          ],
        })
      );
    });
  });

  it('prompts confirmation when clicking Cancel in challenge creator and allows discarding', async () => {
    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Challenge Programs')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));
    fireEvent.change(screen.getByLabelText(/Program Title/), { target: { value: 'Unfinished Draft' } });

    // Click Cancel button in modal
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    // Confirmation dialog should be visible
    expect(screen.getByText('Cancel Challenge Creation?')).toBeInTheDocument();
    expect(screen.getByText(/Any unsaved changes will be lost/i)).toBeInTheDocument();

    // Click Resume Editing -> modal stays open
    fireEvent.click(screen.getByRole('button', { name: /resume editing/i }));
    expect(screen.queryByText('Cancel Challenge Creation?')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Unfinished Draft')).toBeInTheDocument();

    // Click Cancel again, then confirm Discard Changes
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));

    // Modal is now closed
    await waitFor(() => {
      expect(screen.queryByText('Create a New Challenge')).not.toBeInTheDocument();
    });
  });

  it('prompts confirmation before publishing when clicking Save and Publish in modal', async () => {
    const createSpy = vi.spyOn(ManagerService, 'createProgram').mockResolvedValue({
      id: 5,
      title: 'Instant Published Challenge',
      category: 'Wellness',
      description: null,
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-30T00:00:00.000Z',
      status: 'DRAFT',
      activitiesCount: 1,
    });
    const deploySpy = vi.spyOn(ManagerService, 'deployProgram').mockResolvedValue({
      id: 5,
      title: 'Instant Published Challenge',
      status: 'PUBLISHED',
      deployedAt: '2026-12-01T00:00:00.000Z',
      inviteUrl: '/challenges/5',
    });

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Challenge Programs')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));
    fireEvent.change(screen.getByLabelText(/Program Title/), { target: { value: 'Instant Published Challenge' } });
    fireEvent.change(screen.getByLabelText(/Start Date/), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/), { target: { value: '2026-12-30' } });
    fireEvent.change(screen.getByLabelText(/Activity 1 Title/), { target: { value: 'Meditation' } });

    // Click Save and Publish
    fireEvent.click(screen.getByRole('button', { name: /save and publish/i }));

    // Confirmation dialog appears
    expect(screen.getByText('Publish Challenge to the Web?')).toBeInTheDocument();

    // Confirm publish
    fireEvent.click(screen.getByRole('button', { name: /publish now/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
      expect(deploySpy).toHaveBeenCalledWith(5);
    });
  });

  it('allows choosing specific days of the week for curriculum activities', async () => {
    const createSpy = vi.spyOn(ManagerService, 'createProgram').mockResolvedValue({
      id: 4,
      title: 'Weekday Focus Challenge',
      category: 'Productivity',
      description: 'Focus during weekdays',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      status: 'DRAFT',
      activitiesCount: 1,
    });

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Challenge Programs')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));

    fireEvent.change(screen.getByLabelText(/Program Title/), { target: { value: 'Weekday Focus Challenge' } });
    fireEvent.change(screen.getByLabelText(/Start Date/), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/), { target: { value: '2026-12-31' } });
    fireEvent.change(screen.getByLabelText(/Activity 1 Title/), { target: { value: 'Deep Work' } });

    // Toggle Saturday (day 6) and Sunday (day 7) off
    const satBtn = screen.getByRole('checkbox', { name: 'Saturday' });
    const sunBtn = screen.getByRole('checkbox', { name: 'Sunday' });
    fireEvent.click(satBtn);
    fireEvent.click(sunBtn);

    // Save as Draft
    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Weekday Focus Challenge',
          activities: [
            expect.objectContaining({
              title: 'Deep Work',
              daysOfWeek: [1, 2, 3, 4, 5],
              frequency: 'WEEKDAYS',
            }),
          ],
        })
      );
    });
  });

  it('confirms and publishes a draft challenge from the table', async () => {
    const deploySpy = vi.spyOn(ManagerService, 'deployProgram').mockResolvedValue({
      id: 2,
      title: 'Mindful Breathing Draft',
      status: 'PUBLISHED',
      deployedAt: '2026-11-14T10:00:00.000Z',
      inviteUrl: '/challenges/2',
    });

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Mindful Breathing Draft')).toBeInTheDocument();
    });

    // Click Publish button on draft row
    const publishBtn = screen.getByRole('button', { name: /^publish$/i });
    fireEvent.click(publishBtn);

    // Confirmation dialog appears
    expect(screen.getByText('Publish Challenge?')).toBeInTheDocument();

    // Confirm
    fireEvent.click(screen.getByRole('button', { name: /publish to web/i }));

    await waitFor(() => {
      expect(deploySpy).toHaveBeenCalledWith(2);
    });
  });

  it('confirms and deletes a draft challenge from the table', async () => {
    const deleteSpy = vi.spyOn(ManagerService, 'deleteProgram').mockResolvedValue({
      message: 'Draft challenge program deleted successfully.',
      id: 2,
    });

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Mindful Breathing Draft')).toBeInTheDocument();
    });

    // Click Delete Draft button on draft row
    const deleteBtn = screen.getByRole('button', { name: /delete draft/i });
    fireEvent.click(deleteBtn);

    // Confirmation dialog appears with warning
    expect(screen.getByText('Delete Draft Challenge?')).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmDeleteBtn = screen.getAllByRole('button', { name: /delete draft/i })[1];
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(2);
    });
  });

  it('copies public invite link to clipboard when clicking Copy Link on published program', async () => {
    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('/challenges/1')).toBeInTheDocument();
    });

    const copyBtn = screen.getByText('Copy Link');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/challenges/1'));
    await waitFor(() => {
      expect(screen.getByText('Link copied to clipboard!')).toBeInTheDocument();
    });
  });

  it('unpublishes a published program with 0 enrollments showing safe-to-unpublish dialog', async () => {
    const unpublishSpy = vi.spyOn(ManagerService, 'unpublishProgram').mockResolvedValue({
      id: 1,
      title: '30-Day Wellness Challenge',
      category: 'Wellness',
      description: 'Establish daily healthy habits',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-30T00:00:00.000Z',
      status: 'DRAFT',
      previouslyPublished: true,
      enrollmentsCount: 0,
      activitiesCount: 3,
      inviteUrl: null,
    });

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('30-Day Wellness Challenge')).toBeInTheDocument();
    });

    // Find the Unpublish button for the published program
    const unpublishBtn = screen.getByRole('button', { name: /^unpublish$/i });
    expect(unpublishBtn).toBeInTheDocument();
    fireEvent.click(unpublishBtn);

    // Confirmation dialog should appear with 0-users-accepted safe message
    expect(screen.getByText('Unpublish Challenge?')).toBeInTheDocument();
    expect(
      screen.getByText(/0 users have accepted this challenge, so it is safe to unpublish/i)
    ).toBeInTheDocument();

    // Confirm unpublish
    const confirmBtn = screen.getByRole('button', { name: /^unpublish challenge$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(unpublishSpy).toHaveBeenCalledWith(1);
    });
  });

  it('unpublishes an active challenge with >0 enrollments showing warning and status change notice', async () => {
    // Mock programs where program 1 has 5 enrolled participants
    const programsWithEnrollments: ChallengeProgram[] = [
      {
        ...samplePrograms[0],
        enrollmentsCount: 5,
      },
    ];
    vi.spyOn(ManagerService, 'fetchManagerPrograms').mockResolvedValue(programsWithEnrollments);
    const unpublishSpy = vi.spyOn(ManagerService, 'unpublishProgram').mockResolvedValue({
      ...programsWithEnrollments[0],
      status: 'DRAFT',
      previouslyPublished: true,
    });

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('30-Day Wellness Challenge')).toBeInTheDocument();
    });

    const unpublishBtn = screen.getByRole('button', { name: /^unpublish$/i });
    fireEvent.click(unpublishBtn);

    // Warning dialog should state 5 users enrolled and warn about status change
    expect(screen.getByText('Unpublish Active Challenge?')).toBeInTheDocument();
    expect(
      screen.getByText(/5 users have already accepted and enrolled in this challenge/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/unpublishing will change their challenge status/i)
    ).toBeInTheDocument();

    // Confirm unpublish
    const confirmBtn = screen.getByRole('button', { name: /proceed & unpublish/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(unpublishSpy).toHaveBeenCalledWith(1);
    });
  });

  it('displays "Previously Published" badge and shows modal note when editing an unpublished draft', async () => {
    const unpublishedDrafts: ChallengeProgram[] = [
      {
        id: 7,
        title: 'Unpublished Meditation Course',
        category: 'Mindfulness',
        description: 'Previously live course',
        startDate: '2026-12-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        status: 'DRAFT',
        previouslyPublished: true,
        activitiesCount: 1,
        activities: [{ title: 'Daily breathwork', frequency: 'DAILY', targetCount: 1 }],
      },
    ];
    vi.spyOn(ManagerService, 'fetchManagerPrograms').mockResolvedValue(unpublishedDrafts);

    render(<ProgramBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Unpublished Meditation Course')).toBeInTheDocument();
    });

    // Verify "Previously Published" badge is rendered next to DRAFT
    expect(screen.getByText('Previously Published')).toBeInTheDocument();

    // Click Edit on this draft
    const editBtn = screen.getByRole('button', { name: /^edit$/i });
    fireEvent.click(editBtn);

    // Modal opens, check for the informative banner note
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(
      screen.getByText(/this challenge was previously published and is currently unpublished/i)
    ).toBeInTheDocument();
  });
});
