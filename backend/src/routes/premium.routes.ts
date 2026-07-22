import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { premiumService } from '../services/premium.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all premium payments
router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters = {
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      policyId: req.query.policyId as string,
      customerId: req.query.customerId as string,
      status: req.query.status as string,
    };

    // Customers see only their payments
    if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.userId;
    }

    const result = await premiumService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get overdue payments (Admin/Agent)
router.get('/overdue', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const payments = await premiumService.getOverduePayments();
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get collection summary (Admin/Agent)
router.get('/summary', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await premiumService.getCollectionSummary(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my payments (customer)
router.get('/my', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Not a customer' });
      return;
    }
    const payments = await premiumService.getByCustomer(req.user.userId);
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await premiumService.getById(req.params.id as string);
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Record payment (Admin/Agent)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'AGENT'),
  validate([
    body('policyId').notEmpty(),
    body('amount').isNumeric(),
    body('paymentDate').isISO8601(),
    body('dueDate').isISO8601(),
    body('paymentMethod').isIn(['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'ONLINE']),
  ]),
  async (req: any, res) => {
    try {
      const payment = await premiumService.create(req.body, req.user.userId);
      res.status(201).json({ success: true, data: payment });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update payment status (Admin/Agent)
router.patch('/:id/status', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const { status } = req.body;
    const payment = await premiumService.updateStatus(req.params.id, status, req.user.userId);
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
