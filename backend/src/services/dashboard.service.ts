import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export const dashboardService = {
  async getOverview() {
    const [
      totalCustomers,
      activePolicies,
      pendingClaims,
      overduePayments,
      recentPolicies,
      recentClaims,
    ] = await Promise.all([
      // Total customers
      prisma.customer.count(),

      // Active policies
      prisma.policy.count({ where: { status: 'ACTIVE' } }),

      // Pending claims
      prisma.claim.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),

      // Overdue payments
      prisma.premiumPayment.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),

      // Recent policies
      prisma.policy.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),

      // Recent claims
      prisma.claim.findMany({
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          policy: {
            include: {
              customer: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      }),
    ]);

    return {
      stats: {
        totalCustomers,
        activePolicies,
        pendingClaims,
        overduePayments,
      },
      recentPolicies,
      recentClaims,
    };
  },

  async getCustomerOverview(customerId: string) {
    const [
      policies,
      claims,
      documents,
      totalSumAssured,
      totalPremiumsPaid,
    ] = await Promise.all([
      prisma.policy.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.claim.findMany({
        where: { policy: { customerId } },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.document.findMany({
        where: { customerId },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.policy.aggregate({
        where: { customerId, status: 'ACTIVE' },
        _sum: { sumAssured: true },
      }),
      prisma.premiumPayment.aggregate({
        where: { policy: { customerId }, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    const activePolicies = policies.filter((p) => p.status === 'ACTIVE').length;
    const pendingClaims = claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;

    return {
      stats: {
        totalPolicies: policies.length,
        activePolicies,
        totalClaims: claims.length,
        pendingClaims,
        totalDocuments: documents.length,
        totalSumAssured: totalSumAssured._sum.sumAssured || 0,
        totalPremiumsPaid: totalPremiumsPaid._sum.amount || 0,
      },
      policies,
      claims,
      documents,
    };
  },

  async getRevenueData(startDate?: Date, endDate?: Date) {
    const where: Prisma.PremiumPaymentWhereInput = {
      status: 'PAID',
      ...(startDate && { paymentDate: { gte: startDate } }),
      ...(endDate && { paymentDate: { lte: endDate } }),
    };

    const payments = await prisma.premiumPayment.findMany({
      where,
      select: { amount: true, paymentDate: true },
      orderBy: { paymentDate: 'asc' },
    });

    // Group by month
    const monthlyData: Record<string, number> = {};
    payments.forEach((p) => {
      const month = p.paymentDate.toISOString().substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + Number(p.amount);
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  },

  async getPolicyDistribution() {
    const policies = await prisma.policy.groupBy({
      by: ['policyType'],
      _count: true,
      where: { status: 'ACTIVE' },
    });

    return policies.map((p) => ({
      type: p.policyType,
      count: p._count,
    }));
  },

  async getClaimStatistics() {
    const claims = await prisma.claim.groupBy({
      by: ['status'],
      _count: true,
    });

    return claims.map((c) => ({
      status: c.status,
      count: c._count,
    }));
  },

  async getExpiringPolicies(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.policy.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        customer: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
      orderBy: { endDate: 'asc' },
    });
  },
};
