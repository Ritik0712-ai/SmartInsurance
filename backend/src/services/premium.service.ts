import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

interface PremiumFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  policyId?: string;
  customerId?: string;
  status?: string;
}

interface CreatePremiumData {
  policyId: string;
  amount: Prisma.Decimal;
  paymentDate: Date;
  dueDate: Date;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'ONLINE';
  transactionRef?: string;
  remarks?: string;
}

function generateReceiptNumber(): string {
  const prefix = 'RCP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const premiumService = {
  async getAll(filters: PremiumFilters) {
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

    const where: Prisma.PremiumPaymentWhereInput = {
      ...(policyId && { policyId }),
      ...(status && { status: status as any }),
      ...(customerId && { policy: { customerId } }),
      ...(search && {
        OR: [
          { receiptNumber: { contains: search, mode: 'insensitive' } },
          { transactionRef: { contains: search, mode: 'insensitive' } },
          { policy: { policyNumber: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [payments, total] = await Promise.all([
      prisma.premiumPayment.findMany({
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
      prisma.premiumPayment.count({ where }),
    ]);

    return {
      data: payments,
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
    const payment = await prisma.premiumPayment.findUnique({
      where: { id },
      include: {
        policy: {
          include: {
            customer: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
      },
    });

    if (!payment) throw new Error('Payment not found');
    return payment;
  },

  async create(data: CreatePremiumData, recordedById: string) {
    const policy = await prisma.policy.findUnique({ where: { id: data.policyId } });
    if (!policy) throw new Error('Policy not found');

    const receiptNumber = generateReceiptNumber();

    const payment = await prisma.premiumPayment.create({
      data: {
        policyId: data.policyId,
        receiptNumber,
        amount: data.amount,
        paymentDate: data.paymentDate,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef,
        remarks: data.remarks,
        status: 'PAID',
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
        userId: recordedById,
        action: 'CREATE',
        entityType: 'PremiumPayment',
        entityId: payment.id,
        description: `Premium payment ${receiptNumber} recorded`,
      },
    });

    return payment;
  },

  async updateStatus(id: string, status: string, updatedById: string) {
    const existing = await prisma.premiumPayment.findUnique({ where: { id } });
    if (!existing) throw new Error('Payment not found');

    const payment = await prisma.premiumPayment.update({
      where: { id },
      data: { status: status as any },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'PremiumPayment',
        entityId: id,
        description: `Payment ${payment.receiptNumber} status changed to ${status}`,
      },
    });

    return payment;
  },

  async getOverduePayments() {
    const today = new Date();
    const overdue = await prisma.premiumPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: today },
      },
      include: {
        policy: {
          include: {
            customer: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return overdue;
  },

  async getByPolicy(policyId: string) {
    const payments = await prisma.premiumPayment.findMany({
      where: { policyId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments;
  },

  async getByCustomer(customerId: string) {
    const payments = await prisma.premiumPayment.findMany({
      where: { policy: { customerId } },
      include: {
        policy: { select: { policyNumber: true, policyType: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments;
  },

  async getCollectionSummary(startDate?: Date, endDate?: Date) {
    const where: Prisma.PremiumPaymentWhereInput = {
      status: 'PAID',
      ...(startDate && { paymentDate: { gte: startDate } }),
      ...(endDate && { paymentDate: { lte: endDate } }),
    };

    const [payments, totalAmount] = await Promise.all([
      prisma.premiumPayment.findMany({
        where,
        select: { amount: true, paymentDate: true, paymentMethod: true },
      }),
      prisma.premiumPayment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalCollected: totalAmount._sum.amount || 0,
      totalTransactions: totalAmount._count,
      payments,
    };
  },
};
