import { Router } from 'express';
import { premiumService } from '../services/premium.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const filters: any = { page: 1, limit: 10 };
    if (req.query.page) filters.page = parseInt(req.query.page as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.status) filters.status = req.query.status;
    if (req.query.policyId) filters.policyId = req.query.policyId;
    const result = await premiumService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const payment = await premiumService.getById(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const payment = await premiumService.create(req.body);
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id/status', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const payment = await premiumService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
