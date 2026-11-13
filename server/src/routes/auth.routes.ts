import { Router } from 'express';
import { Role } from '@prisma/client';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

// Route for testing RBAC middleware barriers
router.get('/manager-only-check', requireAuth, requireRole([Role.PROGRAM_MANAGER]), (req, res) => {
  res.status(200).json({ message: 'Manager access granted.' });
});

export default router;

