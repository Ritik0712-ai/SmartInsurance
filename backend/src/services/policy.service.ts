import { getSupabase } from '../config/database.js';
import { emailService } from './email.service.js';

interface PolicyFilters {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  issuedById?: string;
}

export const policyService = {
  async getAll(filters: PolicyFilters) {
    const { page = 1, limit = 10, search = '', status, customerId, issuedById } = filters;
    const supabase = getSupabase();

    let query = supabase
      .from('Policy')
      .select('*, customer:Customer(id, userId, user:User(firstName, lastName))', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customerId', customerId);
    if (issuedById) query = query.eq('issuedById', issuedById);
    if (search) {
      query = query.or(`policyNumber.ilike.%${search}%,policyType.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('createdAt', { ascending: false });

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
      .from('Policy')
      .select('*, customer:Customer(id, userId, user:User(firstName, lastName, email)), claims(*), premiumPayments(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error('Policy not found');
    return data;
  },

  async create(data: any, issuedById: string) {
    const supabase = getSupabase();

    const policyNumber = `POL-${Date.now().toString(36).toUpperCase()}`;

    const { data: policy, error } = await supabase
      .from('Policy')
      .insert({
        customerId: data.customerId,
        policyNumber,
        policyType: data.policyType,
        sumAssured: data.sumAssured,
        premiumAmount: data.premiumAmount,
        premiumFrequency: data.premiumFrequency || 'ANNUAL',
        startDate: data.startDate,
        endDate: data.endDate,
        tenureYears: data.tenureYears,
        status: data.status || 'PENDING',
        description: data.description || null,
        issuedById,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from('AuditLog').insert({
      userId: issuedById,
      action: 'CREATE',
      entityType: 'Policy',
      entityId: policy.id,
      description: `Policy ${policyNumber} created`,
    });

    // Send policy created email to customer
    const { data: customer } = await supabase
      .from('Customer')
      .select('*, user:User(email, firstName, lastName)')
      .eq('id', data.customerId)
      .single();

    if (customer?.user) {
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

      emailService.sendPolicyCreatedEmail(
        customer.user.email,
        `${customer.user.firstName} ${customer.user.lastName}`,
        {
          policyNumber,
          policyType: data.policyType,
          sumAssured: formatCurrency(data.sumAssured),
          premiumAmount: formatCurrency(data.premiumAmount),
          startDate: new Date(data.startDate).toLocaleDateString('en-IN'),
          endDate: new Date(data.endDate).toLocaleDateString('en-IN'),
        }
      ).catch(console.error);
    }

    return policy;
  },

  async update(id: string, data: any) {
    const supabase = getSupabase();
    const { data: policy, error } = await supabase
      .from('Policy')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return policy;
  },

  async updateStatus(id: string, status: string) {
    const supabase = getSupabase();
    const { data: policy, error } = await supabase
      .from('Policy')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return policy;
  },

  async renew(id: string, newEndDate: string, newTenure: number) {
    const supabase = getSupabase();
    const { data: policy, error } = await supabase
      .from('Policy')
      .update({ endDate: newEndDate, tenureYears: newTenure, status: 'RENEWED' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return policy;
  },

  async cancel(id: string, reason?: string) {
    const supabase = getSupabase();
    const { data: policy, error } = await supabase
      .from('Policy')
      .update({ status: 'CANCELLED', description: reason || 'Cancelled by user' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return policy;
  },
};
