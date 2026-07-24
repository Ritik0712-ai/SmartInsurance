import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Get dashboard overview (Admin/Agent)
router.get('/', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const overview = await dashboardService.getOverview();
    res.json({ success: true, data: overview });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer dashboard
router.get('/customer', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Not a customer' });
      return;
    }
    // Convert userId to customerId
    const { getCustomerIdFromUserId } = await import('../utils/helpers.js');
    const customerId = await getCustomerIdFromUserId(req.user.userId);
    if (!customerId) {
      res.status(404).json({ success: false, error: 'Customer profile not found' });
      return;
    }
    const overview = await dashboardService.getCustomerOverview(customerId);
    res.json({ success: true, data: overview });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get revenue data
router.get('/revenue', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const data = await dashboardService.getRevenueData();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get policy distribution
router.get('/policy-distribution', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const data = await dashboardService.getPolicyDistribution();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get claims trend
router.get('/claims-trend', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const data = await dashboardService.getClaimsTrend();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
