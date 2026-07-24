import bcrypt from 'bcryptjs';
import { getSupabase } from '../config/database.js';

interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
  createdById?: string;
}

interface CreateCustomerData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  annualIncome?: number;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  agentNotes?: string;
  createdById: string;
}

export const customerService = {
  async getAll(filters: CustomerFilters) {
    const { page = 1, limit = 10, search = '', createdById } = filters;
    const supabase = getSupabase();

    let query = supabase.from('Customer').select('*, user:User(id, email, firstName, lastName, phone, role, createdAt), _count:policies(count)', { count: 'exact' });

    if (createdById) {
      query = query.eq('createdById', createdById);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

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

  async getByUserId(userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('Customer')
      .select('*, user:User(id, email, firstName, lastName, phone, role, createdAt), policies(*), documents(*)')
      .eq('userId', userId)
      .single();

    if (error) throw new Error('Customer not found');
    return data;
  },

  async getById(id: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('Customer')
      .select('*, user:User(id, email, firstName, lastName, phone, role, createdAt), policies(*), documents(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error('Customer not found');
    return data;
  },

  async create(data: CreateCustomerData) {
    const supabase = getSupabase();

    // Check if user exists
    const { data: existing } = await supabase.from('User').select('id').eq('email', data.email).single();
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: 'CUSTOMER',
        isActive: true,
      })
      .select()
      .single();

    if (userError) throw new Error(userError.message);

    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .insert({
        userId: user.id,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        occupation: data.occupation || null,
        annualIncome: data.annualIncome || null,
        addressLine1: data.addressLine1 || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        country: data.country || 'India',
        nomineeName: data.nomineeName || null,
        nomineeRelation: data.nomineeRelation || null,
        agentNotes: data.agentNotes || null,
        createdById: data.createdById,
      })
      .select()
      .single();

    if (customerError) throw new Error(customerError.message);

    // Audit log
    await supabase.from('AuditLog').insert({
      userId: data.createdById,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      description: 'Customer account created',
    });

    return { ...customer, user };
  },

  async update(id: string, data: Partial<CreateCustomerData>) {
    const supabase = getSupabase();

    const updateData: any = {};
    if (data.dateOfBirth) updateData.dateOfBirth = data.dateOfBirth;
    if (data.gender) updateData.gender = data.gender;
    if (data.maritalStatus) updateData.maritalStatus = data.maritalStatus;
    if (data.occupation) updateData.occupation = data.occupation;
    if (data.annualIncome !== undefined) updateData.annualIncome = data.annualIncome;
    if (data.addressLine1) updateData.addressLine1 = data.addressLine1;
    if (data.city) updateData.city = data.city;
    if (data.state) updateData.state = data.state;
    if (data.zipCode) updateData.zipCode = data.zipCode;
    if (data.country) updateData.country = data.country;
    if (data.nomineeName) updateData.nomineeName = data.nomineeName;
    if (data.nomineeRelation) updateData.nomineeRelation = data.nomineeRelation;
    if (data.agentNotes !== undefined) updateData.agentNotes = data.agentNotes;

    const { data: customer, error } = await supabase
      .from('Customer')
      .update(updateData)
      .eq('id', id)
      .select('*, user:User(id, email, firstName, lastName, phone, role)')
      .single();

    if (error) throw new Error(error.message);
    return customer;
  },

  async delete(id: string, deletedById: string) {
    const supabase = getSupabase();

    const { error } = await supabase.from('Customer').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await supabase.from('AuditLog').insert({
      userId: deletedById,
      action: 'DELETE',
      entityType: 'Customer',
      entityId: id,
      description: 'Customer deleted',
    });

    return { message: 'Customer deleted successfully' };
  },
};
