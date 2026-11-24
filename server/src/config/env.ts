import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://habitless_user:habitless_password@localhost:5432/habitless_dev?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || (isProduction ? '' : 'habitless-super-secret-jwt-key-2026-minimum-32-chars'),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || (isProduction ? '' : 'ManagerPass123!'),
  DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD || (isProduction ? '' : 'ParticipantPass123!'),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

if (isProduction && !ENV.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production.');
}

