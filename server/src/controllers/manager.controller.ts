import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateProgramInput } from '../utils/program-validator.js';
import { getDaysFromFrequency, deriveFrequencyFromDays } from '../utils/frequency.js';
import { isPresetCategory } from '../utils/categories.js';

export async function listManagerPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const managerId = req.user!.id;

    const programs = await prisma.challengeProgram.findMany({
      where: { managerId },
      include: {
        activities: true,
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

    const response = programs.map((p) => {
      const durationDays = p.durationDays || Math.max(1, Math.round((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        durationDays,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        previouslyPublished: p.previouslyPublished,
        activitiesCount: p.activities.length,
        activities: p.activities,
        enrollmentsCount: p._count.enrollments,
        inviteUrl: p.status === 'PUBLISHED' ? `/challenges/${p.id}` : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getManagerProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId) || programId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid program ID.');
    }

    const program = await prisma.challengeProgram.findUnique({
      where: { id: programId },
      include: {
        activities: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!program) {
      throw new AppError(404, 'PROGRAM_NOT_FOUND', 'Program not found.');
    }

    if (program.managerId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this program.');
    }

    const durationDays = program.durationDays || Math.max(1, Math.round((new Date(program.endDate).getTime() - new Date(program.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

    res.json({
      ...program,
      durationDays,
      enrollmentsCount: program._count?.enrollments ?? 0,
      inviteUrl: program.status === 'PUBLISHED' ? `/challenges/${program.id}` : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = validateProgramInput(req.body);
    if (!validation.isValid) {
      throw new AppError(422, 'VALIDATION_ERROR', 'The request payload failed validation.', validation.fieldErrors);
    }

    const managerId = req.user!.id;
    const { title, description, category, durationDays: rawDuration, startDate: rawStart, endDate: rawEnd, activities } = req.body;

    let durationDays = rawDuration !== undefined && rawDuration !== null ? parseInt(rawDuration, 10) : undefined;
    if (!durationDays && rawStart && rawEnd) {
      durationDays = Math.max(1, Math.round((new Date(rawEnd).getTime() - new Date(rawStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
    if (!durationDays || isNaN(durationDays)) {
      durationDays = 30;
    }

    const startDate = rawStart ? new Date(rawStart) : new Date();
    const endDate = rawEnd ? new Date(rawEnd) : new Date(startDate.getTime() + durationDays * 86400000);

    const program = await prisma.challengeProgram.create({
      data: {
        managerId,
        title: title.trim(),
        description: description ? description.trim() : null,
        category: category.trim(),
        durationDays,
        startDate,
        endDate,
        status: 'DRAFT',
        activities: {
          create: activities.map((a: any) => {
            const daysOfWeek = Array.isArray(a.daysOfWeek) && a.daysOfWeek.length > 0
              ? [...a.daysOfWeek].sort((x: number, y: number) => x - y)
              : getDaysFromFrequency(a.frequency);
            const frequency = a.frequency || (a.daysOfWeek ? deriveFrequencyFromDays(a.daysOfWeek) : 'DAILY');
            return {
              title: a.title.trim(),
              description: a.description ? a.description.trim() : null,
              frequency: frequency as any,
              daysOfWeek,
              targetCount: a.targetCount !== undefined ? a.targetCount : 1,
            };
          }),
        },
      },
      include: {
        activities: true,
      },
    });

    res.status(201).json({
      ...program,
      inviteUrl: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId) || programId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid program ID.');
    }

    const existing = await prisma.challengeProgram.findUnique({
      where: { id: programId },
      include: { activities: true },
    });

    if (!existing) {
      throw new AppError(404, 'PROGRAM_NOT_FOUND', 'Program not found.');
    }

    if (existing.managerId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this program.');
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError(422, 'PROGRAM_NOT_EDITABLE', 'Published or archived programs cannot be modified.');
    }

    const validation = validateProgramInput(req.body);
    if (!validation.isValid) {
      throw new AppError(422, 'VALIDATION_ERROR', 'The request payload failed validation.', validation.fieldErrors);
    }

    const { title, description, category, durationDays: rawDuration, startDate: rawStart, endDate: rawEnd, activities } = req.body;

    let durationDays = rawDuration !== undefined && rawDuration !== null ? parseInt(rawDuration, 10) : undefined;
    if (!durationDays && rawStart && rawEnd) {
      durationDays = Math.max(1, Math.round((new Date(rawEnd).getTime() - new Date(rawStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
    if (!durationDays || isNaN(durationDays)) {
      durationDays = existing.durationDays || 30;
    }

    const startDate = rawStart ? new Date(rawStart) : existing.startDate;
    const endDate = rawEnd ? new Date(rawEnd) : (rawDuration ? new Date(startDate.getTime() + durationDays * 86400000) : existing.endDate);

    const updated = await prisma.$transaction(async (tx) => {
      // Manage activities: update existing by id (or by index), create new ones, delete removed ones
      const existingActs = existing.activities || [];
      const updatedActivityIds: number[] = [];

      for (let i = 0; i < activities.length; i++) {
        const a = activities[i];
        const daysOfWeek = Array.isArray(a.daysOfWeek) && a.daysOfWeek.length > 0
          ? [...a.daysOfWeek].sort((x: number, y: number) => x - y)
          : getDaysFromFrequency(a.frequency);
        const frequency = a.frequency || (a.daysOfWeek ? deriveFrequencyFromDays(a.daysOfWeek) : 'DAILY');

        const matchedExisting = a.id
          ? existingActs.find((ea) => ea.id === a.id)
          : (i < existingActs.length ? existingActs[i] : null);

        if (matchedExisting) {
          await tx.programActivity.update({
            where: { id: matchedExisting.id },
            data: {
              title: a.title.trim(),
              description: a.description ? a.description.trim() : null,
              frequency: frequency as any,
              daysOfWeek,
              targetCount: a.targetCount !== undefined ? a.targetCount : 1,
            },
          });
          updatedActivityIds.push(matchedExisting.id);
        } else {
          const created = await tx.programActivity.create({
            data: {
              programId,
              title: a.title.trim(),
              description: a.description ? a.description.trim() : null,
              frequency: frequency as any,
              daysOfWeek,
              targetCount: a.targetCount !== undefined ? a.targetCount : 1,
            },
          });
          updatedActivityIds.push(created.id);
        }
      }

      // Delete any existing activities that were removed
      const removedIds = existingActs.filter((ea) => !updatedActivityIds.includes(ea.id)).map((ea) => ea.id);
      if (removedIds.length > 0) {
        await tx.programActivity.deleteMany({
          where: { id: { in: removedIds } },
        });
      }

      return tx.challengeProgram.update({
        where: { id: programId },
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          category: category.trim(),
          durationDays,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          hasTemplateEditsSincePublish: existing.previouslyPublished ? true : existing.hasTemplateEditsSincePublish,
        },
        include: {
          activities: { orderBy: { id: 'asc' } },
        },
      });
    });

    res.json({
      ...updated,
      inviteUrl: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function deployProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId) || programId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid program ID.');
    }

    const existing = await prisma.challengeProgram.findUnique({
      where: { id: programId },
    });

    if (!existing) {
      throw new AppError(404, 'PROGRAM_NOT_FOUND', 'Program not found.');
    }

    if (existing.managerId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied: You do not own this program.');
    }

    if (existing.status === 'ARCHIVED') {
      throw new AppError(422, 'PROGRAM_ARCHIVED', 'Archived programs cannot be deployed.');
    }

    let program = existing;
    if (existing.status === 'DRAFT') {
      const isRepublish = existing.previouslyPublished === true;
      const hasEdits = existing.hasTemplateEditsSincePublish === true;
      const nextVersion = (isRepublish && hasEdits) ? existing.version + 1 : existing.version;

      program = await prisma.$transaction(async (tx) => {
        // Automatically restore unresolved ENDED habits to ACTIVE
        await tx.habit.updateMany({
          where: {
            programId,
            challengeStatus: 'ENDED',
          },
          data: {
            challengeStatus: 'ACTIVE',
          },
        });

        // Reactivate enrollments for active participants
        await tx.programEnrollment.updateMany({
          where: {
            programId,
            status: 'ACTIVE',
          },
          data: {
            isActive: true,
          },
        });

        return tx.challengeProgram.update({
          where: { id: programId },
          data: {
            status: 'PUBLISHED',
            version: nextVersion,
            hasTemplateEditsSincePublish: false,
          },
        });
      });
    }

    res.json({
      id: program.id,
      title: program.title,
      status: 'PUBLISHED',
      deployedAt: program.updatedAt,
      inviteUrl: `/challenges/${program.id}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId) || programId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid program ID.');
    }

    const existing = await prisma.challengeProgram.findUnique({
      where: { id: programId },
    });

    if (!existing) {
      throw new AppError(404, 'PROGRAM_NOT_FOUND', 'Program not found.');
    }

    if (existing.managerId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied: You do not own this program.');
    }

    const updated = await prisma.challengeProgram.update({
      where: { id: programId },
      data: {
        status: 'ARCHIVED',
      },
    });

    res.json({
      id: updated.id,
      title: updated.title,
      status: 'ARCHIVED',
      archivedAt: updated.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId) || programId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid program ID.');
    }

    const existing = await prisma.challengeProgram.findUnique({
      where: { id: programId },
    });

    if (!existing) {
      throw new AppError(404, 'PROGRAM_NOT_FOUND', 'Program not found.');
    }

    if (existing.managerId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied: You do not own this program.');
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError(422, 'CANNOT_DELETE_PUBLISHED', 'Only draft challenge programs can be deleted.');
    }

    await prisma.challengeProgram.delete({
      where: { id: programId },
    });

    res.json({
      message: 'Draft challenge program deleted successfully.',
      id: programId,
    });
  } catch (error) {
    next(error);
  }
}

export async function unpublishProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId) || programId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid program ID.');
    }

    const existing = await prisma.challengeProgram.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError(404, 'PROGRAM_NOT_FOUND', 'Program not found.');
    }

    if (existing.managerId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied: You do not own this program.');
    }

    if (existing.status !== 'PUBLISHED') {
      throw new AppError(422, 'PROGRAM_NOT_PUBLISHED', 'Only published challenge programs can be unpublished.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Deactivate enrollments for enrolled participants
      await tx.programEnrollment.updateMany({
        where: { programId, status: 'ACTIVE' },
        data: {
          isActive: false,
        },
      });

      // Transition participant habits to ENDED
      await tx.habit.updateMany({
        where: {
          programId,
          challengeStatus: 'ACTIVE',
        },
        data: {
          challengeStatus: 'ENDED',
        },
      });

      return tx.challengeProgram.update({
        where: { id: programId },
        data: {
          status: 'DRAFT',
          previouslyPublished: true,
        },
        include: {
          activities: true,
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });
    });

    res.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      previouslyPublished: updated.previouslyPublished,
      enrollmentsCount: updated._count.enrollments,
      activitiesCount: updated.activities.length,
      inviteUrl: null,
      unpublishedAt: updated.updatedAt,
      message: 'Challenge program unpublished successfully and reverted to draft.',
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/manager/analytics (API-S2-10)
export async function getManagerAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const publishedPrograms = await prisma.challengeProgram.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            status: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    const totalPublishedChallenges = publishedPrograms.length;

    const allEnrollments = await prisma.programEnrollment.findMany({
      select: {
        id: true,
        status: true,
      },
    });
    const totalActiveEnrollments = allEnrollments.filter((e) => e.status === 'ACTIVE').length;
    const totalCompletedEnrollments = allEnrollments.filter((e) => e.status === 'COMPLETED').length;

    const mostPopularChallenges = publishedPrograms
      .map((p) => {
        const activeOrCompletedEnrollments = p.enrollments.filter(
          (e) => e.status === 'ACTIVE' || e.status === 'COMPLETED'
        ).length;
        const ratingsCount = p.ratings.length;
        const averageRating =
          ratingsCount > 0
            ? Math.round((p.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount) * 10) / 10
            : 0;

        const durationDays =
          p.durationDays ||
          Math.max(
            1,
            Math.round(
              (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
          );

        return {
          id: p.id,
          title: p.title,
          category: p.category,
          durationDays,
          managerName: p.manager.fullName,
          enrollmentCount: activeOrCompletedEnrollments,
          averageRating,
        };
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount || b.averageRating - a.averageRating)
      .slice(0, 10);

    const categoryMap = new Map<
      string,
      {
        challengesCount: number;
        totalEnrollments: number;
        completedEnrollments: number;
      }
    >();

    for (const p of publishedPrograms) {
      const cat = p.category.trim();
      const current = categoryMap.get(cat) || {
        challengesCount: 0,
        totalEnrollments: 0,
        completedEnrollments: 0,
      };

      const enrollmentsCount = p.enrollments.filter(
        (e) => e.status === 'ACTIVE' || e.status === 'COMPLETED'
      ).length;
      const completedCount = p.enrollments.filter((e) => e.status === 'COMPLETED').length;

      current.challengesCount += 1;
      current.totalEnrollments += enrollmentsCount;
      current.completedEnrollments += completedCount;
      categoryMap.set(cat, current);
    }

    const presetCategoriesList: any[] = [];
    const customCategoriesList: any[] = [];
    let otherTotalChallenges = 0;
    let otherTotalEnrollments = 0;
    let otherCompletedEnrollments = 0;

    for (const [catName, data] of categoryMap.entries()) {
      const completionRate =
        data.totalEnrollments > 0
          ? Math.round((data.completedEnrollments / data.totalEnrollments) * 100)
          : 0;

      if (isPresetCategory(catName)) {
        presetCategoriesList.push({
          category: catName,
          isPreset: true,
          challengesCount: data.challengesCount,
          totalEnrollments: data.totalEnrollments,
          completionRate,
        });
      } else {
        otherTotalChallenges += data.challengesCount;
        otherTotalEnrollments += data.totalEnrollments;
        otherCompletedEnrollments += data.completedEnrollments;
        customCategoriesList.push({
          category: catName,
          challengesCount: data.challengesCount,
          totalEnrollments: data.totalEnrollments,
          completionRate,
        });
      }
    }

    const topCategories: any[] = [...presetCategoriesList];

    if (customCategoriesList.length > 0) {
      const otherCompletionRate =
        otherTotalEnrollments > 0
          ? Math.round((otherCompletedEnrollments / otherTotalEnrollments) * 100)
          : 0;

      topCategories.push({
        category: 'Other',
        isPreset: false,
        challengesCount: otherTotalChallenges,
        totalEnrollments: otherTotalEnrollments,
        completionRate: otherCompletionRate,
        customCategories: customCategoriesList.sort(
          (a, b) => b.totalEnrollments - a.totalEnrollments || b.challengesCount - a.challengesCount
        ),
      });
    }

    topCategories.sort(
      (a, b) => b.totalEnrollments - a.totalEnrollments || b.challengesCount - a.challengesCount
    );

    res.json({
      summary: {
        totalPublishedChallenges,
        totalActiveEnrollments,
        totalCompletedEnrollments,
      },
      mostPopularChallenges,
      topCategories,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/manager/directory (API-S2-11)
export async function listManagerDirectory(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, category } = req.query;
    const currentUserId = req.user!.id;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (typeof q === 'string' && q.trim().length > 0) {
      const query = q.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (typeof category === 'string' && category.trim().length > 0 && category.trim() !== 'ALL') {
      where.category = category.trim();
    }

    const programs = await prisma.challengeProgram.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
        activities: {
          select: { id: true },
        },
        enrollments: {
          select: { id: true },
        },
        ratings: {
          select: { rating: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response = programs.map((p) => {
      const ratingsCount = p.ratings.length;
      const averageRating =
        ratingsCount > 0
          ? Math.round((p.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount) * 10) / 10
          : 0;

      const durationDays =
        p.durationDays ||
        Math.max(
          1,
          Math.round(
            (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        );

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
          id: p.manager.id,
          fullName: p.manager.fullName,
        },
        isOwnedByMe: p.managerId === currentUserId,
        activitiesCount: p.activities.length,
        enrollmentsCount: p.enrollments.length,
        averageRating,
        ratingsCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
}

// GET /api/manager/directory/:id (API-S2-12)
export async function getManagerDirectoryChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId) || programId <= 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid challenge ID.');
    }

    const currentUserId = req.user!.id;

    const program = await prisma.challengeProgram.findUnique({
      where: { id: programId },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
        activities: {
          orderBy: { id: 'asc' },
        },
        enrollments: {
          select: { id: true },
        },
        ratings: {
          select: { rating: true },
        },
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
      },
    });

    if (!program) {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge program not found.');
    }

    const isOwnedByMe = program.managerId === currentUserId;

    // Visibility rule: must be PUBLISHED or owned by the manager
    if (program.status !== 'PUBLISHED' && !isOwnedByMe) {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge program not found.');
    }

    const ratingsCount = program.ratings.length;
    const averageRating =
      ratingsCount > 0
        ? Math.round((program.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount) * 10) / 10
        : 0;

    const durationDays =
      program.durationDays ||
      Math.max(
        1,
        Math.round(
          (new Date(program.endDate).getTime() - new Date(program.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );

    const formattedComments = program.comments.map((c) => ({
      id: c.id,
      programId: c.programId,
      parentCommentId: c.parentCommentId,
      content: c.content,
      createdAt: c.createdAt,
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
        id: program.manager.id,
        fullName: program.manager.fullName,
      },
      isOwnedByMe,
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
      comments: formattedComments,
      enrollmentsCount: program.enrollments.length,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}
