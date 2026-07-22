import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { claimService } from '../services/claim.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Get all claims
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

    // Customers see only their claims
    if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.userId;
    }

    const result = await claimService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my claims (customer)
router.get('/my', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Not a customer' });
      return;
    }
    const claims = await claimService.getByCustomer(req.user.userId);
    res.json({ success: true, data: claims });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get claim by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const claim = await claimService.getById(req.params.id as string);
    res.json({ success: true, data: claim });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Submit claim
router.post(
  '/',
  authenticate,
  validate([
    body('policyId').notEmpty(),
    body('claimType').trim().notEmpty(),
    body('claimAmount').isNumeric(),
    body('claimReason').trim().notEmpty(),
    body('incidentDate').optional().isISO8601(),
  ]),
  async (req: any, res) => {
    try {
      const claim = await claimService.create(req.body, req.user.userId);
      res.status(201).json({ success: true, data: claim });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Review/Update claim status (Admin/Agent)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'AGENT'),
  validate([
    body('status').isIn(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED']),
    body('reviewNotes').optional().trim(),
    body('approvedAmount').optional().isNumeric(),
  ]),
  async (req: any, res) => {
    try {
      const { status, reviewNotes, approvedAmount } = req.body;
      const claim = await claimService.updateStatus(
        req.params.id,
        status,
        req.user.userId,
        reviewNotes,
        approvedAmount
      );
      res.json({ success: true, data: claim });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router;
