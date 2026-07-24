import { getSupabase } from '../config/database.js';

export const dashboardService = {
  async getOverview() {
    const supabase = getSupabase();

    const [customersResult, policiesResult, claimsResult, paymentsResult, recentPoliciesResult, recentClaimsResult] = await Promise.all([
      supabase.from('Customer').select('*', { count: 'exact', head: true }),
      supabase.from('Policy').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('Claim').select('*', { count: 'exact', head: true }).in('status', ['SUBMITTED', 'UNDER_REVIEW']),
      supabase.from('PremiumPayment').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').lt('dueDate', new Date().toISOString()),
      supabase.from('Policy').select('*, customer:Customer(id, userId, user:User(firstName, lastName))').order('createdAt', { ascending: false }).limit(5),
      supabase.from('Claim').select('*, policy:Policy(policyNumber, customer:Customer(user:User(firstName, lastName)))').order('submittedAt', { ascending: false }).limit(5),
    ]);

    return {
      stats: {
        totalCustomers: customersResult.count || 0,
        activePolicies: policiesResult.count || 0,
        pendingClaims: claimsResult.count || 0,
        overduePayments: paymentsResult.count || 0,
      },
      recentPolicies: recentPoliciesResult.data || [],
      recentClaims: recentClaimsResult.data || [],
    };
  },

  async getCustomerOverview(customerId: string) {
    const supabase = getSupabase();

    // Get customer details
    const { data: customer } = await supabase
      .from('Customer')
      .select('*, user:User(firstName, lastName, email, phone)')
      .eq('id', customerId)
      .single();

    // Get policies for this customer
    const { data: policies } = await supabase
      .from('Policy')
      .select('*')
      .eq('customerId', customerId)
      .order('createdAt', { ascending: false });

    // Get claims for policies belonging to this customer
    const policyIds = policies?.map((p: any) => p.id) || [];
    let claims: any[] = [];
    if (policyIds.length > 0) {
      const { data: claimData } = await supabase
        .from('Claim')
        .select('*, policy:Policy(policyNumber, policyType)')
        .in('policyId', policyIds)
        .order('submittedAt', { ascending: false });
      claims = claimData || [];
    }

    // Get documents for this customer
    const { data: documents } = await supabase
      .from('Document')
      .select('*')
      .eq('customerId', customerId)
      .order('uploadedAt', { ascending: false });

    // Get premium payments for policies
    let premiumPayments: any[] = [];
    if (policyIds.length > 0) {
      const { data: paymentData } = await supabase
        .from('PremiumPayment')
        .select('*')
        .in('policyId', policyIds)
        .order('paymentDate', { ascending: false });
      premiumPayments = paymentData || [];
    }

    // Calculate totals
    const totalSumAssured = policies?.reduce((sum: number, p: any) => sum + parseFloat(p.sumAssured || 0), 0) || 0;
    const totalPremiumsPaid = premiumPayments
      ?.filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0;
    const activePoliciesCount = policies?.filter((p: any) => p.status === 'ACTIVE').length || 0;
    const pendingClaimsCount = claims?.filter((c: any) => ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status)).length || 0;

    return {
      customer,
      policies: policies || [],
      claims: claims,
      documents: documents || [],
      premiumPayments,
      stats: {
        totalPolicies: policies?.length || 0,
        activePolicies: activePoliciesCount,
        totalSumAssured,
        totalPremiumsPaid,
        totalClaims: claims.length,
        pendingClaims: pendingClaimsCount,
      },
    };
  },

  async getRevenueData() {
    const supabase = getSupabase();
    const { data } = await supabase.from('PremiumPayment').select('amount, paymentDate').order('paymentDate', { ascending: false }).limit(30);
    return data || [];
  },

  async getPolicyDistribution() {
    const supabase = getSupabase();
    const { data } = await supabase.from('Policy').select('policyType, status');
    return data || [];
  },

  async getClaimsTrend() {
    const supabase = getSupabase();
    const { data } = await supabase.from('Claim').select('status, submittedAt').order('submittedAt', { ascending: false }).limit(30);
    return data || [];
  },
};
