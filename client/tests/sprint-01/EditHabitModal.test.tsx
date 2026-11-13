import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditHabitModal, HabitToEdit } from '../../src/components/EditHabitModal.js';
import * as HabitsService from '../../src/services/habits.service.js';

describe('In-Calendar Habit Edit Modal (UI-05)', () => {
  const sampleHabit: HabitToEdit = {
    id: 101,
    title: 'Morning Yoga',
    description: '30 mins stretch routine',
    colorHex: '#009688',
    frequency: 'DAILY',
    startDate: '2026-03-01',
    endDate: null,
    targetCount: 20,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pre-populated habit values and 8 color swatches when open', () => {
    render(
      <EditHabitModal
        isOpen={true}
        habit={sampleHabit}
        onClose={vi.fn()}
        onHabitUpdated={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Edit Habit' })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Habit Name/);
    expect((titleInput as HTMLInputElement).value).toBe('Morning Yoga');

    const descInput = screen.getByLabelText(/Description/);
    expect((descInput as HTMLTextAreaElement).value).toBe('30 mins stretch routine');

    const targetInput = screen.getByLabelText(/Target Count/);
    expect((targetInput as HTMLInputElement).value).toBe('20');

    // Verify 8 swatches rendered
    const radiogroup = screen.getByRole('radiogroup', { name: 'Habit color selection' });
    expect(radiogroup).toBeInTheDocument();
    const swatches = screen.getAllByRole('radio');
    expect(swatches.length).toBe(8);
  });

  it('submits updated values and calls updateHabit and onHabitUpdated', async () => {
    const mockOnHabitUpdated = vi.fn();
    const mockOnClose = vi.fn();

    vi.spyOn(HabitsService, 'updateHabit').mockResolvedValue({
      id: 101,
      userId: 1,
      title: 'Power Yoga & Stretch',
      description: 'Updated routine',
      colorHex: '#448aff',
      frequency: 'DAILY',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: null,
      targetCount: 25,
      isActive: true,
      programId: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-18T00:00:00.000Z',
    });

    render(
      <EditHabitModal
        isOpen={true}
        habit={sampleHabit}
        onClose={mockOnClose}
        onHabitUpdated={mockOnHabitUpdated}
      />
    );

    const titleInput = screen.getByLabelText(/Habit Name/);
    fireEvent.change(titleInput, { target: { value: 'Power Yoga & Stretch' } });

    const targetInput = screen.getByLabelText(/Target Count/);
    fireEvent.change(targetInput, { target: { value: '25' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(HabitsService.updateHabit).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          title: 'Power Yoga & Stretch',
          targetCount: 25,
        })
      );
      expect(mockOnHabitUpdated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('validates required title and target count bounds (1–31)', async () => {
    render(
      <EditHabitModal
        isOpen={true}
        habit={sampleHabit}
        onClose={vi.fn()}
        onHabitUpdated={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/Habit Name/);
    fireEvent.change(titleInput, { target: { value: ' ' } });

    const targetInput = screen.getByLabelText(/Target Count/);
    fireEvent.change(targetInput, { target: { value: '35' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveBtn);

    expect(screen.getByText('Habit title is required.')).toBeInTheDocument();
    expect(screen.getByText('Target count must be between 1 and 31.')).toBeInTheDocument();
    expect(HabitsService.updateHabit).not.toHaveBeenCalled();
  });

  it('closes modal when Cancel button is clicked without calling API', () => {
    const mockOnClose = vi.fn();

    render(
      <EditHabitModal
        isOpen={true}
        habit={sampleHabit}
        onClose={mockOnClose}
        onHabitUpdated={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
    expect(HabitsService.updateHabit).not.toHaveBeenCalled();
  });

  it('correctly pre-populates and immediately saves frequency and endDate changes', async () => {
    const mockOnHabitUpdated = vi.fn();
    const habitWithDates: HabitToEdit = {
      ...sampleHabit,
      frequency: 'WEEKDAYS',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
    };

    vi.spyOn(HabitsService, 'updateHabit').mockResolvedValue({
      id: 101,
      userId: 1,
      title: 'Morning Yoga',
      description: '30 mins stretch routine',
      colorHex: '#009688',
      frequency: 'WEEKLY',
      daysOfWeek: [1],
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      targetCount: 20,
      isActive: true,
      programId: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-18T00:00:00.000Z',
    });

    render(
      <EditHabitModal
        isOpen={true}
        habit={habitWithDates}
        onClose={vi.fn()}
        onHabitUpdated={mockOnHabitUpdated}
      />
    );

    const freqSelect = screen.getByLabelText(/Frequency/);
    expect((freqSelect as HTMLSelectElement).value).toBe('WEEKDAYS');

    const endInput = screen.getByLabelText(/End Date/);
    expect((endInput as HTMLInputElement).value).toBe('2026-06-30');

    // Change frequency to WEEKLY and endDate to 2026-12-31
    fireEvent.change(freqSelect, { target: { value: 'WEEKLY' } });
    fireEvent.change(endInput, { target: { value: '2026-12-31' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(HabitsService.updateHabit).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          frequency: 'WEEKLY',
          endDate: expect.stringContaining('2026-12-31'),
        })
      );
      expect(mockOnHabitUpdated).toHaveBeenCalled();
    });
  });
});

