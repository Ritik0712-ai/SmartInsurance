import { Router } from 'express';
import { claimService } from '../services/claim.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters: any = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };
    if (req.query.status) filters.status = req.query.status;

    // For CUSTOMER role, get their customerId and filter claims
    if (req.user.role === 'CUSTOMER') {
      const { getCustomerIdFromUserId } = await import('../utils/helpers.js');
      const customerId = await getCustomerIdFromUserId(req.user.userId);
      if (!customerId) {
        res.status(404).json({ success: false, error: 'Customer profile not found' });
        return;
      }
      filters.customerId = customerId;
    }

    const result = await claimService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const claim = await claimService.getById(req.params.id);
    res.json({ success: true, data: claim });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req: any, res) => {
  try {
    const claim = await claimService.create(req.body, req.user.userId);
    res.json({ success: true, data: claim });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id/status', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const claim = await claimService.updateStatus(req.params.id, req.user.userId, req.body.status, req.body.reviewNotes, req.body.approvedAmount);
    res.json({ success: true, data: claim });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
