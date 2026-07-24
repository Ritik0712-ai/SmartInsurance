import { getSupabase } from '../config/database.js';

// Email service - lazy loaded
let emailService: any = null;
try {
  emailService = require('./email.service.js');
} catch (e) {
  console.warn('Email service not available');
}

export const documentService = {
  async getAll(filters: any = {}) {
    const { page = 1, limit = 10, customerId, documentType } = filters;
    const supabase = getSupabase();

    let query = supabase
      .from('Document')
      .select('*', { count: 'exact' });

    if (customerId) query = query.eq('customerId', customerId);
    if (documentType) query = query.eq('documentType', documentType);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('uploadedAt', { ascending: false });

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
      .from('Document')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error('Document not found');
    return data;
  },

  async create(data: any) {
    const supabase = getSupabase();

    const { data: document, error } = await supabase
      .from('Document')
      .insert({
        customerId: data.customerId,
        documentType: data.documentType || 'OTHER',
        fileName: data.fileName || data.originalName || 'Untitled',
        originalName: data.originalName || data.fileName || 'Untitled',
        fileType: data.fileType || data.mimeType || 'application/octet-stream',
        fileSize: data.fileSize || 0,
        mimeType: data.mimeType || data.fileType || 'application/octet-stream',
        url: data.url || data.fileUrl || '',
        storagePath: data.storagePath || '',
        description: data.description || null,
        uploadedById: data.uploadedById,
        isVerified: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return document;
  },

  async updateVerificationStatus(id: string, status: 'VERIFIED' | 'REJECTED') {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('Document')
      .update({ isVerified: status === 'VERIFIED' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Send email notification if verified
    if (status === 'VERIFIED' && emailService?.sendDocumentVerifiedEmail) {
      const { data: docWithCustomer } = await supabase
        .from('Document')
        .select('*, customer:Customer(user:User(email, firstName, lastName))')
        .eq('id', id)
        .single();

      const customerUser = (docWithCustomer as any)?.customer?.user;
      const userEmail = Array.isArray(customerUser) ? customerUser[0]?.email : customerUser?.email;
      const userName = Array.isArray(customerUser)
        ? `${customerUser[0]?.firstName || ''} ${customerUser[0]?.lastName || ''}`.trim()
        : `${customerUser?.firstName || ''} ${customerUser?.lastName || ''}`.trim();

      if (userEmail) {
        const documentTypeName = docWithCustomer?.documentType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Document';

        emailService.sendDocumentVerifiedEmail(
          userEmail,
          userName || 'Customer',
          {
            documentType: documentTypeName,
            fileName: docWithCustomer?.originalName || docWithCustomer?.fileName || 'Document',
          }
        ).catch(console.error);
      }
    }

    return data;
  },

  async delete(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from('Document').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};
