import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getTodayChecklist,
  logHabit,
  getCalendarMatrix,
  getGoalsSummary,
  getNotes,
  createNote,
} from '../controllers/tracking.controller.js';

const router = Router();

// All tracking endpoints require authenticated participant
router.use(requireAuth);
router.use(requireRole([Role.PARTICIPANT], 'PARTICIPANT_ROLE_REQUIRED'));

router.get('/today', getTodayChecklist);
router.post('/log', logHabit);
router.get('/calendar', getCalendarMatrix);
router.get('/goals', getGoalsSummary);
router.get('/notes', getNotes);
router.post('/notes', createNote);

export default router;

