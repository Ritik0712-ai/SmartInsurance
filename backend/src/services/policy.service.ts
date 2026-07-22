import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface PolicyFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customerId?: string;
  status?: string;
  issuedById?: string;
}

interface CreatePolicyData {
  customerId: string;
  policyType: string;
  sumAssured: Prisma.Decimal;
  premiumAmount: Prisma.Decimal;
  premiumFrequency?: string;
  startDate: Date;
  endDate: Date;
  tenureYears: number;
  description?: string;
  issuedById: string;
}

function generatePolicyNumber(): string {
  const prefix = 'POL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const policyService = {
  async getAll(filters: PolicyFilters) {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      customerId,
      status,
      issuedById,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.PolicyWhereInput = {
      ...(customerId && { customerId }),
      ...(status && { status: status as any }),
      ...(issuedById && { issuedById }),
      ...(search && {
        OR: [
          { policyNumber: { contains: search, mode: 'insensitive' } },
          { policyType: { contains: search, mode: 'insensitive' } },
          { customer: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
          { customer: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        include: {
          customer: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          _count: {
            select: { claims: true, premiumPayments: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.policy.count({ where }),
    ]);

    return {
      data: policies,
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
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        claims: {
          orderBy: { submittedAt: 'desc' },
        },
        premiumPayments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!policy) throw new Error('Policy not found');
    return policy;
  },

  async create(data: CreatePolicyData) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new Error('Customer not found');

    const policyNumber = generatePolicyNumber();

    const policy = await prisma.policy.create({
      data: {
        customerId: data.customerId,
        policyNumber,
        policyType: data.policyType,
        sumAssured: data.sumAssured,
        premiumAmount: data.premiumAmount,
        premiumFrequency: data.premiumFrequency || 'ANNUAL',
        startDate: data.startDate,
        endDate: data.endDate,
        tenureYears: data.tenureYears,
        status: 'ACTIVE',
        description: data.description,
        issuedById: data.issuedById,
      },
      include: {
        customer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: data.issuedById,
        action: 'CREATE',
        entityType: 'Policy',
        entityId: policy.id,
        description: `Policy ${policyNumber} created`,
      },
    });

    return policy;
  },

  async update(id: string, data: Partial<CreatePolicyData>, updatedById: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error('Policy not found');

    const policy = await prisma.policy.update({
      where: { id },
      data: {
        policyType: data.policyType,
        sumAssured: data.sumAssured,
        premiumAmount: data.premiumAmount,
        premiumFrequency: data.premiumFrequency,
        startDate: data.startDate,
        endDate: data.endDate,
        tenureYears: data.tenureYears,
        description: data.description,
      },
      include: {
        customer: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Policy',
        entityId: id,
        description: `Policy ${policy.policyNumber} updated`,
      },
    });

    return policy;
  },

  async updateStatus(id: string, status: string, updatedById: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error('Policy not found');

    const policy = await prisma.policy.update({
      where: { id },
      data: { status: status as any },
      include: {
        customer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Policy',
        entityId: id,
        description: `Policy ${policy.policyNumber} status changed to ${status}`,
      },
    });

    return policy;
  },

  async renew(id: string, newEndDate: Date, newTenure: number, renewedById: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error('Policy not found');

    const newStartDate = existing.endDate;
    const policy = await prisma.policy.update({
      where: { id },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
        tenureYears: newTenure,
        status: 'RENEWED',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: renewedById,
        action: 'UPDATE',
        entityType: 'Policy',
        entityId: id,
        description: `Policy ${policy.policyNumber} renewed`,
      },
    });

    return policy;
  },

  async cancel(id: string, cancelledById: string, reason?: string) {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error('Policy not found');

    const policy = await prisma.policy.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: cancelledById,
        action: 'UPDATE',
        entityType: 'Policy',
        entityId: id,
        description: `Policy ${policy.policyNumber} cancelled${reason ? `: ${reason}` : ''}`,
      },
    });

    return policy;
  },

  async getExpiringPolicies(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const policies = await prisma.policy.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        customer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return policies;
  },
};
