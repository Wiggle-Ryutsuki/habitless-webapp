import React from 'react';
import { FrequencyType } from '../types/habit.js';

export interface DayOfWeekItem {
  day: number; // 1 = Mon .. 7 = Sun (ISO-8601)
  label: string;
  initial: string;
  fullName: string;
}

export const DAYS_OF_WEEK: DayOfWeekItem[] = [
  { day: 1, label: 'Mon', initial: 'M', fullName: 'Monday' },
  { day: 2, label: 'Tue', initial: 'T', fullName: 'Tuesday' },
  { day: 3, label: 'Wed', initial: 'W', fullName: 'Wednesday' },
  { day: 4, label: 'Thu', initial: 'T', fullName: 'Thursday' },
  { day: 5, label: 'Fri', initial: 'F', fullName: 'Friday' },
  { day: 6, label: 'Sat', initial: 'S', fullName: 'Saturday' },
  { day: 7, label: 'Sun', initial: 'S', fullName: 'Sunday' },
];

/**
 * Returns user-facing frequency text:
 * 7 days -> "Daily" (Max frequency)
 * 6 days -> "6x per week"
 * 5 days -> "5x per week"
 * 4 days -> "4x per week"
 * 3 days -> "3x per week"
 * 2 days -> "2x per week"
 * 1 day  -> "Weekly" (Min frequency)
 */
export function getFrequencyLabel(selectedDays: number[]): string {
  const count = selectedDays.length;
  if (count >= 7) return 'Daily';
  if (count <= 1) return 'Weekly';
  return `${count}x per week`;
}

/**
 * Derives the database FrequencyType enum from the selected days of the week.
 */
export function deriveFrequencyType(selectedDays: number[]): FrequencyType {
  const count = selectedDays.length;
  if (count >= 7) return 'DAILY';
  if (count === 5 && [1, 2, 3, 4, 5].every((d) => selectedDays.includes(d))) {
    return 'WEEKDAYS';
  }
  if (count === 3 && [1, 3, 5].every((d) => selectedDays.includes(d))) {
    return 'THREE_TIMES_WEEKLY';
  }
  if (count === 1) return 'WEEKLY';
  return 'CUSTOM_DAYS';
}

/**
 * Derives initial days array from habit properties.
 */
export function getInitialDaysOfWeek(
  frequency?: FrequencyType,
  daysOfWeek?: number[] | null
): number[] {
  if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
    return [...daysOfWeek].sort((a, b) => a - b);
  }
  if (frequency === 'WEEKDAYS') return [1, 2, 3, 4, 5];
  if (frequency === 'THREE_TIMES_WEEKLY') return [1, 3, 5];
  if (frequency === 'WEEKLY') return [1];
  return [1, 2, 3, 4, 5, 6, 7]; // Default Daily
}

/**
 * Determines whether a habit is scheduled / due on a specific calendar day.
 */
export function isHabitDueOnDay(
  habit: {
    frequency?: FrequencyType | string;
    daysOfWeek?: number[];
    startDate?: string | Date;
    endDate?: string | Date | null;
  },
  year: number,
  month: number,
  day: number
): boolean {
  // Construct date for (year, month, day)
  const targetDate = new Date(year, month - 1, day);

  // 1. Check startDate boundary
  if (habit.startDate) {
    const sDate = new Date(habit.startDate);
    const startMidnight = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
    const currentMidnight = new Date(year, month - 1, day);
    if (currentMidnight < startMidnight) {
      return false;
    }
  }

  // 2. Check endDate boundary
  if (habit.endDate) {
    const eDate = new Date(habit.endDate);
    const endMidnight = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate());
    const currentMidnight = new Date(year, month - 1, day);
    if (currentMidnight > endMidnight) {
      return false;
    }
  }

  // 3. Check ISO day of week (1 = Mon .. 7 = Sun)
  const jsDay = targetDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const isoDay = jsDay === 0 ? 7 : jsDay;

  if (Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.length > 0) {
    return habit.daysOfWeek.includes(isoDay);
  }

  switch (habit.frequency) {
    case 'WEEKDAYS':
      return isoDay >= 1 && isoDay <= 5;
    case 'THREE_TIMES_WEEKLY':
      return [1, 3, 5].includes(isoDay);
    case 'WEEKLY':
      return isoDay === 1;
    case 'DAILY':
    default:
      return true;
  }
}

export interface DayOfWeekSelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  id?: string;
  label?: string;
  compact?: boolean;
}

export const DayOfWeekSelector: React.FC<DayOfWeekSelectorProps> = ({
  selectedDays,
  onChange,
  id = 'habit-frequency-selector',
  label = 'Frequency',
  compact = false,
}) => {
  const handleToggleDay = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      // Enforce min frequency: weekly (must have at least 1 day selected)
      if (selectedDays.length <= 1) {
        return;
      }
      const nextDays = selectedDays.filter((d) => d !== dayNum);
      onChange(nextDays.sort((a, b) => a - b));
    } else {
      const nextDays = [...selectedDays, dayNum];
      onChange(nextDays.sort((a, b) => a - b));
    }
  };

  const frequencyLabel = getFrequencyLabel(selectedDays);

  return (
    <div>
      {/* Header: Title on top-left, dynamic changing text on top-right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: compact ? '4px' : '8px',
        }}
      >
        <label
          id={`${id}-label`}
          style={{
            fontSize: compact ? '13px' : '14px',
            fontWeight: 600,
            color: '#724319',
          }}
        >
          {label} <span style={{ color: '#d88180' }}>*</span>
        </label>
        <span
          data-testid="frequency-summary"
          aria-live="polite"
          style={{
            fontSize: compact ? '12px' : '13px',
            fontWeight: 700,
            color: '#724319',
            backgroundColor: '#feeac7',
            padding: compact ? '1px 8px' : '2px 10px',
            borderRadius: '12px',
            border: '1px solid #ead3ab',
          }}
        >
          {frequencyLabel}
        </span>
      </div>

      {/* Days of week segmented bar (single-row table with 7 cells) */}
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          width: '100%',
          border: '1px solid #d5c3aa',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(114, 67, 25, 0.08)',
        }}
      >
        {DAYS_OF_WEEK.map((item, index) => {
          const isSelected = selectedDays.includes(item.day);
          const nextIsSelected =
            index < DAYS_OF_WEEK.length - 1 && selectedDays.includes(DAYS_OF_WEEK[index + 1].day);

          return (
            <button
              key={item.day}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={item.fullName}
              title={item.fullName}
              onClick={() => handleToggleDay(item.day)}
              style={{
                border: 'none',
                borderRight:
                  index < DAYS_OF_WEEK.length - 1
                    ? isSelected && nextIsSelected
                      ? '1px solid rgba(255, 255, 255, 0.25)'
                      : '1px solid #d5c3aa'
                    : 'none',
                height: compact ? '34px' : '40px',
                backgroundColor: isSelected ? '#724319' : '#ffffff',
                color: isSelected ? '#ffffff' : '#724319',
                fontWeight: 700,
                fontSize: compact ? '12px' : '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                outline: 'none',
                padding: 0,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
