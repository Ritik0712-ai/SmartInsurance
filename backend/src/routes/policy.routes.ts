import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { policyService } from '../services/policy.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all policies
router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters = {
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      customerId: req.query.customerId as string,
      status: req.query.status as string,
      issuedById: req.user.role === 'CUSTOMER' ? undefined : req.query.issuedById as string,
    };

    // Customers can only see their own policies
    if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.userId;
    }

    const result = await policyService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my policies (customer only)
router.get('/my', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Not a customer' });
      return;
    }

    const result = await policyService.getAll({
      customerId: req.user.userId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expiring policies (Admin/Agent)
router.get('/expiring', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const policies = await policyService.getExpiringPolicies(days);
    res.json({ success: true, data: policies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get policy by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const policy = await policyService.getById(req.params.id as string);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Create policy (Admin/Agent)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'AGENT'),
  validate([
    body('customerId').notEmpty(),
    body('policyType').trim().notEmpty(),
    body('sumAssured').isNumeric(),
    body('premiumAmount').isNumeric(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('tenureYears').isInt({ min: 1 }),
  ]),
  async (req: any, res) => {
    try {
      const policy = await policyService.create({
        ...req.body,
        sumAssured: req.body.sumAssured,
        premiumAmount: req.body.premiumAmount,
        issuedById: req.user.userId,
      });
      res.status(201).json({ success: true, data: policy });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update policy
router.put('/:id', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const policy = await policyService.update(req.params.id, req.body, req.user.userId);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update policy status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const { status } = req.body;
    const policy = await policyService.updateStatus(req.params.id, status, req.user.userId);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Renew policy
router.post('/:id/renew', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const { newEndDate, newTenure } = req.body;
    const policy = await policyService.renew(req.params.id, new Date(newEndDate), newTenure, req.user.userId);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Cancel policy
router.post('/:id/cancel', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const { reason } = req.body;
    const policy = await policyService.cancel(req.params.id, req.user.userId, reason);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
