import { Request, Response, NextFunction } from 'express';
import { FrequencyType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { isValidHabitColor, normalizeHabitColor } from '../utils/palette-validator.js';
import { isValidDateRange } from '../utils/schedule-validator.js';
import { isValidIsoDateString, toUtcMidnight } from '../utils/dashboard-calc.js';
import { computeHabitStats } from '../utils/habit-stats.js';

const VALID_FREQUENCIES: FrequencyType[] = [
  'DAILY',
  'WEEKDAYS',
  'THREE_TIMES_WEEKLY',
  'WEEKLY',
  'MONTHLY',
  'CUSTOM_DAYS',
];

function normalizeHabitCategory(category: unknown): string | null {
  if (category === undefined || category === null) {
    return null;
  }
  if (typeof category !== 'string') {
    throw new AppError(422, 'INVALID_HABIT_CATEGORY', 'Category must be a string.');
  }
  const trimmed = category.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > 50) {
    throw new AppError(422, 'INVALID_HABIT_CATEGORY', 'Category cannot exceed 50 characters.');
  }
  return trimmed;
}

export async function getHabits(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const statusParam = req.query.status as string;
    const isActive = statusParam === 'archived' ? false : true;

    const habits = await prisma.habit.findMany({
      where: {
        userId,
        isActive,
      },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            version: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json(habits);
  } catch (error) {
    next(error);
  }
}

export async function createHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      category,
      colorHex,
      frequency,
      daysOfWeek,
      startDate,
      endDate,
      targetCount,
    } = req.body;

    // 1. Title Validation
    if (!title || typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 80) {
      throw new AppError(422, 'INVALID_HABIT_TITLE', 'Habit title must be between 2 and 80 characters.');
    }

    // 2. Description Validation
    if (description !== undefined && description !== null && typeof description === 'string' && description.trim().length > 500) {
      throw new AppError(422, 'INVALID_HABIT_DESCRIPTION', 'Description cannot exceed 500 characters.');
    }

    // 2b. Category Validation & Normalization
    const normalizedCategory = normalizeHabitCategory(category);

    // 3. Color Validation (8 fixed habit colors)
    if (!colorHex || !isValidHabitColor(colorHex)) {
      throw new AppError(
        422,
        'INVALID_HABIT_COLOR',
        'Color must be one of the 8 fixed habit palette colors: #448aff (Blue Energy), #1565c0 (Ocean Deep), #009688 (Verdigris), #8bc34a (Yellow Green), #ffc107 (Amber Gold), #ff9800 (Amber Glow), #f44336 (Cinnabar), #ad1457 (Cherry Rose).'
      );
    }
    const normalizedColor = normalizeHabitColor(colorHex);

    // 4. Frequency Validation
    if (!frequency || !VALID_FREQUENCIES.includes(frequency as FrequencyType)) {
      throw new AppError(
        422,
        'INVALID_HABIT_FREQUENCY',
        'Frequency must be one of DAILY, WEEKDAYS, THREE_TIMES_WEEKLY, WEEKLY, MONTHLY, CUSTOM_DAYS.'
      );
    }

    // 5. Days of Week Validation & Defaults
    let finalDaysOfWeek: number[] = [];
    if (frequency === 'CUSTOM_DAYS') {
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0 || daysOfWeek.some((d) => typeof d !== 'number' || d < 1 || d > 7)) {
        throw new AppError(422, 'INVALID_DAYS_OF_WEEK', 'Custom days must be a non-empty array with values between 1 and 7.');
      }
      finalDaysOfWeek = daysOfWeek;
    } else if (frequency === 'DAILY') {
      finalDaysOfWeek = [1, 2, 3, 4, 5, 6, 7];
    } else if (frequency === 'WEEKDAYS') {
      finalDaysOfWeek = [1, 2, 3, 4, 5];
    } else if (frequency === 'THREE_TIMES_WEEKLY') {
      finalDaysOfWeek = Array.isArray(daysOfWeek) && daysOfWeek.length > 0 ? daysOfWeek : [1, 3, 5];
    } else if (frequency === 'WEEKLY') {
      finalDaysOfWeek = Array.isArray(daysOfWeek) && daysOfWeek.length > 0 ? daysOfWeek : [1];
    } else if (frequency === 'MONTHLY') {
      finalDaysOfWeek = [];
    }

    // 6. Start & End Date Validation
    let parsedStartDate = new Date();
    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        throw new AppError(422, 'INVALID_START_DATE', 'Invalid start date format.');
      }
    }

    let parsedEndDate: Date | null = null;
    if (endDate !== undefined && endDate !== null && endDate !== '') {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        throw new AppError(422, 'INVALID_END_DATE', 'Invalid end date format.');
      }
      if (!isValidDateRange(parsedStartDate, parsedEndDate)) {
        throw new AppError(422, 'INVALID_DATE_RANGE', 'End date must be greater than or equal to start date.');
      }
    }

    // 7. Target Count Validation
    let finalTargetCount = 20;
    if (targetCount !== undefined && targetCount !== null) {
      if (typeof targetCount !== 'number' || targetCount < 1 || targetCount > 31) {
        throw new AppError(422, 'INVALID_TARGET_COUNT', 'Target count must be an integer between 1 and 31.');
      }
      finalTargetCount = targetCount;
    }

    const created = await prisma.habit.create({
      data: {
        userId,
        title: title.trim(),
        description: description ? description.trim() : null,
        category: normalizedCategory,
        colorHex: normalizedColor,
        frequency: frequency as FrequencyType,
        daysOfWeek: finalDaysOfWeek,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        targetCount: finalTargetCount,
        isActive: true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function getHabitById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const habitId = parseInt(req.params.id, 10);

    if (isNaN(habitId)) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
      },
    });

    if (!habit || habit.userId !== userId) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    res.status(200).json(habit);
  } catch (error) {
    next(error);
  }
}

export async function updateHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const habitId = parseInt(req.params.id, 10);

    if (isNaN(habitId)) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    const existing = await prisma.habit.findFirst({
      where: {
        id: habitId,
      },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    const {
      title,
      description,
      category,
      colorHex,
      frequency,
      daysOfWeek,
      startDate,
      endDate,
      targetCount,
    } = req.body;

    const dataToUpdate: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 80) {
        throw new AppError(422, 'INVALID_HABIT_TITLE', 'Habit title must be between 2 and 80 characters.');
      }
      dataToUpdate.title = title.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description === 'string' && description.trim().length > 500) {
        throw new AppError(422, 'INVALID_HABIT_DESCRIPTION', 'Description cannot exceed 500 characters.');
      }
      dataToUpdate.description = description ? description.trim() : null;
    }

    if (category !== undefined) {
      dataToUpdate.category = normalizeHabitCategory(category);
    }

    if (colorHex !== undefined) {
      if (!isValidHabitColor(colorHex)) {
        throw new AppError(
          422,
          'INVALID_HABIT_COLOR',
          'Color must be one of the 8 fixed habit palette colors: #448aff (Blue Energy), #1565c0 (Ocean Deep), #009688 (Verdigris), #8bc34a (Yellow Green), #ffc107 (Amber Gold), #ff9800 (Amber Glow), #f44336 (Cinnabar), #ad1457 (Cherry Rose).'
        );
      }
      dataToUpdate.colorHex = normalizeHabitColor(colorHex);
    }

    if (frequency !== undefined) {
      if (!VALID_FREQUENCIES.includes(frequency as FrequencyType)) {
        throw new AppError(
          422,
          'INVALID_HABIT_FREQUENCY',
          'Frequency must be one of DAILY, WEEKDAYS, THREE_TIMES_WEEKLY, WEEKLY, MONTHLY, CUSTOM_DAYS.'
        );
      }
      dataToUpdate.frequency = frequency as FrequencyType;

      if (daysOfWeek === undefined) {
        if (frequency === 'DAILY') {
          dataToUpdate.daysOfWeek = [1, 2, 3, 4, 5, 6, 7];
        } else if (frequency === 'WEEKDAYS') {
          dataToUpdate.daysOfWeek = [1, 2, 3, 4, 5];
        } else if (frequency === 'THREE_TIMES_WEEKLY') {
          dataToUpdate.daysOfWeek = [1, 3, 5];
        } else if (frequency === 'WEEKLY') {
          dataToUpdate.daysOfWeek = [1];
        } else if (frequency === 'MONTHLY') {
          dataToUpdate.daysOfWeek = [];
        }
      }
    }

    if (daysOfWeek !== undefined) {
      if (Array.isArray(daysOfWeek)) {
        dataToUpdate.daysOfWeek = daysOfWeek;
      }
    }

    let effectiveStartDate = existing.startDate;
    if (startDate !== undefined) {
      const sDate = new Date(startDate);
      if (isNaN(sDate.getTime())) {
        throw new AppError(422, 'INVALID_START_DATE', 'Invalid start date.');
      }
      effectiveStartDate = sDate;
      dataToUpdate.startDate = sDate;
    }

    if (endDate !== undefined) {
      if (endDate === null || endDate === '') {
        dataToUpdate.endDate = null;
      } else {
        const eDate = new Date(endDate);
        if (isNaN(eDate.getTime())) {
          throw new AppError(422, 'INVALID_END_DATE', 'Invalid end date.');
        }
        if (!isValidDateRange(effectiveStartDate, eDate)) {
          throw new AppError(422, 'INVALID_DATE_RANGE', 'End date must be greater than or equal to start date.');
        }
        dataToUpdate.endDate = eDate;
      }
    }

    if (targetCount !== undefined && targetCount !== null) {
      if (typeof targetCount !== 'number' || targetCount < 1 || targetCount > 31) {
        throw new AppError(422, 'INVALID_TARGET_COUNT', 'Target count must be an integer between 1 and 31.');
      }
      dataToUpdate.targetCount = targetCount;
    }

    const updated = await prisma.habit.update({
      where: { id: habitId },
      data: dataToUpdate,
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function archiveHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const habitId = parseInt(req.params.id, 10);

    if (isNaN(habitId)) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
      },
    });

    if (!habit || habit.userId !== userId) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    await prisma.habit.update({
      where: { id: habitId },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getHabitStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const rawId = req.params.id;

    if (!/^\d+$/.test(rawId)) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }
    const habitId = parseInt(rawId, 10);

    const modeParam = req.query.mode;
    let mode: 'month' | 'year' = 'month';
    if (modeParam !== undefined) {
      if (modeParam !== 'month' && modeParam !== 'year') {
        throw new AppError(422, 'INVALID_STATS_MODE', "Mode must be either 'month' or 'year'.");
      }
      mode = modeParam;
    }

    const dateQuery = req.query.date;
    let anchorTodayStr: string;
    if (dateQuery !== undefined) {
      if (typeof dateQuery !== 'string' || !isValidIsoDateString(dateQuery)) {
        throw new AppError(422, 'INVALID_DATE_FORMAT', 'Date must be formatted as YYYY-MM-DD.');
      }
      anchorTodayStr = dateQuery;
    } else {
      anchorTodayStr = new Date().toISOString().split('T')[0];
    }

    const anchorToday = toUtcMidnight(anchorTodayStr);

    const yearParam = req.query.year;
    let year = anchorToday.getUTCFullYear();
    if (yearParam !== undefined) {
      if (typeof yearParam !== 'string' || !/^\d+$/.test(yearParam)) {
        throw new AppError(422, 'INVALID_YEAR', 'Year must be a valid 4-digit integer between 1900 and 2100.');
      }
      year = parseInt(yearParam, 10);
      if (year < 1900 || year > 2100) {
        throw new AppError(422, 'INVALID_YEAR', 'Year must be a valid 4-digit integer between 1900 and 2100.');
      }
    }

    const monthParam = req.query.month;
    let month = anchorToday.getUTCMonth() + 1;
    if (monthParam !== undefined) {
      if (typeof monthParam !== 'string' || !/^\d+$/.test(monthParam)) {
        throw new AppError(422, 'INVALID_MONTH', 'Month must be an integer between 1 and 12.');
      }
      month = parseInt(monthParam, 10);
      if (month < 1 || month > 12) {
        throw new AppError(422, 'INVALID_MONTH', 'Month must be an integer between 1 and 12.');
      }
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
      },
    });

    if (!habit || habit.userId !== userId || !habit.isActive) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: habit.id,
        completed: true,
      },
      select: {
        logDate: true,
        completed: true,
      },
    });

    res.status(200).json(computeHabitStats(habit, logs, { mode, month, year, anchorTodayStr }));
  } catch (error) {
    next(error);
  }
}

