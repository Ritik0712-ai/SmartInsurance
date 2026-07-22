import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { customerService } from '../services/customer.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all customers (Admin/Agent only)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'AGENT'),
  async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await customerService.getAll(filters);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get my profile as customer
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = req.user;
    if (user.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Not a customer' });
      return;
    }

    const customer = await customerService.getById(user.userId);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Get customer by ID
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const customer = await customerService.getById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Create customer (Admin/Agent only)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'AGENT'),
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ]),
  async (req: any, res) => {
    try {
      const result = await customerService.create({
        ...req.body,
        createdById: req.user.userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update customer
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const customer = await customerService.update(req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete customer (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const result = await customerService.delete(req.params.id, req.user.userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
