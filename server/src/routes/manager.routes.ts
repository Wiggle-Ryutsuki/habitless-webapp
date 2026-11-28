import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listManagerPrograms,
  getManagerProgram,
  createProgram,
  updateProgram,
  deployProgram,
  unpublishProgram,
  archiveProgram,
  deleteProgram,
  getManagerAnalytics,
  listManagerDirectory,
  getManagerDirectoryChallenge,
} from '../controllers/manager.controller.js';

const router = Router();

// All routes under /api/manager require PROGRAM_MANAGER role
router.use(requireAuth, requireRole([Role.PROGRAM_MANAGER]));

// Analytics (API-S2-10)
router.get('/analytics', getManagerAnalytics);

// Global Challenges Directory (API-S2-11 & API-S2-12)
router.get('/directory', listManagerDirectory);
router.get('/directory/:id', getManagerDirectoryChallenge);

// Manager Programs CRUD & Lifecycle
router.get('/programs', listManagerPrograms);
router.post('/programs', createProgram);
router.get('/programs/:id', getManagerProgram);
router.put('/programs/:id', updateProgram);
router.put('/programs/:id/deploy', deployProgram);
router.put('/programs/:id/unpublish', unpublishProgram);
router.put('/programs/:id/archive', archiveProgram);
router.delete('/programs/:id', deleteProgram);

export default router;
