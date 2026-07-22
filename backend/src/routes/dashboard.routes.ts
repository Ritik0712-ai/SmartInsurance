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
    const overview = await dashboardService.getCustomerOverview(req.user.userId);
    res.json({ success: true, data: overview });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get revenue data
router.get('/revenue', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.getRevenueData(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
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

// Get claim statistics
router.get('/claim-statistics', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const data = await dashboardService.getClaimStatistics();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expiring policies
router.get('/expiring-policies', authenticate, authorize('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const policies = await dashboardService.getExpiringPolicies(days);
    res.json({ success: true, data: policies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
