import { Router } from 'express';
import { getSupabase } from '../config/database.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Get comprehensive reports (Admin only)
router.get('/summary', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const supabase = getSupabase();

    // Get counts for different statuses
    const [
      customerCount,
      activePoliciesCount,
      totalPremiumCollected,
      pendingClaimsCount,
      approvedClaimsCount,
      rejectedClaimsCount,
      overduePaymentsCount,
    ] = await Promise.all([
      supabase.from('Customer').select('*', { count: 'exact', head: true }),
      supabase.from('Policy').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('PremiumPayment').select('amount').eq('status', 'PAID'),
      supabase.from('Claim').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED'),
      supabase.from('Claim').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
      supabase.from('Claim').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED'),
      supabase.from('PremiumPayment').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').lt('dueDate', new Date().toISOString()),
    ]);

    // Calculate total premium collected
    const totalPremium = totalPremiumCollected.data?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0;

    // Get policies by type
    const { data: policiesByType } = await supabase
      .from('Policy')
      .select('policyType');

    const policyTypeDistribution: Record<string, number> = {};
    policiesByType?.forEach((p: any) => {
      policyTypeDistribution[p.policyType] = (policyTypeDistribution[p.policyType] || 0) + 1;
    });

    // Get revenue by month
    const { data: monthlyRevenue } = await supabase
      .from('PremiumPayment')
      .select('amount, paymentDate')
      .eq('status', 'PAID')
      .order('paymentDate', { ascending: true });

    const revenueByMonth: Record<string, number> = {};
    monthlyRevenue?.forEach((p: any) => {
      const month = new Date(p.paymentDate).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(p.amount || 0);
    });

    // Get claims by status
    const { data: claimsByStatus } = await supabase
      .from('Claim')
      .select('status');

    const claimStatusDistribution: Record<string, number> = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      CLOSED: 0,
    };
    claimsByStatus?.forEach((c: any) => {
      claimStatusDistribution[c.status] = (claimStatusDistribution[c.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers: customerCount.count || 0,
          activePolicies: activePoliciesCount.count || 0,
          totalPremiumCollected: totalPremium,
          pendingClaims: pendingClaimsCount.count || 0,
          approvedClaims: approvedClaimsCount.count || 0,
          rejectedClaims: rejectedClaimsCount.count || 0,
          overduePayments: overduePaymentsCount.count || 0,
        },
        policyTypeDistribution,
        claimStatusDistribution,
        revenueByMonth: Object.entries(revenueByMonth).map(([month, amount]) => ({ month, amount })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent performance report
router.get('/agent-performance', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const supabase = getSupabase();

    // Get agents with their stats
    const { data: agents } = await supabase
      .from('User')
      .select('id, firstName, lastName, email')
      .eq('role', 'AGENT');

    const agentStats = await Promise.all(
      (agents || []).map(async (agent: any) => {
        const { count: customerCount } = await supabase
          .from('Customer')
          .select('*', { count: 'exact', head: true })
          .eq('createdById', agent.id);

        const { count: policyCount } = await supabase
          .from('Policy')
          .select('*', { count: 'exact', head: true })
          .eq('issuedById', agent.id);

        const { data: policies } = await supabase
          .from('Policy')
          .select('sumAssured')
          .eq('issuedById', agent.id);

        const totalSumAssured = policies?.reduce((sum: number, p: any) => sum + parseFloat(p.sumAssured || 0), 0) || 0;

        return {
          ...agent,
          customersCount: customerCount || 0,
          policiesCount: policyCount || 0,
          totalSumAssured,
        };
      })
    );

    res.json({
      success: true,
      data: agentStats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer analytics
router.get('/customer-analytics', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const supabase = getSupabase();

    // Get customers by occupation
    const { data: customersByOccupation } = await supabase
      .from('Customer')
      .select('occupation');

    const occupationDistribution: Record<string, number> = {};
    customersByOccupation?.forEach((c: any) => {
      const occ = c.occupation || 'Unknown';
      occupationDistribution[occ] = (occupationDistribution[occ] || 0) + 1;
    });

    // Get customers by income range
    const { data: customersByIncome } = await supabase
      .from('Customer')
      .select('annualIncome');

    const incomeRanges = {
      '0-5L': 0,
      '5-10L': 0,
      '10-20L': 0,
      '20-50L': 0,
      '50L+': 0,
    };

    customersByIncome?.forEach((c: any) => {
      const income = parseFloat(c.annualIncome) || 0;
      if (income <= 500000) incomeRanges['0-5L']++;
      else if (income <= 1000000) incomeRanges['5-10L']++;
      else if (income <= 2000000) incomeRanges['10-20L']++;
      else if (income <= 5000000) incomeRanges['20-50L']++;
      else incomeRanges['50L+']++;
    });

    // Get customers by state
    const { data: customersByState } = await supabase
      .from('Customer')
      .select('state');

    const stateDistribution: Record<string, number> = {};
    customersByState?.forEach((c: any) => {
      const state = c.state || 'Unknown';
      stateDistribution[state] = (stateDistribution[state] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        occupationDistribution,
        incomeRanges,
        stateDistribution: Object.entries(stateDistribution).map(([state, count]) => ({ state, count })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export data as CSV
router.get('/export/:type', authenticate, authorize('ADMIN', 'AGENT'), async (req: any, res) => {
  try {
    const supabase = getSupabase();
    const { type } = req.params;

    let data: any[] = [];
    let csvHeaders = '';

    switch (type) {
      case 'customers':
        const { data: customers } = await supabase
          .from('Customer')
          .select('*, user:User(email, firstName, lastName, phone)');
        data = customers || [];
        csvHeaders = 'ID,Name,Email,Phone,Occupation,City,State,Created At';
        break;

      case 'policies':
        const { data: policies } = await supabase
          .from('Policy')
          .select('*, customer:Customer(user:User(firstName, lastName))');
        data = policies || [];
        csvHeaders = 'Policy Number,Customer,Type,Sum Assured,Premium,Status,Start Date,End Date';
        break;

      case 'claims':
        const { data: claims } = await supabase
          .from('Claim')
          .select('*, policy:Policy(policyNumber)');
        data = claims || [];
        csvHeaders = 'Claim Number,Policy,Amount,Status,Submitted Date,Reviewed Date';
        break;

      default:
        res.status(400).json({ success: false, error: 'Invalid export type' });
        return;
    }

    // Generate CSV
    let csv = csvHeaders + '\n';
    data.forEach((item: any) => {
      switch (type) {
        case 'customers':
          csv += `"${item.id}","${item.user?.firstName} ${item.user?.lastName}","${item.user?.email}","${item.user?.phone || ''}","${item.occupation || ''}","${item.city || ''}","${item.state || ''}","${item.createdAt}"\n`;
          break;
        case 'policies':
          csv += `"${item.policyNumber}","${item.customer?.user?.firstName} ${item.customer?.user?.lastName}","${item.policyType}","${item.sumAssured}","${item.premiumAmount}","${item.status}","${item.startDate}","${item.endDate}"\n`;
          break;
        case 'claims':
          csv += `"${item.claimNumber}","${item.policy?.policyNumber}","${item.claimAmount}","${item.status}","${item.submittedAt}","${item.reviewedAt || ''}"\n`;
          break;
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
