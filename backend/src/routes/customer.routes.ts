import { Router } from 'express';
import { customerService } from '../services/customer.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all customers
router.get('/', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const filters = {
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };
    const result = await customerService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my profile as customer
router.get('/me', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Not a customer' });
      return;
    }
    const customer = await customerService.getByUserId(req.user.userId);
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

// Create customer
router.post('/', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const data = { ...req.body, createdById: req.user.userId };
    const customer = await customerService.create(data);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update customer
router.patch('/:id', authenticate, async (req: any, res) => {
  try {
    const customer = await customerService.update(req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete customer
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    await customerService.delete(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
