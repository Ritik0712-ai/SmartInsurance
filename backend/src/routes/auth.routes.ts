import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Register
router.post(
  '/register',
  async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      // Simple validation
      if (!email || !email.includes('@')) {
        res.status(400).json({ success: false, error: 'Valid email is required' });
        return;
      }
      if (!password || password.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        return;
      }
      if (!firstName || !firstName.trim()) {
        res.status(400).json({ success: false, error: 'First name is required' });
        return;
      }
      if (!lastName || !lastName.trim()) {
        res.status(400).json({ success: false, error: 'Last name is required' });
        return;
      }
      if (role && !['ADMIN', 'AGENT', 'CUSTOMER'].includes(role)) {
        res.status(400).json({ success: false, error: 'Invalid role' });
        return;
      }

      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Register error:', error.message);
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Login
router.post(
  '/login',
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const result = await authService.login({ email, password });
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Login error:', error.message);
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
  async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword) {
        res.status(400).json({ success: false, error: 'Current password is required' });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
        return;
      }

      const result = await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router;
