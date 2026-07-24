import { getSupabase } from '../config/database.js';

export const premiumService = {
  async getAll(filters: any = {}) {
    const { page = 1, limit = 10, status, policyId } = filters;
    const supabase = getSupabase();

    let query = supabase
      .from('PremiumPayment')
      .select('*, policy:Policy(policyNumber, policyType, customer:Customer(user:User(firstName, lastName)))', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (policyId) query = query.eq('policyId', policyId);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('paymentDate', { ascending: false });

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
      .from('PremiumPayment')
      .select('*, policy:Policy(policyNumber, customer:Customer(user:User(firstName, lastName))))')
      .eq('id', id)
      .single();

    if (error) throw new Error('Payment not found');
    return data;
  },

  async create(data: any) {
    const supabase = getSupabase();

    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

    const { data: payment, error } = await supabase
      .from('PremiumPayment')
      .insert({
        policyId: data.policyId,
        receiptNumber,
        amount: data.amount,
        paymentDate: data.paymentDate || new Date().toISOString(),
        dueDate: data.dueDate,
        status: 'PAID',
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef || null,
        remarks: data.remarks || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return payment;
  },

  async updateStatus(id: string, status: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('PremiumPayment')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
