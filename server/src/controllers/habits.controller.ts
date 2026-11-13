import { Request, Response, NextFunction } from 'express';
import { FrequencyType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { isValidHabitColor, normalizeHabitColor } from '../utils/palette-validator.js';
import { isValidDateRange } from '../utils/schedule-validator.js';

const VALID_FREQUENCIES: FrequencyType[] = [
  'DAILY',
  'WEEKDAYS',
  'THREE_TIMES_WEEKLY',
  'WEEKLY',
  'MONTHLY',
  'CUSTOM_DAYS',
];

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

