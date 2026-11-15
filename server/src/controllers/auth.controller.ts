import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, role } = req.body || {};
    const fieldErrors: Array<{ field: string; message: string }> = [];

    // Email validation
    if (!email || typeof email !== 'string') {
      fieldErrors.push({ field: 'email', message: 'Email is required.' });
    } else {
      const trimmed = email.trim();
      if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 255) {
        fieldErrors.push({ field: 'email', message: 'A valid email address is required (max 255 characters).' });
      }
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      fieldErrors.push({ field: 'password', message: 'Password is required.' });
    } else if (password.length < 8 || password.length > 128) {
      fieldErrors.push({ field: 'password', message: 'Password must be between 8 and 128 characters.' });
    }

    // Full name validation
    if (!fullName || typeof fullName !== 'string') {
      fieldErrors.push({ field: 'fullName', message: 'Full name is required.' });
    } else {
      const trimmedName = fullName.trim();
      if (trimmedName.length < 2 || trimmedName.length > 80) {
        fieldErrors.push({ field: 'fullName', message: 'Full name must be between 2 and 80 characters.' });
      }
    }

    // Role validation
    if (!role || (role !== Role.PARTICIPANT && role !== Role.PROGRAM_MANAGER)) {
      fieldErrors.push({ field: 'role', message: 'Role must be either PARTICIPANT or PROGRAM_MANAGER.' });
    }

    if (fieldErrors.length > 0) {
      throw new AppError(422, 'VALIDATION_ERROR', 'The request payload failed validation.', fieldErrors);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new AppError(409, 'CONFLICT', 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        role: role as Role,
        isActive: true,
      },
    });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    issueCookie(res, token);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password.');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password.');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    issueCookie(res, token);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('token', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'User not found or inactive.');
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
}

