import { Router } from 'express';
import { policyService } from '../services/policy.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters: any = { page: 1, limit: 10 };
    if (req.query.search) filters.search = req.query.search;
    if (req.query.page) filters.page = parseInt(req.query.page as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.status) filters.status = req.query.status;

    // For CUSTOMER role, convert userId to customerId
    if (req.user.role === 'CUSTOMER') {
      const { getCustomerIdFromUserId } = await import('../utils/helpers.js');
      const customerId = await getCustomerIdFromUserId(req.user.userId);
      if (!customerId) {
        res.status(404).json({ success: false, error: 'Customer profile not found' });
        return;
      }
      filters.customerId = customerId;
    }

    const result = await policyService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const policy = await policyService.getById(req.params.id);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const policy = await policyService.create(req.body, req.user.userId);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const policy = await policyService.update(req.params.id, req.body);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id/cancel', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const policy = await policyService.cancel(req.params.id, req.body.reason);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
