import React, { useState } from 'react';
import { DailyNote } from '../types/habit.js';
import { createNote, HabitApiError } from '../services/habits.service.js';

export interface CalendarNotesProps {
  notes: DailyNote[];
  habits: { id: number; title: string; colorHex?: string }[];
  currentDate?: string;
  onNoteCreated: (note: DailyNote) => void;
}

export const CalendarNotes: React.FC<CalendarNotesProps> = ({
  notes,
  habits,
  currentDate,
  onNoteCreated,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteDate, setNoteDate] = useState(() => currentDate || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage('Note content cannot be empty.');
      return;
    }
    if (content.trim().length > 1000) {
      setErrorMessage('Content cannot exceed 1000 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await createNote({
        noteDate,
        content: content.trim(),
        habitId: selectedHabitId === '' ? null : Number(selectedHabitId),
      });

      onNoteCreated(created);
      setContent('');
      setIsFormOpen(false);
    } catch (err) {
      if (err instanceof HabitApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Could not save note. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <section
      aria-label="Calendar Notes"
      style={{
        marginTop: '28px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(114, 67, 25, 0.08)',
        border: '1px solid #feeac7',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#724319', fontWeight: 700 }}>
            Daily Notes & Reflections
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#724319', opacity: 0.75 }}>
            Capture context, progress, and observations alongside your habit tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          style={{
            backgroundColor: isFormOpen ? 'transparent' : '#724319',
            border: isFormOpen ? '1px solid #d88180' : 'none',
            color: isFormOpen ? '#724319' : '#ffffff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isFormOpen ? 'Close Note' : '+ New Note'}
        </button>
      </div>

      {/* Inline Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#fffdf8',
            border: '1px solid #feeac7',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                htmlFor="note-date"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#724319', marginBottom: '4px' }}
              >
                Date <span style={{ color: '#d88180' }}>*</span>
              </label>
              <input
                id="note-date"
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #feeac7',
                  backgroundColor: '#ffffff',
                  color: '#724319',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="note-habit"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#724319', marginBottom: '4px' }}
              >
                Associated Habit (Optional)
              </label>
              <select
                id="note-habit"
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #feeac7',
                  backgroundColor: '#ffffff',
                  color: '#724319',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">General Reflection (No Habit)</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label
                htmlFor="note-content"
                style={{ fontSize: '13px', fontWeight: 600, color: '#724319' }}
              >
                Reflection <span style={{ color: '#d88180' }}>*</span>
              </label>
              <span
                style={{
                  fontSize: '12px',
                  color: content.length > 1000 ? '#d88180' : '#724319',
                  opacity: 0.75,
                }}
              >
                {content.length} / 1000
              </span>
            </div>
            <textarea
              id="note-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What went well today? What triggered missed habits?"
              maxLength={1000}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #feeac7',
                backgroundColor: '#ffffff',
                color: '#724319',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {errorMessage && (
            <div role="alert" aria-live="polite" style={{ color: '#d88180', fontSize: '13px' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              style={{
                height: '36px',
                padding: '0 14px',
                borderRadius: '6px',
                border: '1px solid #d88180',
                backgroundColor: 'transparent',
                color: '#724319',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#724319',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting || !content.trim() ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || !content.trim() ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Posting...' : 'Post Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes List / Feed */}
      {notes.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#724319',
            opacity: 0.7,
            fontSize: '14px',
          }}
        >
          No reflection notes yet. Log your first habit reflection.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notes.map((note) => (
            <article
              key={note.id}
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: '#fffdf9',
                border: '1px solid #feeac7',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#724319',
                    }}
                  >
                    {formatDateDisplay(note.noteDate)}
                  </span>
                  {note.habitTitle && (
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: note.colorHex || '#ff9800',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      {note.habitTitle}
                    </span>
                  )}
                </div>

                {note.timestamp && (
                  <time
                    dateTime={note.timestamp}
                    style={{ fontSize: '12px', color: '#724319', opacity: 0.6 }}
                  >
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                )}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#724319',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {note.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
