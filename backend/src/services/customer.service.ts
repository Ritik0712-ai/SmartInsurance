import prisma from '../config/prisma.js';
import { Prisma, Role } from '@prisma/client';

interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  createdById?: string;
}

interface CreateCustomerData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  occupation?: string;
  annualIncome?: Prisma.Decimal;
  addressLine1?: string;
  addressLine2?: string;
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
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdById,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      ...(createdById && { createdById }),
      ...(search && {
        OR: [
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { city: { contains: search, mode: 'insensitive' } },
          { state: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: { policies: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
        policies: {
          include: {
            claims: true,
            premiumPayments: true,
          },
        },
        documents: true,
      },
    });

    if (!customer) throw new Error('Customer not found');
    return customer;
  },

  async create(data: CreateCustomerData) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already registered');

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(data.password, 12);

    const customer = await prisma.customer.create({
      data: {
        user: {
          create: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: 'CUSTOMER' as Role,
          },
        },
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        occupation: data.occupation,
        annualIncome: data.annualIncome,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || 'India',
        nomineeName: data.nomineeName,
        nomineeRelation: data.nomineeRelation,
        agentNotes: data.agentNotes,
        createdById: data.createdById,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: data.createdById,
        action: 'CREATE',
        entityType: 'Customer',
        entityId: customer.id,
        description: 'Customer account created',
      },
    });

    return customer;
  },

  async update(id: string, data: Partial<CreateCustomerData>) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new Error('Customer not found');

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        occupation: data.occupation,
        annualIncome: data.annualIncome,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        nomineeName: data.nomineeName,
        nomineeRelation: data.nomineeRelation,
        agentNotes: data.agentNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return customer;
  },

  async delete(id: string, deletedById: string) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new Error('Customer not found');

    await prisma.customer.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Customer',
        entityId: id,
        description: 'Customer deleted',
      },
    });

    return { message: 'Customer deleted successfully' };
  },
};
