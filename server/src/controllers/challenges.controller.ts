import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const FIXED_PALETTE = [
  '#448aff',
  '#1565c0',
  '#009688',
  '#8bc34a',
  '#ffc107',
  '#ff9800',
  '#f44336',
  '#ad1457',
];

export async function getChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId) || challengeId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const program = await prisma.challengeProgram.findUnique({
      where: { id: challengeId },
      include: {
        manager: {
          select: {
            fullName: true,
          },
        },
        activities: true,
      },
    });

    if (!program || program.status !== 'PUBLISHED') {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found or not currently published.');
    }

    res.json({
      id: program.id,
      title: program.title,
      description: program.description,
      category: program.category,
      startDate: program.startDate,
      endDate: program.endDate,
      status: program.status,
      manager: {
        fullName: program.manager.fullName,
      },
      activities: program.activities.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        frequency: a.frequency,
        daysOfWeek: a.daysOfWeek,
        targetCount: a.targetCount,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function joinChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId) || challengeId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const challenge = await prisma.challengeProgram.findUnique({
      where: { id: challengeId },
      include: {
        activities: true,
      },
    });

    if (!challenge || challenge.status !== 'PUBLISHED') {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found or not currently published.');
    }

    const participantId = req.user!.id;

    // Duplicate enrollment check
    const existingEnrollment = await prisma.programEnrollment.findUnique({
      where: {
        programId_participantId: {
          programId: challengeId,
          participantId,
        },
      },
    });

    if (existingEnrollment) {
      throw new AppError(409, 'ALREADY_ENROLLED', 'Participant is already enrolled in this challenge.');
    }

    // Atomic transaction creating enrollment and personal Habit rows
    const result = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.programEnrollment.create({
        data: {
          programId: challengeId,
          participantId,
        },
      });

      const now = new Date();
      const startUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const challengeStart = new Date(challenge.startDate);
      const effectiveStartDate = challengeStart > startUtc ? challengeStart : startUtc;

      const createdHabits = [];
      for (let i = 0; i < challenge.activities.length; i++) {
        const act = challenge.activities[i];
        const color = FIXED_PALETTE[i % FIXED_PALETTE.length];

        let daysOfWeek = Array.isArray(act.daysOfWeek) && act.daysOfWeek.length > 0
          ? act.daysOfWeek
          : [1, 2, 3, 4, 5, 6, 7];
        let defaultTarget = 20;

        if (!act.daysOfWeek || act.daysOfWeek.length === 0) {
          switch (act.frequency) {
            case 'WEEKDAYS':
              daysOfWeek = [1, 2, 3, 4, 5];
              defaultTarget = 20;
              break;
            case 'THREE_TIMES_WEEKLY':
              daysOfWeek = [1, 3, 5];
              defaultTarget = 12;
              break;
            case 'WEEKLY':
              daysOfWeek = [1];
              defaultTarget = 4;
              break;
            case 'MONTHLY':
              daysOfWeek = [1];
              defaultTarget = 1;
              break;
            case 'DAILY':
            default:
              daysOfWeek = [1, 2, 3, 4, 5, 6, 7];
              defaultTarget = 20;
              break;
          }
        } else {
          defaultTarget = Math.min(31, Math.max(1, daysOfWeek.length * 4));
        }

        const targetCount = act.targetCount && act.targetCount > 1
          ? Math.min(31, Math.max(1, act.targetCount * (act.frequency === 'THREE_TIMES_WEEKLY' ? 4 : 20)))
          : defaultTarget;

        const habit = await tx.habit.create({
          data: {
            userId: participantId,
            programId: challenge.id,
            title: act.title,
            description: act.description,
            colorHex: color,
            frequency: act.frequency,
            daysOfWeek,
            startDate: effectiveStartDate,
            endDate: challenge.endDate,
            targetCount,
            isActive: true,
          },
        });
        createdHabits.push(habit);
      }

      return { enrollment, createdHabits };
    });

    res.status(201).json({
      enrollmentId: result.enrollment.id,
      programId: challenge.id,
      participantId,
      enrolledAt: result.enrollment.enrolledAt,
      habitsCreatedCount: result.createdHabits.length,
      message: 'Enrolled in challenge successfully and curriculum habits added to calendar',
    });
  } catch (error) {
    next(error);
  }
}
