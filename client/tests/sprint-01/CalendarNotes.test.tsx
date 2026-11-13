import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarNotes } from '../../src/components/CalendarNotes.js';
import * as HabitsService from '../../src/services/habits.service.js';
import { DailyNote } from '../../src/types/habit.js';

describe('Calendar Notes Feed Component (UI-06)', () => {
  const sampleHabits = [
    { id: 101, title: 'No alcohol', colorHex: '#f44336' },
    { id: 102, title: 'Exercise', colorHex: '#448aff' },
  ];

  const sampleNotes: DailyNote[] = [
    {
      id: 1,
      habitId: 101,
      habitTitle: 'No alcohol',
      colorHex: '#f44336',
      noteDate: '2021-03-18',
      timestamp: '2021-03-18T21:00:00.000Z',
      content: "I gotta make sure I don't let my alcohol intake get regular again.",
    },
    {
      id: 2,
      habitId: 102,
      habitTitle: 'Exercise',
      colorHex: '#448aff',
      noteDate: '2021-03-17',
      timestamp: '2021-03-17T21:00:00.000Z',
      content: 'Great energy after morning workout.',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing reflection notes with date, habit chip, and content', () => {
    render(
      <CalendarNotes
        notes={sampleNotes}
        habits={sampleHabits}
        onNoteCreated={vi.fn()}
      />
    );

    expect(screen.getByText('Daily Notes & Reflections')).toBeInTheDocument();
    expect(screen.getByText("I gotta make sure I don't let my alcohol intake get regular again.")).toBeInTheDocument();
    expect(screen.getByText('Great energy after morning workout.')).toBeInTheDocument();

    expect(screen.getByText('No alcohol')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
  });

  it('toggles new note form when clicking + New Note', () => {
    render(
      <CalendarNotes
        notes={sampleNotes}
        habits={sampleHabits}
        onNoteCreated={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: '+ New Note' });
    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText(/Reflection/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post Note' })).toBeInTheDocument();

    // Clicking again or Cancel closes form
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByLabelText(/Reflection/)).not.toBeInTheDocument();
  });

  it('submits a new note and triggers onNoteCreated callback', async () => {
    const mockOnNoteCreated = vi.fn();
    vi.spyOn(HabitsService, 'createNote').mockResolvedValue({
      id: 3,
      habitId: 101,
      habitTitle: 'No alcohol',
      colorHex: '#f44336',
      noteDate: '2021-03-19',
      timestamp: '2021-03-19T10:00:00.000Z',
      content: 'Zero cravings today. Feeling strong.',
    });

    render(
      <CalendarNotes
        notes={sampleNotes}
        habits={sampleHabits}
        onNoteCreated={mockOnNoteCreated}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ New Note' }));

    const textarea = screen.getByLabelText(/Reflection/);
    fireEvent.change(textarea, { target: { value: 'Zero cravings today. Feeling strong.' } });

    const postBtn = screen.getByRole('button', { name: 'Post Note' });
    fireEvent.click(postBtn);

    await waitFor(() => {
      expect(HabitsService.createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Zero cravings today. Feeling strong.',
        })
      );
      expect(mockOnNoteCreated).toHaveBeenCalled();
    });
  });

  it('renders empty notes message when notes list is empty', () => {
    render(
      <CalendarNotes
        notes={[]}
        habits={sampleHabits}
        onNoteCreated={vi.fn()}
      />
    );

    expect(screen.getByText('No reflection notes yet. Log your first habit reflection.')).toBeInTheDocument();
  });
});

