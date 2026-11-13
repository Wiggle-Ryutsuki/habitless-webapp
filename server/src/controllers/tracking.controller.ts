import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { isHabitScheduledForDate } from '../utils/frequency.js';
import { calculateMonthlyGoals } from '../utils/goals.js';

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

export async function getCalendarMatrix(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const monthQuery = req.query.month as string;
    const yearQuery = req.query.year as string;

    if (!monthQuery || !yearQuery) {
      throw new AppError(400, 'MISSING_DATE_PARAMS', 'Both month and year query parameters are required.');
    }

    const month = parseInt(monthQuery, 10);
    const year = parseInt(yearQuery, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      throw new AppError(400, 'INVALID_MONTH', 'Month must be an integer between 1 and 12.');
    }

    if (isNaN(year) || year < 1900 || year > 2100) {
      throw new AppError(400, 'INVALID_YEAR', 'Year must be a valid 4-digit integer.');
    }

    // Number of days in the specified month
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // Generate day initials (e.g. M, T, W, T, F, S, S) for each day 1..daysInMonth
    const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dayInitials: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
      dayInitials.push(DAY_INITIALS[dayOfWeek]);
    }

    // Fetch user's active habits
    const habits = await prisma.habit.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

    // Fetch all logs for user's habits in this month
    const habitIds = habits.map((h) => h.id);
    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        logDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Group logs by habitId -> dayNumber -> log
    const habitLogsMap = new Map<number, Map<number, boolean>>();
    for (const log of logs) {
      if (!habitLogsMap.has(log.habitId)) {
        habitLogsMap.set(log.habitId, new Map());
      }
      const dayNum = new Date(log.logDate).getUTCDate();
      habitLogsMap.get(log.habitId)!.set(dayNum, log.completed);
    }

    const habitsMatrix = habits.map((h) => {
      const days: Record<string, boolean> = {};
      const thisHabitLogs = habitLogsMap.get(h.id) || new Map<number, boolean>();

      for (let d = 1; d <= daysInMonth; d++) {
        days[String(d)] = thisHabitLogs.get(d) ?? false;
      }

      // Calculate goal achieved count for this month
      const logRecords = Array.from(thisHabitLogs.entries()).map(([day, completed]) => ({
        logDate: new Date(Date.UTC(year, month - 1, day)),
        completed,
      }));
      const { achieved } = calculateMonthlyGoals(logRecords, h.targetCount, month, year);

      return {
        habitId: h.id,
        title: h.title,
        description: h.description,
        colorHex: h.colorHex,
        frequency: h.frequency,
        daysOfWeek: h.daysOfWeek,
        startDate: h.startDate.toISOString(),
        endDate: h.endDate ? h.endDate.toISOString() : null,
        targetCount: h.targetCount,
        goalAchievedCount: achieved,
        days,
      };
    });

    res.status(200).json({
      month,
      year,
      daysInMonth,
      dayInitials,
      habits: habitsMatrix,
    });
  } catch (error) {
    next(error);
  }
}

export async function getGoalsSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const monthQuery = req.query.month as string;
    const yearQuery = req.query.year as string;

    const month = monthQuery ? parseInt(monthQuery, 10) : now.getUTCMonth() + 1;
    const year = yearQuery ? parseInt(yearQuery, 10) : now.getUTCFullYear();

    if (isNaN(month) || month < 1 || month > 12) {
      throw new AppError(400, 'INVALID_MONTH', 'Month must be an integer between 1 and 12.');
    }

    if (isNaN(year) || year < 1900 || year > 2100) {
      throw new AppError(400, 'INVALID_YEAR', 'Year must be a valid 4-digit integer.');
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

    const habitIds = habits.map((h) => h.id);
    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        logDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        completed: true,
      },
    });

    const logCountsByHabit = new Map<number, number>();
    for (const log of logs) {
      logCountsByHabit.set(log.habitId, (logCountsByHabit.get(log.habitId) || 0) + 1);
    }

    let totalGoalsAchieved = 0;
    const habitsSummary = habits.map((h) => {
      const achieved = logCountsByHabit.get(h.id) || 0;
      totalGoalsAchieved += achieved;
      return {
        habitId: h.id,
        title: h.title,
        target: h.targetCount,
        achieved,
      };
    });

    res.status(200).json({
      activeHabitsCount: habits.length,
      totalGoalsAchievedThisMonth: totalGoalsAchieved,
      habitsSummary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const monthQuery = req.query.month as string | undefined;
    const yearQuery = req.query.year as string | undefined;
    const habitIdQuery = req.query.habitId as string | undefined;

    const whereClause: any = { userId };

    if (monthQuery && yearQuery) {
      const month = parseInt(monthQuery, 10);
      const year = parseInt(yearQuery, 10);
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        whereClause.noteDate = {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lte: new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999)),
        };
      }
    }

    if (habitIdQuery) {
      const habitId = parseInt(habitIdQuery, 10);
      if (!isNaN(habitId)) {
        whereClause.habitId = habitId;
      }
    }

    const notes = await prisma.dailyNote.findMany({
      where: whereClause,
      include: {
        habit: {
          select: {
            id: true,
            title: true,
            colorHex: true,
          },
        },
      },
      orderBy: [{ noteDate: 'desc' }, { createdAt: 'desc' }],
    });

    const response = notes.map((n) => ({
      id: n.id,
      habitId: n.habitId,
      habitTitle: n.habit?.title ?? null,
      colorHex: n.habit?.colorHex ?? null,
      noteDate: n.noteDate.toISOString().split('T')[0],
      timestamp: n.createdAt.toISOString(),
      content: n.content,
    }));

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { noteDate, content, habitId } = req.body;

    if (!noteDate || typeof noteDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(noteDate) || isNaN(Date.parse(`${noteDate}T00:00:00.000Z`))) {
      throw new AppError(422, 'INVALID_DATE_FORMAT', 'noteDate must be a valid string formatted as YYYY-MM-DD.');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 1000) {
      throw new AppError(422, 'INVALID_NOTE_CONTENT', 'Content must be between 1 and 1000 characters.');
    }

    let linkedHabitTitle: string | null = null;
    let finalHabitId: number | null = null;

    if (habitId !== undefined && habitId !== null) {
      if (typeof habitId !== 'number' || isNaN(habitId)) {
        throw new AppError(422, 'INVALID_HABIT_ID', 'habitId must be an integer.');
      }

      const habit = await prisma.habit.findFirst({
        where: { id: habitId },
      });

      if (!habit || habit.userId !== userId) {
        throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
      }

      finalHabitId = habit.id;
      linkedHabitTitle = habit.title;
    }

    const created = await prisma.dailyNote.create({
      data: {
        userId,
        habitId: finalHabitId,
        noteDate: new Date(`${noteDate}T00:00:00.000Z`),
        content: content.trim(),
      },
    });

    res.status(201).json({
      id: created.id,
      habitId: created.habitId,
      habitTitle: linkedHabitTitle,
      noteDate,
      timestamp: created.createdAt.toISOString(),
      content: created.content,
    });
  } catch (error) {
    next(error);
  }
}

