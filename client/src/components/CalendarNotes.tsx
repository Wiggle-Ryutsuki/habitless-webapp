import React, { useState, useEffect } from 'react';
import { DailyNote } from '../types/habit.js';
import { createNote, updateNote, deleteNote, HabitApiError } from '../services/habits.service.js';

export interface CalendarNotesProps {
  notes: DailyNote[];
  habits: { id: number; title: string; colorHex?: string }[];
  currentDate?: string;
  onNoteCreated?: (note: DailyNote) => void;
  onNoteUpdated?: (note: DailyNote) => void;
  onNoteDeleted?: (noteId: number) => void;
}

export const CalendarNotes: React.FC<CalendarNotesProps> = ({
  notes,
  habits,
  currentDate,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteDate, setNoteDate] = useState(() => currentDate || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editNoteDate, setEditNoteDate] = useState('');
  const [editHabitId, setEditHabitId] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  // Themed delete confirmation modal state
  const [noteToDelete, setNoteToDelete] = useState<DailyNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && noteToDelete) {
        cancelDelete();
      }
    };
    if (noteToDelete) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [noteToDelete]);

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

      if (onNoteCreated) {
        onNoteCreated(created);
      }
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

  const startEditing = (note: DailyNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditNoteDate(note.noteDate);
    setEditHabitId(note.habitId ?? '');
    setEditErrorMessage(null);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
    setEditErrorMessage(null);
  };

  const handleUpdate = async (e: React.FormEvent, noteId: number) => {
    e.preventDefault();
    if (!editContent.trim()) {
      setEditErrorMessage('Note content cannot be empty.');
      return;
    }
    if (editContent.trim().length > 1000) {
      setEditErrorMessage('Content cannot exceed 1000 characters.');
      return;
    }

    setIsUpdating(true);
    setEditErrorMessage(null);

    try {
      const updated = await updateNote(noteId, {
        noteDate: editNoteDate,
        content: editContent.trim(),
        habitId: editHabitId === '' ? null : Number(editHabitId),
      });

      if (onNoteUpdated) {
        onNoteUpdated(updated);
      }
      setEditingNoteId(null);
    } catch (err) {
      if (err instanceof HabitApiError) {
        setEditErrorMessage(err.message);
      } else {
        setEditErrorMessage('Could not update note. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const promptDelete = (note: DailyNote) => {
    setNoteToDelete(note);
    setDeleteError(null);
  };

  const cancelDelete = () => {
    setNoteToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteNote(noteToDelete.id);
      if (onNoteDeleted) {
        onNoteDeleted(noteToDelete.id);
      }
      setNoteToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not remove note. Please try again.');
    } finally {
      setIsDeleting(false);
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
          {notes.map((note) => {
            if (editingNoteId === note.id) {
              return (
                <article
                  key={note.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#fffdf9',
                    border: '2px solid #d88180',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <form onSubmit={(e) => handleUpdate(e, note.id)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#724319' }}>
                        Edit Note
                      </span>
                      <span style={{ fontSize: '12px', color: '#724319', opacity: 0.7 }}>
                        {editContent.length} / 1000
                      </span>
                    </div>

                    {editErrorMessage && (
                      <div role="alert" style={{ color: '#d88180', fontSize: '13px' }}>
                        {editErrorMessage}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label htmlFor={`edit-note-date-${note.id}`} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#724319', marginBottom: '4px' }}>
                          Date
                        </label>
                        <input
                          id={`edit-note-date-${note.id}`}
                          type="date"
                          value={editNoteDate}
                          onChange={(e) => setEditNoteDate(e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #feeac7',
                            backgroundColor: '#ffffff',
                            color: '#724319',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label htmlFor={`edit-note-habit-${note.id}`} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#724319', marginBottom: '4px' }}>
                          Linked Habit
                        </label>
                        <select
                          id={`edit-note-habit-${note.id}`}
                          value={editHabitId}
                          onChange={(e) => setEditHabitId(e.target.value === '' ? '' : Number(e.target.value))}
                          style={{
                            width: '100%',
                            height: '36px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #feeac7',
                            backgroundColor: '#ffffff',
                            color: '#724319',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="">General (No Habit Linked)</option>
                          {habits.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`edit-note-content-${note.id}`} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#724319', marginBottom: '4px' }}>
                        Reflection
                      </label>
                      <textarea
                        id={`edit-note-content-${note.id}`}
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #feeac7',
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
                        disabled={isUpdating || !editContent.trim()}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#d88180',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: isUpdating || !editContent.trim() ? 'not-allowed' : 'pointer',
                          opacity: isUpdating || !editContent.trim() ? 0.6 : 1,
                        }}
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </article>
              );
            }

            return (
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {note.timestamp && (
                      <time
                        dateTime={note.timestamp}
                        style={{ fontSize: '12px', color: '#724319', opacity: 0.6 }}
                      >
                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    )}

                    <button
                      type="button"
                      onClick={() => startEditing(note)}
                      aria-label={`Edit note from ${note.noteDate}`}
                      style={{
                        background: 'transparent',
                        border: '1px solid #feeac7',
                        color: '#724319',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => promptDelete(note)}
                      aria-label={`Remove note from ${note.noteDate}`}
                      title="Remove note"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b5e51',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease, background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#d88180';
                        e.currentTarget.style.backgroundColor = 'rgba(216, 129, 128, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6b5e51';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{ display: 'block' }}
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
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
            );
          })}
        </div>
      )}

      {/* Themed Confirmation Modal for Note Removal */}
      {noteToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          aria-describedby="confirm-delete-desc"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(45, 28, 11, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelDelete();
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 16px 36px rgba(114, 67, 25, 0.22)',
              border: '1px solid #feeac7',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(216, 129, 128, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d88180',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                🗑️
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  id="confirm-delete-title"
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#724319',
                  }}
                >
                  Remove Reflection Note
                </h3>
                <p
                  id="confirm-delete-desc"
                  style={{
                    margin: '6px 0 0',
                    fontSize: '14px',
                    color: '#6b5e51',
                    lineHeight: 1.4,
                  }}
                >
                  Are you sure you want to remove this reflection note?
                </p>
              </div>
            </div>

            {/* Note Snippet Preview */}
            <div
              style={{
                backgroundColor: '#fffdf9',
                border: '1px solid #feeac7',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#724319',
                lineHeight: 1.5,
                maxHeight: '90px',
                overflowY: 'auto',
                fontStyle: 'italic',
              }}
            >
              "{noteToDelete.content}"
            </div>

            {deleteError && (
              <div
                role="alert"
                style={{
                  backgroundColor: '#fdf2f2',
                  color: '#b3261e',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {deleteError}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '4px',
              }}
            >
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #feeac7',
                  backgroundColor: '#ffffff',
                  color: '#724319',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#d88180',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(216, 129, 128, 0.35)',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Removing...' : 'Remove Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
