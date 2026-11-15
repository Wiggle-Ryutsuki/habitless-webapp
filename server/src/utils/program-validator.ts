import { FrequencyType } from '@prisma/client';
import { isValidDateRange } from './schedule-validator.js';

export interface ActivityInput {
  title: string;
  description?: string | null;
  frequency?: FrequencyType;
  daysOfWeek?: number[];
  targetCount?: number;
}

export interface ProgramInput {
  title: string;
  category: string;
  description?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  activities: ActivityInput[];
}

export interface ValidationError {
  field: string;
  message: string;
}

const VALID_FREQUENCIES: FrequencyType[] = [
  'DAILY',
  'WEEKDAYS',
  'THREE_TIMES_WEEKLY',
  'WEEKLY',
  'MONTHLY',
  'CUSTOM_DAYS',
];

export function validateProgramInput(input: any): { isValid: boolean; fieldErrors: ValidationError[] } {
  const fieldErrors: ValidationError[] = [];

  // Title: required, trimmed, 3–100 chars
  if (!input || typeof input.title !== 'string' || input.title.trim().length === 0) {
    fieldErrors.push({
      field: 'title',
      message: 'Title is required.',
    });
  } else {
    const trimmedTitle = input.title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
      fieldErrors.push({
        field: 'title',
        message: 'Title must be between 3 and 100 characters.',
      });
    }
  }

  // Category: required string, trimmed, 1–50 chars
  if (!input || typeof input.category !== 'string' || input.category.trim().length === 0) {
    fieldErrors.push({
      field: 'category',
      message: 'Category is required.',
    });
  } else if (input.category.trim().length > 50) {
    fieldErrors.push({
      field: 'category',
      message: 'Category cannot exceed 50 characters.',
    });
  }

  // Description: optional, max 500 chars (BR-04)
  if (input?.description !== undefined && input?.description !== null) {
    if (typeof input.description !== 'string') {
      fieldErrors.push({
        field: 'description',
        message: 'Description must be a string.',
      });
    } else if (input.description.trim().length > 500) {
      fieldErrors.push({
        field: 'description',
        message: 'Description cannot exceed 500 characters.',
      });
    }
  }

  // Dates: startDate and endDate required and valid
  if (!input?.startDate) {
    fieldErrors.push({
      field: 'startDate',
      message: 'Start date is required.',
    });
  }

  if (!input?.endDate) {
    fieldErrors.push({
      field: 'endDate',
      message: 'End date is required.',
    });
  }

  if (input?.startDate && input?.endDate) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (isNaN(startDate.getTime())) {
      fieldErrors.push({
        field: 'startDate',
        message: 'Start date must be a valid date.',
      });
    }

    if (isNaN(endDate.getTime())) {
      fieldErrors.push({
        field: 'endDate',
        message: 'End date must be a valid date.',
      });
    }

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (!isValidDateRange(input.startDate, input.endDate)) {
        fieldErrors.push({
          field: 'endDate',
          message: 'End date must be on or after start date.',
        });
      }
    }
  }

  // Activities: required non-empty array with minimum 1 activity
  if (!input || !Array.isArray(input.activities) || input.activities.length === 0) {
    fieldErrors.push({
      field: 'activities',
      message: 'Program must contain at least 1 activity.',
    });
  } else {
    input.activities.forEach((activity: any, index: number) => {
      // Activity title: required, 2–80 chars (BR-03)
      if (!activity || typeof activity.title !== 'string' || activity.title.trim().length === 0) {
        fieldErrors.push({
          field: `activities[${index}].title`,
          message: `Activity ${index + 1} title is required.`,
        });
      } else {
        const trimmed = activity.title.trim();
        if (trimmed.length < 2 || trimmed.length > 80) {
          fieldErrors.push({
            field: `activities[${index}].title`,
            message: `Activity ${index + 1} title must be between 2 and 80 characters.`,
          });
        }
      }

      // Activity description: optional, max 500 chars (BR-04)
      if (activity?.description !== undefined && activity?.description !== null) {
        if (typeof activity.description !== 'string') {
          fieldErrors.push({
            field: `activities[${index}].description`,
            message: `Activity ${index + 1} description must be a string.`,
          });
        } else if (activity.description.trim().length > 500) {
          fieldErrors.push({
            field: `activities[${index}].description`,
            message: `Activity ${index + 1} description cannot exceed 500 characters.`,
          });
        }
      }

      // Activity frequency: optional, must be valid FrequencyType
      if (activity?.frequency && !VALID_FREQUENCIES.includes(activity.frequency)) {
        fieldErrors.push({
          field: `activities[${index}].frequency`,
          message: `Activity ${index + 1} frequency must be one of: ${VALID_FREQUENCIES.join(', ')}.`,
        });
      }

      // Activity daysOfWeek: optional array of ISO days 1–7 (Mon–Sun)
      if (activity?.daysOfWeek !== undefined && activity?.daysOfWeek !== null) {
        if (!Array.isArray(activity.daysOfWeek)) {
          fieldErrors.push({
            field: `activities[${index}].daysOfWeek`,
            message: `Activity ${index + 1} daysOfWeek must be an array of days (1-7).`,
          });
        } else if (activity.daysOfWeek.length === 0 || activity.daysOfWeek.length > 7) {
          fieldErrors.push({
            field: `activities[${index}].daysOfWeek`,
            message: `Activity ${index + 1} must have between 1 and 7 days selected.`,
          });
        } else if (!activity.daysOfWeek.every((d: any) => Number.isInteger(d) && d >= 1 && d <= 7)) {
          fieldErrors.push({
            field: `activities[${index}].daysOfWeek`,
            message: `Activity ${index + 1} daysOfWeek must contain integer days from 1 (Monday) to 7 (Sunday).`,
          });
        }
      }

      // Activity targetCount: optional, integer >= 1
      if (activity?.targetCount !== undefined && activity?.targetCount !== null) {
        if (typeof activity.targetCount !== 'number' || activity.targetCount < 1 || !Number.isInteger(activity.targetCount)) {
          fieldErrors.push({
            field: `activities[${index}].targetCount`,
            message: `Activity ${index + 1} target count must be an integer greater than or equal to 1.`,
          });
        }
      }
    });
  }

  return {
    isValid: fieldErrors.length === 0,
    fieldErrors,
  };
}
