import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import {
  listChallenges,
  getChallenge,
  joinChallenge,
  leaveChallenge,
  syncChallenge,
  rateChallenge,
  postComment,
} from '../controllers/challenges.controller.js';

const router = Router();

// Participant: list / browse challenges (API-S2-03)
router.get('/', requireAuth, requireRole([Role.PARTICIPANT]), listChallenges);

// Public / Authenticated: view challenge details (API-S2-04)
router.get('/:id', optionalAuth, getChallenge);

// Participant only: join challenge (API-S2-05)
router.post('/:id/join', requireAuth, requireRole([Role.PARTICIPANT]), joinChallenge);

// Participant only: leave challenge (API-S2-06)
router.post('/:id/leave', requireAuth, requireRole([Role.PARTICIPANT]), leaveChallenge);

// Participant only: sync challenge updates (API-S2-07)
router.post('/:id/sync', requireAuth, requireRole([Role.PARTICIPANT]), syncChallenge);

// Participant only: rate challenge (API-S2-08)
router.put('/:id/rating', requireAuth, requireRole([Role.PARTICIPANT]), rateChallenge);

// Authenticated (Participant top-level, Manager reply): post comment (API-S2-09)
router.post('/:id/comments', requireAuth, postComment);

export default router;
