import { getSupabase } from '../config/database.js';
import { emailService } from './email.service.js';

interface CreateClaimData {
  policyId: string;
  claimType: string;
  claimAmount: number;
  claimReason: string;
  incidentDate?: string;
}

export const claimService = {
  async getAll(filters: any = {}) {
    const { page = 1, limit = 10, status, customerId } = filters;
    const supabase = getSupabase();

    let query = supabase
      .from('Claim')
      .select('*, policy:Policy(policyNumber, policyType, customer:Customer(id, user:User(firstName, lastName, email)))', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('policy.customerId', customerId);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('submittedAt', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1,
      },
    };
  },

  async getById(id: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('Claim')
      .select('*, policy:Policy(policyNumber, customer:Customer(user:User(firstName, lastName, email)))')
      .eq('id', id)
      .single();

    if (error) throw new Error('Claim not found');
    return data;
  },

  async create(data: CreateClaimData, submittedById: string) {
    const supabase = getSupabase();

    // Check policy exists and is active
    const { data: policy } = await supabase.from('Policy').select('id, status, policyNumber, customer:Customer(id, user:User(email, firstName, lastName))').eq('id', data.policyId).single();
    if (!policy) throw new Error('Policy not found');
    if (policy.status !== 'ACTIVE') throw new Error('Cannot file claim: Policy is not active');

    const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}`;

    const { data: claim, error } = await supabase
      .from('Claim')
      .insert({
        policyId: data.policyId,
        claimNumber,
        claimType: data.claimType,
        claimAmount: data.claimAmount,
        claimReason: data.claimReason,
        incidentDate: data.incidentDate || null,
        status: 'SUBMITTED',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from('AuditLog').insert({
      userId: submittedById,
      action: 'CREATE',
      entityType: 'Claim',
      entityId: claim.id,
      description: `Claim ${claimNumber} filed`,
    });

    // Send claim submitted email - handle customer.user as array or object
    const customerUser = (policy as any).customer?.user;
    const userEmail = Array.isArray(customerUser) ? customerUser[0]?.email : customerUser?.email;
    const userName = Array.isArray(customerUser)
      ? `${customerUser[0]?.firstName || ''} ${customerUser[0]?.lastName || ''}`.trim()
      : `${customerUser?.firstName || ''} ${customerUser?.lastName || ''}`.trim();

    if (userEmail) {
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

      emailService.sendClaimSubmittedEmail(
        userEmail,
        userName || 'Customer',
        {
          claimNumber,
          policyNumber: policy.policyNumber,
          claimAmount: formatCurrency(data.claimAmount),
        }
      ).catch(console.error);
    }

    return claim;
  },

  async updateStatus(id: string, status: string, reviewedById: string, reviewNotes?: string, approvedAmount?: number) {
    const supabase = getSupabase();

    const updateData: any = {
      status,
      reviewedById,
      reviewedAt: new Date().toISOString(),
    };
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount;
    if (status === 'APPROVED') updateData.settledAt = new Date().toISOString();

    const { data: claim, error } = await supabase
      .from('Claim')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from('AuditLog').insert({
      userId: reviewedById,
      action: 'UPDATE',
      entityType: 'Claim',
      entityId: id,
      description: `Claim ${claim.claimNumber} ${status.toLowerCase()}`,
    });

    // Send email notifications based on status
    const { data: claimWithPolicy } = await supabase
      .from('Claim')
      .select('*, policy:Policy(customer:Customer(user:User(email, firstName, lastName)))')
      .eq('id', id)
      .single();

    if (claimWithPolicy?.policy?.customer?.user) {
      const customer = claimWithPolicy.policy.customer.user;
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

      if (status === 'APPROVED') {
        emailService.sendClaimApprovedEmail(
          customer.email,
          `${customer.firstName} ${customer.lastName}`,
          {
            claimNumber: claim.claimNumber,
            claimAmount: formatCurrency(claim.claimAmount),
            approvedAmount: formatCurrency(approvedAmount || claim.claimAmount),
          }
        ).catch(console.error);
      } else if (status === 'REJECTED') {
        emailService.sendClaimRejectedEmail(
          customer.email,
          `${customer.firstName} ${customer.lastName}`,
          {
            claimNumber: claim.claimNumber,
            reason: reviewNotes || 'Your claim did not meet the policy requirements.',
          }
        ).catch(console.error);
      }
    }

    return claim;
  },

  async getByCustomer(customerId: string) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('Claim')
      .select('*, policy:Policy(policyNumber, policyType)')
      .eq('policy.customerId', customerId)
      .order('submittedAt', { ascending: false });

    return data || [];
  },
};
