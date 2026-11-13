import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { isHabitScheduledForDate } from '../utils/frequency.js';

export async function getTodayChecklist(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const dateQuery = req.query.date as string | undefined;

    let dateStr = dateQuery;
    if (dateStr) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(Date.parse(`${dateStr}T00:00:00.000Z`))) {
        throw new AppError(422, 'INVALID_DATE_FORMAT', 'Date must be formatted as YYYY-MM-DD.');
      }
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }

    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    const activeHabits = await prisma.habit.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (activeHabits.length === 0) {
      return res.status(200).json({
        date: dateStr,
        totalScheduled: 0,
        completedCount: 0,
        items: [],
      });
    }

    const scheduledHabits = activeHabits.filter((h) =>
      isHabitScheduledForDate(h, targetDate)
    );

    if (scheduledHabits.length === 0) {
      return res.status(200).json({
        date: dateStr,
        totalScheduled: 0,
        completedCount: 0,
        items: [],
      });
    }

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: { in: scheduledHabits.map((h) => h.id) },
        logDate: targetDate,
      },
    });

    const logMap = new Map(logs.map((l) => [l.habitId, l]));

    let completedCount = 0;
    const items = scheduledHabits.map((h) => {
      const log = logMap.get(h.id);
      const isCompleted = log ? log.completed : false;
      if (isCompleted) {
        completedCount++;
      }
      return {
        habitId: h.id,
        title: h.title,
        description: h.description,
        colorHex: h.colorHex,
        frequency: h.frequency,
        isCompleted,
        logId: log ? log.id : null,
      };
    });

    res.status(200).json({
      date: dateStr,
      totalScheduled: scheduledHabits.length,
      completedCount,
      items,
    });
  } catch (error) {
    next(error);
  }
}

export async function logHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { habitId, date, completed, notes } = req.body;

    if (!habitId || typeof habitId !== 'number') {
      throw new AppError(422, 'INVALID_HABIT_ID', 'Habit ID is required and must be an integer.');
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
      },
    });

    if (!habit || habit.userId !== userId) {
      throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
    }

    if (!habit.isActive) {
      throw new AppError(422, 'HABIT_ARCHIVED', 'Cannot log completions for an archived habit.');
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(`${date}T00:00:00.000Z`))) {
      throw new AppError(422, 'INVALID_DATE_FORMAT', 'Date must be formatted as YYYY-MM-DD.');
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);

    // Guard: cannot log dates beyond tomorrow (UTC)
    const now = new Date();
    const maxAllowedUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    if (targetDate.getTime() > maxAllowedUtc.getTime()) {
      throw new AppError(422, 'INVALID_LOG_DATE', 'Cannot log habit completion for dates beyond tomorrow.');
    }

    if (typeof completed !== 'boolean') {
      throw new AppError(422, 'INVALID_COMPLETED_STATUS', 'Completed status must be a boolean.');
    }

    if (completed) {
      await prisma.habitLog.upsert({
        where: {
          habitId_logDate: {
            habitId,
            logDate: targetDate,
          },
        },
        update: {
          completed: true,
          notes: typeof notes === 'string' ? notes.trim() : null,
        },
        create: {
          habitId,
          logDate: targetDate,
          completed: true,
          notes: typeof notes === 'string' ? notes.trim() : null,
        },
      });
    } else {
      await prisma.habitLog.deleteMany({
        where: {
          habitId,
          logDate: targetDate,
        },
      });
    }

    res.status(200).json({
      habitId,
      date,
      completed,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

