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
} from '../controllers/manager.controller.js';

const router = Router();

// All routes under /api/manager require PROGRAM_MANAGER role
router.use(requireAuth, requireRole([Role.PROGRAM_MANAGER]));

router.get('/programs', listManagerPrograms);
router.post('/programs', createProgram);
router.get('/programs/:id', getManagerProgram);
router.put('/programs/:id', updateProgram);
router.put('/programs/:id/deploy', deployProgram);
router.put('/programs/:id/unpublish', unpublishProgram);
router.put('/programs/:id/archive', archiveProgram);
router.delete('/programs/:id', deleteProgram);

export default router;
