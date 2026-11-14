import React, { useState, useEffect, useRef } from 'react';
import { Habit } from '../types/habit.js';
import { createHabit, HabitApiError } from '../services/habits.service.js';
import { ColorPicker, HABIT_COLOR_PALETTE } from './ColorPicker.js';
import { DayOfWeekSelector, deriveFrequencyType } from './DayOfWeekSelector.js';

export interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitCreated: (newHabit: Habit) => void;
  triggerElement?: HTMLElement | null;
}

export const NewHabitModal: React.FC<NewHabitModalProps> = ({
  isOpen,
  onClose,
  onHabitCreated,
  triggerElement,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState(HABIT_COLOR_PALETTE[5].hex); // Amber Glow (#ff9800)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [startDate, setStartDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState('');
  const [targetCount, setTargetCount] = useState(20);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management & Escape key handling
  useEffect(() => {
    if (isOpen) {
      // Auto-focus title input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setColorHex(HABIT_COLOR_PALETTE[5].hex);
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
    setStartDate(new Date().toLocaleDateString('en-CA'));
    setEndDate('');
    setTargetCount(20);
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
    // Restore focus to trigger element per WCAG 2.4.3
    if (triggerElement) {
      setTimeout(() => {
        triggerElement.focus();
      }, 50);
    }
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Habit title is required.';
    } else if (title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters.';
    } else if (title.trim().length > 80) {
      errors.title = 'Title cannot exceed 80 characters.';
    }

    if (description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required.';
    }

    if (endDate && startDate) {
      if (new Date(endDate) < new Date(startDate)) {
        errors.endDate = 'End date must be greater than or equal to start date.';
      }
    }

    if (targetCount < 1 || targetCount > 31) {
      errors.targetCount = 'Target count must be between 1 and 31.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const derivedFrequency = deriveFrequencyType(selectedDays);
      const created = await createHabit({
        title: title.trim(),
        description: description.trim() || undefined,
        colorHex,
        frequency: derivedFrequency,
        daysOfWeek: selectedDays,
        startDate: startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : undefined,
        endDate: endDate ? new Date(`${endDate}T00:00:00.000Z`).toISOString() : null,
        targetCount,
      });

      onHabitCreated(created);
      handleClose();
    } catch (err) {
      if (err instanceof HabitApiError) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('An unexpected error occurred while saving habit.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
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
        padding: '1rem',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-habit-title"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--papaya-whip)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          padding: '2rem',
          boxShadow: '0 12px 32px rgba(114, 67, 25, 0.15)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 id="new-habit-title" style={{ color: 'var(--walnut)', fontSize: '1.375rem', fontWeight: 700 }}>
            + Create New Habit
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
            }}
          >
            ✕
          </button>
        </div>

        {generalError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title */}
          <div>
            <label htmlFor="habit-title" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: 'var(--color-text-main)' }}>
              Habit Name <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              ref={titleInputRef}
              id="habit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Run, Daily Journal"
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.title ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                padding: '0 0.75rem',
                backgroundColor: '#ffffff',
                color: 'var(--color-text-main)',
              }}
            />
            {fieldErrors.title && (
              <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {fieldErrors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <label htmlFor="habit-description" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                Description (Optional)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {description.length} / 500
              </span>
            </div>
            <textarea
              id="habit-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details or personal motivation..."
              style={{
                width: '100%',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.description ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                padding: '0.5rem 0.75rem',
                backgroundColor: '#ffffff',
                color: 'var(--color-text-main)',
                resize: 'vertical',
              }}
            />
            {fieldErrors.description && (
              <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: 'var(--color-text-main)' }}>
              Habit Color <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <ColorPicker value={colorHex} onChange={setColorHex} id="modal-habit-color" />
          </div>

          {/* Frequency: Alarm-style day-of-week selection */}
          <DayOfWeekSelector
            selectedDays={selectedDays}
            onChange={setSelectedDays}
            id="habit-frequency"
          />

          {/* Monthly Target Count */}
          <div>
            <label htmlFor="habit-target-count" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: 'var(--color-text-main)' }}>
              Monthly Target Count (1–31) <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              id="habit-target-count"
              type="number"
              min={1}
              max={31}
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 1)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.targetCount ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                padding: '0 0.75rem',
                backgroundColor: '#ffffff',
                color: 'var(--color-text-main)',
              }}
            />
            {fieldErrors.targetCount && (
              <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {fieldErrors.targetCount}
              </p>
            )}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="habit-start-date" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: 'var(--color-text-main)' }}>
                Start Date <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="habit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '6px',
                  border: `1px solid ${fieldErrors.startDate ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                  padding: '0 0.5rem',
                  backgroundColor: '#ffffff',
                  color: 'var(--color-text-main)',
                }}
              />
              {fieldErrors.startDate && (
                <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  {fieldErrors.startDate}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="habit-end-date" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: 'var(--color-text-main)' }}>
                End Date (Optional)
              </label>
              <input
                id="habit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '6px',
                  border: `1px solid ${fieldErrors.endDate ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                  padding: '0 0.5rem',
                  backgroundColor: '#ffffff',
                  color: 'var(--color-text-main)',
                }}
              />
              {fieldErrors.endDate && (
                <p aria-live="polite" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  {fieldErrors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                height: '42px',
                padding: '0 1.25rem',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: '1px solid var(--walnut)',
                color: 'var(--walnut)',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: '42px',
                padding: '0 1.5rem',
                borderRadius: '6px',
                backgroundColor: 'var(--walnut)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

