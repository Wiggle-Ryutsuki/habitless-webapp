import React, { useState, useEffect, useRef } from 'react';
import { FrequencyType, Habit } from '../types/habit.js';
import { updateHabit, archiveHabit, HabitApiError } from '../services/habits.service.js';
import { ColorPicker, HABIT_COLOR_PALETTE } from './ColorPicker.js';

export interface HabitToEdit {
  id: number;
  title: string;
  description?: string | null;
  colorHex: string;
  frequency?: FrequencyType;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string | null;
  targetCount: number;
}

export interface EditHabitModalProps {
  isOpen: boolean;
  habit: HabitToEdit | null;
  onClose: () => void;
  onHabitUpdated: (updated: Habit) => void;
  onHabitArchived?: (habitId: number) => void;
  triggerElement?: HTMLElement | null;
}

const formatDateForInput = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      return dateVal.substring(0, 10);
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return '';
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString().split('T')[0];
  }
  return '';
};

export const EditHabitModal: React.FC<EditHabitModalProps> = ({
  isOpen,
  habit,
  onClose,
  onHabitUpdated,
  onHabitArchived,
  triggerElement,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState(HABIT_COLOR_PALETTE[0].hex);
  const [frequency, setFrequency] = useState<FrequencyType>('DAILY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetCount, setTargetCount] = useState(20);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title || '');
      setDescription(habit.description || '');
      setColorHex(habit.colorHex || HABIT_COLOR_PALETTE[0].hex);
      setFrequency(habit.frequency || 'DAILY');
      setStartDate(formatDateForInput(habit.startDate) || new Date().toISOString().split('T')[0]);
      setEndDate(formatDateForInput(habit.endDate));
      setTargetCount(habit.targetCount || 20);
      setFieldErrors({});
      setGeneralError(null);
    }
  }, [habit]);

  useEffect(() => {
    if (isOpen) {
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

  const handleClose = () => {
    onClose();
    if (triggerElement) {
      setTimeout(() => {
        triggerElement.focus();
      }, 50);
    }
  };

  if (!isOpen || !habit) return null;

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
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const updated = await updateHabit(habit.id, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        colorHex,
        frequency,
        startDate: startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : undefined,
        endDate: endDate ? new Date(`${endDate}T00:00:00.000Z`).toISOString() : null,
        targetCount,
      });

      onHabitUpdated(updated);
      handleClose();
    } catch (err) {
      if (err instanceof HabitApiError) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('An unexpected error occurred while updating the habit.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm(`Are you sure you want to archive "${habit.title}"?`)) {
      return;
    }

    setIsArchiving(true);
    setGeneralError(null);

    try {
      await archiveHabit(habit.id);
      if (onHabitArchived) {
        onHabitArchived(habit.id);
      }
      handleClose();
    } catch (err) {
      if (err instanceof HabitApiError) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Could not archive habit. Please try again.');
      }
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-habit-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(114, 67, 25, 0.2)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="edit-habit-title" style={{ margin: 0, fontSize: '20px', color: '#724319', fontWeight: 700 }}>
            Edit Habit
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#724319',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {generalError && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              backgroundColor: '#feeac7',
              border: '1px solid #d88180',
              color: '#724319',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title Input */}
          <div>
            <label
              htmlFor="edit-habit-name"
              style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#724319', marginBottom: '6px' }}
            >
              Habit Name <span style={{ color: '#d88180' }}>*</span>
            </label>
            <input
              id="edit-habit-name"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exercise or Journal"
              maxLength={80}
              style={{
                width: '100%',
                height: '42px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.title ? '#d88180' : '#feeac7'}`,
                backgroundColor: '#ffffff',
                color: '#724319',
                fontSize: '15px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            {fieldErrors.title && (
              <div role="alert" aria-live="polite" style={{ color: '#d88180', fontSize: '13px', marginTop: '4px' }}>
                {fieldErrors.title}
              </div>
            )}
          </div>

          {/* Description Textarea */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label htmlFor="edit-habit-description" style={{ fontSize: '14px', fontWeight: 600, color: '#724319' }}>
                Description
              </label>
              <span style={{ fontSize: '12px', color: '#724319', opacity: 0.7 }}>
                {description.length} / 500
              </span>
            </div>
            <textarea
              id="edit-habit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this habit matters, rules, or routines..."
              maxLength={500}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.description ? '#d88180' : '#feeac7'}`,
                backgroundColor: '#ffffff',
                color: '#724319',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            {fieldErrors.description && (
              <div role="alert" aria-live="polite" style={{ color: '#d88180', fontSize: '13px', marginTop: '4px' }}>
                {fieldErrors.description}
              </div>
            )}
          </div>

          {/* Color Picker Swatches */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#724319', marginBottom: '8px' }}>
              Habit Color <span style={{ color: '#d88180' }}>*</span>
            </label>
            <ColorPicker value={colorHex} onChange={setColorHex} id="edit-habit-color" />
          </div>

          {/* Frequency & Target Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                htmlFor="edit-habit-frequency"
                style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#724319', marginBottom: '6px' }}
              >
                Frequency <span style={{ color: '#d88180' }}>*</span>
              </label>
              <select
                id="edit-habit-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #feeac7',
                  backgroundColor: '#ffffff',
                  color: '#724319',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKDAYS">Weekdays (Mon–Fri)</option>
                <option value="THREE_TIMES_WEEKLY">3x per Week</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-habit-target"
                style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#724319', marginBottom: '6px' }}
              >
                Target Count (1–31) <span style={{ color: '#d88180' }}>*</span>
              </label>
              <input
                id="edit-habit-target"
                type="number"
                min={1}
                max={31}
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${fieldErrors.targetCount ? '#d88180' : '#feeac7'}`,
                  backgroundColor: '#ffffff',
                  color: '#724319',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              {fieldErrors.targetCount && (
                <div role="alert" aria-live="polite" style={{ color: '#d88180', fontSize: '13px', marginTop: '4px' }}>
                  {fieldErrors.targetCount}
                </div>
              )}
            </div>
          </div>

          {/* Dates Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                htmlFor="edit-habit-start"
                style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#724319', marginBottom: '6px' }}
              >
                Start Date
              </label>
              <input
                id="edit-habit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '8px 12px',
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
                htmlFor="edit-habit-end"
                style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#724319', marginBottom: '6px' }}
              >
                End Date (Optional)
              </label>
              <input
                id="edit-habit-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${fieldErrors.endDate ? '#d88180' : '#feeac7'}`,
                  backgroundColor: '#ffffff',
                  color: '#724319',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              {fieldErrors.endDate && (
                <div role="alert" aria-live="polite" style={{ color: '#d88180', fontSize: '13px', marginTop: '4px' }}>
                  {fieldErrors.endDate}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #feeac7',
            }}
          >
            <button
              type="button"
              onClick={handleArchive}
              disabled={isArchiving || isSubmitting}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#d88180',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 12px',
              }}
            >
              {isArchiving ? 'Archiving...' : 'Archive Habit'}
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || isArchiving}
                style={{
                  height: '42px',
                  padding: '0 18px',
                  borderRadius: '6px',
                  border: '1px solid #d88180',
                  backgroundColor: 'transparent',
                  color: '#724319',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isArchiving}
                style={{
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#724319',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
