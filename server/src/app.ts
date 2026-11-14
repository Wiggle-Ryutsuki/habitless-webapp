import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import habitsRoutes from './routes/habits.routes.js';
import trackingRoutes from './routes/tracking.routes.js';
import managerRoutes from './routes/manager.routes.js';
import challengesRoutes from './routes/challenges.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/challenges', challengesRoutes);

// Error handling middleware
app.use(errorHandler);

