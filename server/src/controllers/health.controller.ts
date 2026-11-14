import { Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export async function getHealth(req: Request, res: Response) {
  return res.status(200).json({
    status: 'ok',
    service: 'HabitLess API',
    timestamp: new Date().toISOString(),
  });
}

export async function getReady(req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ready',
      db: 'connected',
    });
  } catch (error) {
    const correlationId = (req.headers['x-correlation-id'] as string) || `hl-req-ready-${Date.now()}`;
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection is not ready.',
        correlationId,
      },
    });
  }
}

