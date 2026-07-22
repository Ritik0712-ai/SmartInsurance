import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Register
router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('phone').optional().isMobilePhone('any'),
    body('role').optional().isIn(['ADMIN', 'AGENT', 'CUSTOMER']),
  ]),
  async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  }
);

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

// Get profile
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await authService.getProfile(req.user.userId);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await authService.updateProfile(req.user.userId, req.body);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Change password
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ]),
  async (req: any, res) => {
    try {
      const result = await authService.changePassword(
        req.user.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router;
