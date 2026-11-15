import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getHabits,
  createHabit,
  getHabitById,
  updateHabit,
  archiveHabit,
} from '../controllers/habits.controller.js';

const router = Router();

// All habits endpoints require authenticated participant
router.use(requireAuth);
router.use(requireRole([Role.PARTICIPANT], 'PARTICIPANT_ROLE_REQUIRED'));

router.get('/', getHabits);
router.post('/', createHabit);
router.get('/:id', getHabitById);
router.put('/:id', updateHabit);
router.delete('/:id', archiveHabit);

export default router;

