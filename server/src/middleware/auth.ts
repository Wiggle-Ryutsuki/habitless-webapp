import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ENV } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { AppError } from './errorHandler.js';
import { JwtPayload } from '../types/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: Role;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is required.');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET) as unknown as JwtPayload;
    } catch (jwtErr) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token.');
    }

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.sub,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Account is deactivated or does not exist.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied: insufficient permissions.'));
    }

    next();
  };
}
