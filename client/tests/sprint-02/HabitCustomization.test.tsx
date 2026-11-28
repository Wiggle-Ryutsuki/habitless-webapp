import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NewHabitModal } from '../../src/components/NewHabitModal.js';
import { EditHabitModal, HabitToEdit } from '../../src/components/EditHabitModal.js';
import { ProgramBuilder } from '../../src/components/ProgramBuilder.js';
import { HABIT_CATEGORY_PRESETS } from '../../src/components/CategorySelector.js';
import * as HabitsService from '../../src/services/habits.service.js';
import * as ManagerService from '../../src/services/manager.service.js';

describe('Feature 5 Category Selection & Preserved 8-Color Palette (UI-S2-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 9 presets + Uncategorized + Custom in NewHabitModal and preserves 8 fixed ColorPicker swatches', async () => {
    const createSpy = vi.spyOn(HabitsService, 'createHabit').mockResolvedValue({
      id: 11,
      userId: 1,
      title: 'Budget Review',
      description: null,
      category: 'Personal Budgeting',
      colorHex: '#ff9800',
      frequency: 'DAILY',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-11-26T00:00:00.000Z',
      endDate: null,
      targetCount: 20,
      isActive: true,
      programId: null,
      createdAt: '2026-11-26T00:00:00.000Z',
      updatedAt: '2026-11-26T00:00:00.000Z',
    });

    render(
      <NewHabitModal isOpen={true} onClose={vi.fn()} onHabitCreated={vi.fn()} />
    );

    // Sprint 1 8 fixed swatches preserved (no 9th custom circle or color wheel)
    expect(screen.getAllByRole('radio')).toHaveLength(8);
    expect(screen.queryByLabelText(/custom color/i)).not.toBeInTheDocument();

    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(screen.getByRole('option', { name: 'Uncategorized (Optional)' })).toBeInTheDocument();
    for (const preset of HABIT_CATEGORY_PRESETS) {
      expect(screen.getByRole('option', { name: preset })).toBeInTheDocument();
    }
    expect(screen.getByRole('option', { name: 'Custom...' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Habit Name/i), { target: { value: 'Budget Review' } });
    fireEvent.change(select, { target: { value: '__CUSTOM__' } });

    // Blank custom category triggers inline validation
    fireEvent.click(screen.getByRole('button', { name: 'Save Habit' }));
    expect(
      screen.getByText('Please enter a custom category or select Uncategorized.')
    ).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    // > 50 characters triggers inline validation
    const customInput = screen.getByLabelText('Custom category');
    fireEvent.change(customInput, { target: { value: 'X'.repeat(51) } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Habit' }));
    expect(screen.getByText('Category cannot exceed 50 characters.')).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    // Valid custom category submits trimmed value
    fireEvent.change(customInput, { target: { value: '  Personal Budgeting  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Habit' }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Budget Review',
          category: 'Personal Budgeting',
        })
      );
    });
  });

  it('pre-populates custom category in EditHabitModal and allows clearing to Uncategorized (null)', async () => {
    const habitWithCustomCategory: HabitToEdit = {
      id: 202,
      title: 'Guitar Practice',
      description: '30 minutes acoustic',
      category: 'Music Practice',
      colorHex: '#009688',
      frequency: 'DAILY',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-11-01',
      endDate: null,
      targetCount: 20,
    };

    const updateSpy = vi.spyOn(HabitsService, 'updateHabit').mockResolvedValue({
      id: 202,
      userId: 1,
      title: 'Guitar Practice',
      description: '30 minutes acoustic',
      category: null,
      colorHex: '#009688',
      frequency: 'DAILY',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: null,
      targetCount: 20,
      isActive: true,
      programId: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-26T00:00:00.000Z',
    });

    render(
      <EditHabitModal
        isOpen={true}
        habit={habitWithCustomCategory}
        onClose={vi.fn()}
        onHabitUpdated={vi.fn()}
      />
    );

    expect(screen.getAllByRole('radio')).toHaveLength(8);
    expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('__CUSTOM__');
    expect((screen.getByLabelText('Custom category') as HTMLInputElement).value).toBe('Music Practice');

    // Switch to Uncategorized and save
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        202,
        expect.objectContaining({
          category: null,
        })
      );
    });
  });

  it('uses 9 presets (default Health & Fitness, no Uncategorized) + Custom pre-fill on ProgramBuilder', async () => {
    vi.spyOn(ManagerService, 'fetchManagerPrograms').mockResolvedValue([
      {
        id: 7,
        title: 'Legacy Wellness Draft',
        category: 'Wellness',
        description: 'Legacy draft category',
        startDate: '2026-12-01T00:00:00.000Z',
        endDate: '2026-12-20T00:00:00.000Z',
        status: 'DRAFT',
        activitiesCount: 1,
        activities: [
          {
            id: 71,
            programId: 7,
            title: 'Hydrate',
            description: null,
            frequency: 'DAILY',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            targetCount: 1,
          },
        ],
      },
    ]);

    render(
      <MemoryRouter>
        <ProgramBuilder />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Legacy Wellness Draft')).toBeInTheDocument();
    });

    // Creating a new challenge defaults to Health & Fitness and omits Uncategorized
    fireEvent.click(screen.getByRole('button', { name: /\+ create challenge/i }));
    const catSelect = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(catSelect.value).toBe('Health & Fitness');
    expect(screen.queryByRole('option', { name: /Uncategorized/i })).not.toBeInTheDocument();

    // Selecting Custom with blank input triggers required validation
    fireEvent.change(catSelect, { target: { value: '__CUSTOM__' } });
    fireEvent.change(screen.getByLabelText(/Program Title/i), { target: { value: 'New Custom Challenge' } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-12-20' } });
    fireEvent.change(screen.getByLabelText(/Activity 1 Title/i), { target: { value: 'Run 2km' } });
    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));
    expect(screen.getByText('Custom category is required.')).toBeInTheDocument();

    // Close and edit legacy draft with "Wellness" -> selects Custom... and pre-fills "Wellness"
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('__CUSTOM__');
    expect((screen.getByLabelText('Custom category') as HTMLInputElement).value).toBe('Wellness');
  });
});
