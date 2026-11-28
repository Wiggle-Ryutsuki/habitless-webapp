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

// GET /api/challenges (API-S2-03)
export async function listChallenges(req: Request, res: Response, next: NextFunction) {
  try {
    const participantId = req.user!.id;
    const { q, category, status } = req.query;

    const whereClause: any = {};

    if (q && typeof q === 'string' && q.trim().length > 0) {
      whereClause.OR = [
        { title: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }

    if (category && typeof category === 'string' && category.trim().length > 0) {
      whereClause.category = category.trim();
    }

    // Default to PUBLISHED, but include DRAFT if user has ENDED habits for it
    const programs = await prisma.challengeProgram.findMany({
      where: whereClause,
      include: {
        manager: {
          select: {
            fullName: true,
          },
        },
        activities: true,
        ratings: true,
        enrollments: {
          where: { participantId },
        },
        habits: {
          where: { userId: participantId, isActive: true },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    const formatted = programs
      .map((p) => {
        const userEnrollment = p.enrollments[0] || null;
        const ratingsCount = p.ratings.length;
        const averageRating = ratingsCount > 0
          ? Math.round((p.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount) * 10) / 10
          : 0;

        const durationDays = p.durationDays || Math.max(1, Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

        let countdown: any = null;
        if (userEnrollment && userEnrollment.status === 'ACTIVE') {
          const startDay = new Date(Date.UTC(userEnrollment.enrolledAt.getUTCFullYear(), userEnrollment.enrolledAt.getUTCMonth(), userEnrollment.enrolledAt.getUTCDate()));
          const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          const elapsedDays = Math.max(0, Math.floor((todayUtc.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)));
          const currentDay = Math.min(durationDays, elapsedDays + 1);
          const daysRemaining = Math.max(0, durationDays - (elapsedDays + 1));
          countdown = {
            durationDays,
            currentDay,
            daysRemaining,
            isCompleted: elapsedDays >= durationDays,
          };
        }

        const hasEndedHabit = p.habits.some((h) => h.challengeStatus === 'ENDED');
        const isPastEnd = countdown ? countdown.isCompleted : new Date(p.endDate) < now;

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          durationDays,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
          version: p.version,
          manager: {
            fullName: p.manager.fullName,
          },
          activitiesCount: p.activities.length,
          enrollmentsCount: p._count.enrollments,
          averageRating,
          ratingsCount,
          myEnrollment: userEnrollment
            ? {
                status: userEnrollment.status,
                enrolledAt: userEnrollment.enrolledAt,
                durationDays,
                currentDay: countdown?.currentDay ?? 1,
                daysRemaining: countdown?.daysRemaining ?? durationDays,
                isCompleted: countdown?.isCompleted ?? false,
              }
            : null,
          _hasEndedHabit: hasEndedHabit,
          _isPastEnd: isPastEnd,
        };
      })
      .filter((item) => {
        // Visibility: only published programs or unpublished if participant has ENDED habits
        if (item.status !== 'PUBLISHED' && !item._hasEndedHabit) {
          return false;
        }

        const filterStatus = typeof status === 'string' ? status.toUpperCase() : 'ALL';
        if (filterStatus === 'ENROLLED') {
          return item.myEnrollment?.status === 'ACTIVE';
        }
        if (filterStatus === 'AVAILABLE') {
          return item.status === 'PUBLISHED' && (!item.myEnrollment || item.myEnrollment.status === 'LEFT');
        }
        if (filterStatus === 'ENDED') {
          return item._isPastEnd || item._hasEndedHabit || item.myEnrollment?.status === 'COMPLETED';
        }
        // ALL
        return true;
      })
      .map(({ _hasEndedHabit, _isPastEnd, ...rest }) => rest);

    res.json(formatted);
  } catch (error) {
    next(error);
  }
}

// GET /api/challenges/:id (API-S2-04 Extended)
export async function getChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId) || challengeId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const userId = req.user?.id;

    const program = await prisma.challengeProgram.findUnique({
      where: { id: challengeId },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        activities: {
          orderBy: { id: 'asc' },
        },
        ratings: true,
        comments: {
          where: { parentCommentId: null },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        enrollments: userId ? { where: { participantId: userId } } : false,
        habits: userId ? { where: { userId } } : false,
      },
    });

    if (!program) {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found or not currently published.');
    }

    // Visibility: published or draft with active/unresolved ended enrollment
    if (program.status !== 'PUBLISHED') {
      const userHabits = program.habits || [];
      const userEnrollments = program.enrollments || [];
      const hasAccess =
        program.previouslyPublished &&
        (userHabits.some((h) => h.challengeStatus === 'ENDED') ||
          userEnrollments.some((e) => e.status === 'ACTIVE' || e.status === 'COMPLETED'));

      if (!hasAccess) {
        throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found or not currently published.');
      }
    }

    const ratingsCount = program.ratings.length;
    const averageRating = ratingsCount > 0
      ? Math.round((program.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount) * 10) / 10
      : 0;

    const myRating = userId
      ? program.ratings.find((r) => r.userId === userId)?.rating ?? null
      : null;

    const durationDays = program.durationDays || Math.max(1, Math.round((new Date(program.endDate).getTime() - new Date(program.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

    let myEnrollment: any = null;
    if (userId && program.enrollments && program.enrollments.length > 0) {
      const enr = program.enrollments[0];
      const userHabits = program.habits || [];
      const hasUnresolvedEndedHabits = userHabits.some((h) => h.challengeStatus === 'ENDED');
      const activeClonedHabits = userHabits.filter(
        (h) => h.isActive && (h.challengeStatus === 'ACTIVE' || h.challengeStatus === 'ENDED')
      );
      const updateAvailable =
        enr.status === 'ACTIVE' &&
        activeClonedHabits.some((h) => (h.syncedVersion ?? 1) < program.version);

      const now = new Date();
      const startDay = new Date(Date.UTC(enr.enrolledAt.getUTCFullYear(), enr.enrolledAt.getUTCMonth(), enr.enrolledAt.getUTCDate()));
      const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const elapsedDays = Math.max(0, Math.floor((todayUtc.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)));
      const currentDay = Math.min(durationDays, elapsedDays + 1);
      const daysRemaining = Math.max(0, durationDays - (elapsedDays + 1));

      myEnrollment = {
        id: enr.id,
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        leftAt: enr.leftAt,
        isActive: enr.isActive,
        durationDays,
        currentDay,
        daysRemaining,
        isCompleted: elapsedDays >= durationDays,
        hasUnresolvedEndedHabits,
        updateAvailable,
      };
    }

    const formattedComments = program.comments.map((c) => ({
      id: c.id,
      programId: c.programId,
      parentCommentId: c.parentCommentId,
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: {
        id: c.user.id,
        fullName: c.user.fullName,
        role: c.user.role,
      },
      replies: (c.replies || []).map((r) => ({
        id: r.id,
        programId: r.programId,
        parentCommentId: r.parentCommentId,
        content: r.content,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        author: {
          id: r.user.id,
          fullName: r.user.fullName,
          role: r.user.role,
        },
      })),
    }));

    res.json({
      id: program.id,
      title: program.title,
      description: program.description,
      category: program.category,
      durationDays,
      startDate: program.startDate,
      endDate: program.endDate,
      status: program.status,
      version: program.version,
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
      averageRating,
      ratingsCount,
      myRating,
      myEnrollment,
      comments: formattedComments,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/challenges/:id/join (API-S2-05)
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

    if (existingEnrollment && existingEnrollment.status === 'ACTIVE' && existingEnrollment.isActive) {
      throw new AppError(409, 'ALREADY_ENROLLED', 'Participant is already enrolled in this challenge.');
    }

    // Atomic transaction creating/reactivating enrollment and cloning Habit rows
    const result = await prisma.$transaction(async (tx) => {
      let enrollment;
      if (existingEnrollment) {
        enrollment = await tx.programEnrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'ACTIVE',
            isActive: true,
            leftAt: null,
            enrolledAt: new Date(),
          },
        });
      } else {
        enrollment = await tx.programEnrollment.create({
          data: {
            programId: challengeId,
            participantId,
            status: 'ACTIVE',
            isActive: true,
            enrolledAt: new Date(),
          },
        });
      }

      const now = new Date();
      const startUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const durationDays = challenge.durationDays || Math.max(1, Math.round((new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

      // Period starts on the day participant accepts the challenge and runs for durationDays
      const effectiveStartDate = startUtc;
      const effectiveEndDate = new Date(startUtc.getTime() + (durationDays - 1) * 86400000 + (23 * 3600 + 59 * 60 + 59) * 1000);

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
            sourceActivityId: act.id,
            challengeStatus: 'ACTIVE',
            syncedVersion: challenge.version,
            category: challenge.category ? challenge.category.slice(0, 50) : null,
            title: act.title,
            description: act.description,
            colorHex: color,
            frequency: act.frequency,
            daysOfWeek,
            startDate: effectiveStartDate,
            endDate: effectiveEndDate,
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

// POST /api/challenges/:id/leave (API-S2-06)
export async function leaveChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId) || challengeId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const { action } = req.body;
    if (action !== 'KEEP' && action !== 'REMOVE') {
      throw new AppError(422, 'VALIDATION_ERROR', 'Action must be either KEEP or REMOVE.');
    }

    const participantId = req.user!.id;

    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        programId_participantId: {
          programId: challengeId,
          participantId,
        },
      },
    });

    const userHabits = await prisma.habit.findMany({
      where: {
        userId: participantId,
        programId: challengeId,
      },
    });

    if (!enrollment && userHabits.length === 0) {
      throw new AppError(404, 'ENROLLMENT_NOT_FOUND', 'Participant is not enrolled in this challenge.');
    }

    const result = await prisma.$transaction(async (tx) => {
      if (enrollment) {
        await tx.programEnrollment.update({
          where: { id: enrollment.id },
          data: {
            status: 'LEFT',
            isActive: false,
            leftAt: new Date(),
          },
        });
      }

      let affectedCount = 0;
      if (action === 'KEEP') {
        const updateRes = await tx.habit.updateMany({
          where: {
            userId: participantId,
            programId: challengeId,
            isActive: true,
          },
          data: {
            programId: null,
            sourceActivityId: null,
            challengeStatus: null,
            syncedVersion: null,
          },
        });
        affectedCount = updateRes.count;
      } else {
        const updateRes = await tx.habit.updateMany({
          where: {
            userId: participantId,
            programId: challengeId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
        affectedCount = updateRes.count;
      }

      return affectedCount;
    });

    res.json({
      programId: challengeId,
      action,
      affectedHabitsCount: result,
      message: action === 'KEEP'
        ? 'Challenge habits converted to personal habits.'
        : 'Challenge habits removed from calendar.',
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/challenges/:id/sync (API-S2-07)
export async function syncChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId) || challengeId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const challenge = await prisma.challengeProgram.findUnique({
      where: { id: challengeId },
      include: { activities: true },
    });

    if (!challenge || challenge.status !== 'PUBLISHED') {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found or not published.');
    }

    const participantId = req.user!.id;
    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        programId_participantId: {
          programId: challengeId,
          participantId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new AppError(403, 'ENROLLMENT_REQUIRED', 'Only participants with active enrollment can sync challenge updates.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const participantHabits = await tx.habit.findMany({
        where: {
          userId: participantId,
          programId: challengeId,
          isActive: true,
        },
      });

      const habitsByActivity = new Map(
        participantHabits
          .filter((h) => h.sourceActivityId !== null)
          .map((h) => [h.sourceActivityId!, h])
      );

      let updatedCount = 0;
      let addedCount = 0;

      const durationDays = challenge.durationDays || Math.max(1, Math.round((new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const refStart = participantHabits[0]?.startDate || new Date();
      const refEnd = participantHabits[0]?.endDate || new Date(new Date(refStart).getTime() + (durationDays - 1) * 86400000 + (23 * 3600 + 59 * 60 + 59) * 1000);

      for (let i = 0; i < challenge.activities.length; i++) {
        const act = challenge.activities[i];
        const existingHabit = habitsByActivity.get(act.id);

        if (existingHabit) {
          await tx.habit.update({
            where: { id: existingHabit.id },
            data: {
              title: act.title,
              description: act.description,
              frequency: act.frequency,
              daysOfWeek: act.daysOfWeek,
              targetCount: act.targetCount,
              syncedVersion: challenge.version,
            },
          });
          updatedCount++;
        } else {
          const color = FIXED_PALETTE[(participantHabits.length + addedCount) % FIXED_PALETTE.length];
          await tx.habit.create({
            data: {
              userId: participantId,
              programId: challenge.id,
              sourceActivityId: act.id,
              challengeStatus: 'ACTIVE',
              syncedVersion: challenge.version,
              category: challenge.category ? challenge.category.slice(0, 50) : null,
              colorHex: color,
              title: act.title,
              description: act.description,
              frequency: act.frequency,
              daysOfWeek: act.daysOfWeek,
              startDate: refStart,
              endDate: refEnd,
              targetCount: act.targetCount,
              isActive: true,
            },
          });
          addedCount++;
        }
      }

      // Mark any remaining habits from older versions as synced
      const currentActivityIds = new Set(challenge.activities.map((a) => a.id));
      const removedHabitIds = participantHabits
        .filter((h) => h.sourceActivityId && !currentActivityIds.has(h.sourceActivityId))
        .map((h) => h.id);

      if (removedHabitIds.length > 0) {
        await tx.habit.updateMany({
          where: { id: { in: removedHabitIds } },
          data: { syncedVersion: challenge.version },
        });
      }

      return { updatedCount, addedCount };
    });

    res.json({
      programId: challenge.id,
      syncedVersion: challenge.version,
      updatedCount: result.updatedCount,
      addedCount: result.addedCount,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/challenges/:id/rating (API-S2-08)
export async function rateChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId) || challengeId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const { rating } = req.body;
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError(422, 'INVALID_RATING', 'Rating must be an integer between 1 and 5.');
    }

    const userId = req.user!.id;
    if (req.user!.role !== 'PARTICIPANT') {
      throw new AppError(403, 'FORBIDDEN', 'Only participants can rate challenges.');
    }

    const challenge = await prisma.challengeProgram.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found.');
    }

    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        programId_participantId: {
          programId: challengeId,
          participantId: userId,
        },
      },
    });

    if (!enrollment || (enrollment.status !== 'ACTIVE' && enrollment.status !== 'COMPLETED')) {
      throw new AppError(403, 'ENROLLMENT_REQUIRED', 'Only participants with active or completed enrollment can rate this challenge.');
    }

    await prisma.challengeRating.upsert({
      where: {
        programId_userId: {
          programId: challengeId,
          userId,
        },
      },
      update: { rating },
      create: {
        programId: challengeId,
        userId,
        rating,
      },
    });

    const allRatings = await prisma.challengeRating.findMany({
      where: { programId: challengeId },
      select: { rating: true },
    });

    const ratingsCount = allRatings.length;
    const averageRating = ratingsCount > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount) * 10) / 10
      : 0;

    res.json({
      programId: challengeId,
      rating,
      averageRating,
      ratingsCount,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/challenges/:id/comments (API-S2-09)
export async function postComment(req: Request, res: Response, next: NextFunction) {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (isNaN(challengeId) || challengeId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const challenge = await prisma.challengeProgram.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found.');
    }

    const { content, parentCommentId } = req.body;
    if (typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 500) {
      throw new AppError(422, 'INVALID_COMMENT_CONTENT', 'Comment content must be between 1 and 500 characters.');
    }

    const userId = req.user!.id;
    const userRole = req.user!.role;

    const parentId = parentCommentId ? parseInt(parentCommentId, 10) : null;

    if (!parentId) {
      // Top-level comment
      if (userRole !== 'PARTICIPANT') {
        throw new AppError(403, 'FORBIDDEN', 'Managers cannot post top-level participant comments.');
      }

      const enrollment = await prisma.programEnrollment.findUnique({
        where: {
          programId_participantId: {
            programId: challengeId,
            participantId: userId,
          },
        },
      });

      if (!enrollment || (enrollment.status !== 'ACTIVE' && enrollment.status !== 'COMPLETED')) {
        throw new AppError(403, 'ENROLLMENT_REQUIRED', 'Only participants with active or completed enrollment can comment on this challenge.');
      }
    } else {
      // Reply
      if (userRole !== 'PROGRAM_MANAGER') {
        throw new AppError(403, 'FORBIDDEN', 'Only program managers can reply to comments.');
      }

      const parentComment = await prisma.challengeComment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.programId !== challengeId) {
        throw new AppError(404, 'COMMENT_NOT_FOUND', 'Parent comment not found.');
      }

      if (parentComment.parentCommentId !== null) {
        throw new AppError(422, 'NESTED_REPLY_NOT_ALLOWED', 'Nested replies beyond 1 level are not permitted.');
      }
    }

    const comment = await prisma.challengeComment.create({
      data: {
        programId: challengeId,
        userId,
        parentCommentId: parentId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      id: comment.id,
      programId: comment.programId,
      parentCommentId: comment.parentCommentId,
      content: comment.content,
      author: {
        id: comment.user.id,
        fullName: comment.user.fullName,
        role: comment.user.role,
      },
      createdAt: comment.createdAt,
    });
  } catch (error) {
    next(error);
  }
}
