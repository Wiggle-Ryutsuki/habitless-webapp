import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateProgramInput } from '../utils/program-validator.js';
import { getDaysFromFrequency, deriveFrequencyFromDays } from '../utils/frequency.js';

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

    const response = programs.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      previouslyPublished: p.previouslyPublished,
      activitiesCount: p.activities.length,
      enrollmentsCount: p._count.enrollments,
      inviteUrl: p.status === 'PUBLISHED' ? `/challenges/${p.id}` : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

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

    res.json({
      ...program,
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
    const { title, description, category, startDate, endDate, activities } = req.body;

    const program = await prisma.challengeProgram.create({
      data: {
        managerId,
        title: title.trim(),
        description: description ? description.trim() : null,
        category: category.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

    const { title, description, category, startDate, endDate, activities } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.programActivity.deleteMany({
        where: { programId },
      });

      return tx.challengeProgram.update({
        where: { id: programId },
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          category: category.trim(),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
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
      program = await prisma.challengeProgram.update({
        where: { id: programId },
        data: {
          status: 'PUBLISHED',
        },
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
        where: { programId },
        data: {
          isActive: false,
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
