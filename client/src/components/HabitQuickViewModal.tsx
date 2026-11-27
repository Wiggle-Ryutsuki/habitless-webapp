import React, { useState, useEffect, useRef } from 'react';
import { CalendarHabit } from '../types/habit.js';
import { archiveHabit, HabitApiError } from '../services/habits.service.js';
import {
  DAYS_OF_WEEK,
  getFrequencyLabel,
  getInitialDaysOfWeek,
} from './DayOfWeekSelector.js';

export interface HabitQuickViewModalProps {
  isOpen: boolean;
  habit: CalendarHabit | null;
  onClose: () => void;
  onEdit: () => void;
  onHabitDeleted: (habitId: number) => void;
  triggerElement?: HTMLElement | null;
}

function formatDateDisplay(value?: string | null, fallback = '-'): string {
  if (!value) return fallback;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.substring(0, 10);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString().split('T')[0];
}

/**
 * Strictly read-only Quick-View modal for inspecting a habit and choosing Back, Edit, or Delete.
 */
export const HabitQuickViewModal: React.FC<HabitQuickViewModalProps> = ({
  isOpen,
  habit,
  onClose,
  onEdit,
  onHabitDeleted,
  triggerElement,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const backBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
    setIsDeleting(false);
  }, [habit, isOpen]);

  const handleClose = () => {
    if (isDeleting) return;
    onClose();
    if (triggerElement) {
      setTimeout(() => {
        triggerElement.focus();
      }, 50);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => {
      backBtnRef.current?.focus();
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
  }, [isOpen, isDeleting]);

  if (!isOpen || !habit) return null;

  const isMonthly = habit.frequency === 'MONTHLY';
  const activeDays = isMonthly
    ? []
    : getInitialDaysOfWeek(habit.frequency, habit.daysOfWeek);
  const frequencySummary = isMonthly ? 'Monthly' : getFrequencyLabel(activeDays);
  const categoryLabel = habit.category?.trim() ? habit.category : 'Uncategorized';
  const descriptionText = habit.description?.trim()
    ? habit.description
    : 'No description provided';
  const startDateDisplay = formatDateDisplay(habit.startDate, 'Today');
  const endDateDisplay = formatDateDisplay(habit.endDate, 'Ongoing');

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await archiveHabit(habit.habitId);
      onHabitDeleted(habit.habitId);
      onClose();
    } catch (err) {
      if (err instanceof HabitApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete habit. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-habit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
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
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--papaya-whip)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 12px 32px rgba(114, 67, 25, 0.18)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.125rem',
        }}
      >
        {/* Header: Color swatch + Title + Category Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <span
              data-testid="quick-view-color-swatch"
              aria-label={`Habit color ${habit.colorHex}`}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: habit.colorHex,
                flexShrink: 0,
                border: '2px solid #ffffff',
                boxShadow: '0 0 0 1px rgba(114, 67, 25, 0.25)',
              }}
            />
            <div style={{ minWidth: 0 }}>
              <h2
                id="quick-view-habit-title"
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--walnut)',
                  wordBreak: 'break-word',
                }}
              >
                {habit.title}
              </h2>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.375rem',
                  backgroundColor: 'var(--papaya-whip)',
                  color: 'var(--walnut)',
                  borderRadius: '999px',
                  padding: '2px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {categoryLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            borderTop: '1px solid var(--papaya-whip)',
            paddingTop: '0.875rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Description
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              color: habit.description?.trim() ? 'var(--color-text-main)' : 'var(--color-text-muted)',
              fontStyle: habit.description?.trim() ? 'normal' : 'italic',
              lineHeight: 1.5,
            }}
          >
            {descriptionText}
          </p>
        </div>

        {/* Frequency & Active Day Chips */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Frequency
            </span>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--walnut)',
                backgroundColor: 'var(--papaya-whip)',
                padding: '2px 10px',
                borderRadius: '12px',
              }}
            >
              {frequencySummary}
            </span>
          </div>

          {!isMonthly && (
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map((d) => {
                const isScheduled = activeDays.includes(d.day);
                return (
                  <span
                    key={d.day}
                    aria-label={`${d.fullName}: ${isScheduled ? 'Scheduled' : 'Off'}`}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: isScheduled ? 'var(--walnut)' : '#fffaf0',
                      color: isScheduled ? '#ffffff' : 'var(--color-text-muted)',
                      border: `1px solid ${isScheduled ? 'var(--walnut)' : 'var(--papaya-whip)'}`,
                    }}
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Dates & Target Count */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '0.75rem',
            backgroundColor: '#fffaf0',
            border: '1px solid var(--papaya-whip)',
            borderRadius: '8px',
            padding: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Start Date
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {startDateDisplay}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              End Date
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {endDateDisplay}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Target
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--walnut)' }}>
              {habit.targetCount} days
            </div>
          </div>
        </div>

        {deleteError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            {deleteError}
          </div>
        )}

        {/* Delete Confirmation Prompt OR Standard Actions */}
        {showDeleteConfirm ? (
          <div
            style={{
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--light-coral)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
              Are you sure you want to remove &ldquo;{habit.title}&rdquo; from your active habits? Your historical completion logs will be preserved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                style={{
                  minHeight: '44px',
                  padding: '0 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--walnut)',
                  backgroundColor: '#ffffff',
                  color: 'var(--walnut)',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  minHeight: '44px',
                  padding: '0 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--color-error)',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--papaya-whip)',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                minHeight: '44px',
                padding: '0 1rem',
                borderRadius: '6px',
                border: '1px solid var(--light-coral)',
                backgroundColor: 'transparent',
                color: 'var(--color-error)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>

            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button
                ref={backBtnRef}
                type="button"
                onClick={handleClose}
                style={{
                  minHeight: '44px',
                  padding: '0 1.125rem',
                  borderRadius: '6px',
                  border: '1px solid var(--light-coral)',
                  backgroundColor: 'transparent',
                  color: 'var(--walnut)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={onEdit}
                style={{
                  minHeight: '44px',
                  padding: '0 1.25rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--walnut)',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
