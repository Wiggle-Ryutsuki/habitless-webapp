import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header.js';
import { CalendarMatrix } from '../components/CalendarMatrix.js';
import { EditHabitModal, HabitToEdit } from '../components/EditHabitModal.js';
import { NewHabitModal } from '../components/NewHabitModal.js';
import { CalendarNotes } from '../components/CalendarNotes.js';
import { CalendarHabit, DailyNote, Habit } from '../types/habit.js';
import { fetchNotes, fetchHabits } from '../services/habits.service.js';

export const HabitCalendarPage: React.FC = () => {
  const [selectedHabitForEdit, setSelectedHabitForEdit] = useState<HabitToEdit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [habitsList, setHabitsList] = useState<Habit[]>([]);

  const loadNotesAndHabits = async () => {
    try {
      const [fetchedNotes, fetchedHabits] = await Promise.all([
        fetchNotes(),
        fetchHabits('active'),
      ]);
      setNotes(fetchedNotes);
      setHabitsList(fetchedHabits);
    } catch {
      // Silently handle initial network errors or rely on component-level retry
    }
  };

  useEffect(() => {
    loadNotesAndHabits();
  }, [refreshKey]);

  const handleEditHabit = (h: CalendarHabit) => {
    const matched = habitsList.find((item) => item.id === h.habitId);
    setSelectedHabitForEdit({
      id: h.habitId,
      title: h.title,
      description: h.description !== undefined ? h.description : (matched?.description ?? null),
      colorHex: h.colorHex,
      frequency: h.frequency || matched?.frequency || 'DAILY',
      daysOfWeek: h.daysOfWeek || matched?.daysOfWeek,
      startDate: h.startDate || matched?.startDate,
      endDate: h.endDate !== undefined ? h.endDate : (matched?.endDate ?? null),
      targetCount: h.targetCount,
    });
    setIsEditModalOpen(true);
  };

  const handleHabitUpdated = (updated: Habit) => {
    setHabitsList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedHabitForEdit(null);
    setRefreshKey((k) => k + 1);
  };

  const handleHabitArchived = (_habitId: number) => {
    setRefreshKey((k) => k + 1);
  };

  const handleHabitCreated = (created: Habit) => {
    setHabitsList((prev) => [...prev, created]);
    setRefreshKey((k) => k + 1);
  };

  const handleNoteCreated = (newNote: DailyNote) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleNoteUpdated = (updatedNote: DailyNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  };

  const handleNoteDeleted = (noteId: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--powder-blush)' }}>
      <Header />
      <main style={{ maxWidth: '1400px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <CalendarMatrix
          onEditHabit={handleEditHabit}
          onNewHabitClick={() => setIsNewModalOpen(true)}
          refreshKey={refreshKey}
        />

        <CalendarNotes
          notes={notes}
          habits={habitsList}
          onNoteCreated={handleNoteCreated}
          onNoteUpdated={handleNoteUpdated}
          onNoteDeleted={handleNoteDeleted}
        />

        <EditHabitModal
          isOpen={isEditModalOpen}
          habit={selectedHabitForEdit}
          onClose={() => setIsEditModalOpen(false)}
          onHabitUpdated={handleHabitUpdated}
          onHabitArchived={handleHabitArchived}
        />

        <NewHabitModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onHabitCreated={handleHabitCreated}
        />
      </main>
    </div>
  );
};
