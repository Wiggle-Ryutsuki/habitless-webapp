import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://habitless_user:habitless_password@localhost:5432/habitless_dev?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'habitless-super-secret-jwt-key-2026-minimum-32-chars',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'ManagerPass123!',
  DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD || 'ParticipantPass123!',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

