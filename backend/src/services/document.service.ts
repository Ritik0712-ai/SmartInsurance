import prisma from '../config/prisma.js';
import supabaseAdmin from '../config/supabase.js';
import { Prisma } from '@prisma/client';

interface DocumentFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customerId?: string;
  documentType?: string;
}

interface UploadDocumentData {
  customerId: string;
  documentType: 'ID_PROOF' | 'ADDRESS_PROOF' | 'MEDICAL_REPORT' | 'CLAIM_DOCUMENT' | 'POLICY_DOCUMENT' | 'PHOTO' | 'SIGNATURE' | 'OTHER';
  description?: string;
  uploadedById: string;
}

export const documentService = {
  async upload(data: UploadDocumentData, file: Express.Multer.File) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new Error('Customer not found');

    // Upload to Supabase Storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `documents/${data.customerId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('insurance-documents')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('insurance-documents')
      .getPublicUrl(storagePath);

    // Save to database
    const document = await prisma.document.create({
      data: {
        customerId: data.customerId,
        fileName,
        originalName: file.originalname,
        fileType: fileExt || 'unknown',
        fileSize: file.size,
        mimeType: file.mimetype,
        url: urlData.publicUrl,
        storagePath,
        documentType: data.documentType,
        description: data.description,
        uploadedById: data.uploadedById,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: data.uploadedById,
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        description: `Document ${file.originalname} uploaded`,
      },
    });

    return document;
  },

  async getAll(filters: DocumentFilters) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      customerId,
      documentType,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      ...(customerId && { customerId }),
      ...(documentType && { documentType: documentType as any }),
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async getById(id: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        customer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!document) throw new Error('Document not found');
    return document;
  },

  async getByCustomer(customerId: string) {
    const documents = await prisma.document.findMany({
      where: { customerId },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  },

  async delete(id: string, deletedById: string) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new Error('Document not found');

    // Delete from Supabase Storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('insurance-documents')
      .remove([document.storagePath]);

    if (deleteError) {
      console.error('Failed to delete file from storage:', deleteError);
    }

    // Delete from database
    await prisma.document.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Document',
        entityId: id,
        description: `Document ${document.originalName} deleted`,
      },
    });

    return { message: 'Document deleted successfully' };
  },

  async verify(id: string, verifiedById: string) {
    const document = await prisma.document.update({
      where: { id },
      data: { isVerified: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: verifiedById,
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        description: `Document ${document.originalName} verified`,
      },
    });

    return document;
  },

  async getDownloadUrl(id: string) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new Error('Document not found');

    const result = await supabaseAdmin.storage
      .from('insurance-documents')
      .createSignedUrl(document.storagePath, 3600);

    const data = result.data;
    return { url: data?.signedUrl, expiresIn: 3600 };
  },
};
