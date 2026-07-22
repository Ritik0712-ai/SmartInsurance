import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

interface ClaimFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  policyId?: string;
  customerId?: string;
  status?: string;
}

interface CreateClaimData {
  policyId: string;
  claimType: string;
  claimAmount: Prisma.Decimal;
  claimReason: string;
  incidentDate?: Date;
}

function generateClaimNumber(): string {
  const prefix = 'CLM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const claimService = {
  async getAll(filters: ClaimFilters) {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      policyId,
      customerId,
      status,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ClaimWhereInput = {
      ...(policyId && { policyId }),
      ...(status && { status: status as any }),
      ...(customerId && { policy: { customerId } }),
      ...(search && {
        OR: [
          { claimNumber: { contains: search, mode: 'insensitive' } },
          { claimType: { contains: search, mode: 'insensitive' } },
          { claimReason: { contains: search, mode: 'insensitive' } },
          { policy: { policyNumber: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: {
          policy: {
            include: {
              customer: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.claim.count({ where }),
    ]);

    return {
      data: claims,
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
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        policy: {
          include: {
            customer: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!claim) throw new Error('Claim not found');
    return claim;
  },

  async create(data: CreateClaimData, submittedById: string) {
    const policy = await prisma.policy.findUnique({
      where: { id: data.policyId },
      include: { customer: true },
    });

    if (!policy) throw new Error('Policy not found');
    if (policy.status !== 'ACTIVE') {
      throw new Error('Cannot file claim: Policy is not active');
    }

    const claimNumber = generateClaimNumber();

    const claim = await prisma.claim.create({
      data: {
        policyId: data.policyId,
        claimNumber,
        claimType: data.claimType,
        claimAmount: data.claimAmount,
        claimReason: data.claimReason,
        incidentDate: data.incidentDate,
        status: 'SUBMITTED',
      },
      include: {
        policy: {
          include: {
            customer: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: submittedById,
        action: 'CREATE',
        entityType: 'Claim',
        entityId: claim.id,
        description: `Claim ${claimNumber} filed`,
      },
    });

    return claim;
  },

  async updateStatus(
    id: string,
    status: string,
    reviewedById: string,
    reviewNotes?: string,
    approvedAmount?: Prisma.Decimal
  ) {
    const existing = await prisma.claim.findUnique({ where: { id } });
    if (!existing) throw new Error('Claim not found');

    const claim = await prisma.claim.update({
      where: { id },
      data: {
        status: status as any,
        reviewedById,
        reviewedAt: new Date(),
        reviewNotes,
        approvedAmount,
        settledAt: status === 'APPROVED' ? new Date() : undefined,
      },
      include: {
        policy: {
          include: {
            customer: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: reviewedById,
        action: 'UPDATE',
        entityType: 'Claim',
        entityId: id,
        description: `Claim ${claim.claimNumber} ${status.toLowerCase()}${reviewNotes ? `: ${reviewNotes}` : ''}`,
      },
    });

    return claim;
  },

  async getByCustomer(customerId: string) {
    const claims = await prisma.claim.findMany({
      where: { policy: { customerId } },
      include: {
        policy: { select: { policyNumber: true, policyType: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return claims;
  },
};
