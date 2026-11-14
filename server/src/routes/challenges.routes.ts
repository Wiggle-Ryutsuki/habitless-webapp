import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getChallenge, joinChallenge } from '../controllers/challenges.controller.js';

const router = Router();

// Public: view deployed challenge details
router.get('/:id', getChallenge);

// Participant only: join challenge and materialize personal habits
router.post('/:id/join', requireAuth, requireRole([Role.PARTICIPANT]), joinChallenge);

export default router;
