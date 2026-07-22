import { PrismaClient, Role, Gender, MaritalStatus, PolicyStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.premiumPayment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@insurancemgmt.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+91-9876543210',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create Agent
  const agentPassword = await bcrypt.hash('agent123', 12);
  const agent = await prisma.user.create({
    data: {
      email: 'agent@insurancemgmt.com',
      password: agentPassword,
      firstName: 'John',
      lastName: 'Agent',
      phone: '+91-9876543211',
      role: Role.AGENT,
    },
  });
  console.log('✅ Agent created:', agent.email);

  // Create Agent 2
  const agent2 = await prisma.user.create({
    data: {
      email: 'sarah.agent@insurancemgmt.com',
      password: agentPassword,
      firstName: 'Sarah',
      lastName: 'Smith',
      phone: '+91-9876543212',
      role: Role.AGENT,
    },
  });
  console.log('✅ Agent 2 created:', agent2.email);

  // Create Customers with their user accounts
  const customerPassword = await bcrypt.hash('customer123', 12);

  // Customer 1
  const user1 = await prisma.user.create({
    data: {
      email: 'rahul.sharma@email.com',
      password: customerPassword,
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '+91-9988776655',
      role: Role.CUSTOMER,
      customer: {
        create: {
          dateOfBirth: new Date('1985-06-15'),
          gender: Gender.MALE,
          maritalStatus: MaritalStatus.MARRIED,
          occupation: 'Software Engineer',
          annualIncome: 1200000,
          addressLine1: '42, Sector 17',
          addressLine2: 'Chandigarh',
          city: 'Chandigarh',
          state: 'Punjab',
          zipCode: '160017',
          nomineeName: 'Priya Sharma',
          nomineeRelation: 'Spouse',
          createdById: agent.id,
        },
      },
    },
    include: { customer: true },
  });

  // Customer 2
  const user2 = await prisma.user.create({
    data: {
      email: 'priya.patel@email.com',
      password: customerPassword,
      firstName: 'Priya',
      lastName: 'Patel',
      phone: '+91-8877665544',
      role: Role.CUSTOMER,
      customer: {
        create: {
          dateOfBirth: new Date('1990-03-22'),
          gender: Gender.FEMALE,
          maritalStatus: MaritalStatus.SINGLE,
          occupation: 'Doctor',
          annualIncome: 1800000,
          addressLine1: '15-A, MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          nomineeName: 'Dr. Amit Patel',
          nomineeRelation: 'Father',
          createdById: agent.id,
        },
      },
    },
    include: { customer: true },
  });

  // Customer 3
  const user3 = await prisma.user.create({
    data: {
      email: 'amit.kumar@email.com',
      password: customerPassword,
      firstName: 'Amit',
      lastName: 'Kumar',
      phone: '+91-7766554433',
      role: Role.CUSTOMER,
      customer: {
        create: {
          dateOfBirth: new Date('1978-11-08'),
          gender: Gender.MALE,
          maritalStatus: MaritalStatus.MARRIED,
          occupation: 'Business Owner',
          annualIncome: 2500000,
          addressLine1: 'Plot 89, Green Valley',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
          nomineeName: 'Sunita Kumar',
          nomineeRelation: 'Spouse',
          createdById: agent2.id,
        },
      },
    },
    include: { customer: true },
  });

  console.log('✅ 3 Customers created');

  // Create Policies
  const policies = await Promise.all([
    // Policy 1 - Active Life Insurance
    prisma.policy.create({
      data: {
        customerId: user1.customer!.id,
        policyNumber: 'POL-LIFE-001',
        policyType: 'Life Insurance',
        sumAssured: 5000000,
        premiumAmount: 50000,
        premiumFrequency: 'ANNUAL',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2034-01-14'),
        tenureYears: 10,
        status: PolicyStatus.ACTIVE,
        description: 'Term life insurance with death benefit',
        issuedById: agent.id,
      },
    }),
    // Policy 2 - Active Health Insurance
    prisma.policy.create({
      data: {
        customerId: user1.customer!.id,
        policyNumber: 'POL-HEALTH-001',
        policyType: 'Health Insurance',
        sumAssured: 1000000,
        premiumAmount: 25000,
        premiumFrequency: 'ANNUAL',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-31'),
        tenureYears: 1,
        status: PolicyStatus.ACTIVE,
        description: 'Comprehensive health coverage with family floater',
        issuedById: agent.id,
      },
    }),
    // Policy 3 - Health Insurance for Customer 2
    prisma.policy.create({
      data: {
        customerId: user2.customer!.id,
        policyNumber: 'POL-HEALTH-002',
        policyType: 'Health Insurance',
        sumAssured: 2000000,
        premiumAmount: 35000,
        premiumFrequency: 'ANNUAL',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-02-28'),
        tenureYears: 1,
        status: PolicyStatus.ACTIVE,
        description: 'Premium health insurance with global coverage',
        issuedById: agent.id,
      },
    }),
    // Policy 4 - Vehicle Insurance for Customer 3
    prisma.policy.create({
      data: {
        customerId: user3.customer!.id,
        policyNumber: 'POL-VEH-001',
        policyType: 'Vehicle Insurance',
        sumAssured: 800000,
        premiumAmount: 15000,
        premiumFrequency: 'ANNUAL',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-07-31'),
        tenureYears: 1,
        status: PolicyStatus.ACTIVE,
        description: 'Comprehensive vehicle insurance for luxury sedan',
        issuedById: agent2.id,
      },
    }),
    // Policy 5 - Life Insurance for Customer 3
    prisma.policy.create({
      data: {
        customerId: user3.customer!.id,
        policyNumber: 'POL-LIFE-002',
        policyType: 'Life Insurance',
        sumAssured: 10000000,
        premiumAmount: 100000,
        premiumFrequency: 'ANNUAL',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2028-12-31'),
        tenureYears: 5,
        status: PolicyStatus.ACTIVE,
        description: 'Money-back life insurance policy',
        issuedById: agent2.id,
      },
    }),
    // Policy 6 - Expired Policy (for testing expiry alerts)
    prisma.policy.create({
      data: {
        customerId: user2.customer!.id,
        policyNumber: 'POL-LIFE-003',
        policyType: 'Life Insurance',
        sumAssured: 2000000,
        premiumAmount: 20000,
        premiumFrequency: 'ANNUAL',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2025-01-01'),
        tenureYears: 5,
        status: PolicyStatus.EXPIRED,
        description: 'Previous term life insurance',
        issuedById: agent.id,
      },
    }),
  ]);

  console.log('✅ 6 Policies created');

  // Create Claims
  const claims = await Promise.all([
    prisma.claim.create({
      data: {
        policyId: policies[0].id,
        claimNumber: 'CLM-001',
        claimType: 'Death Claim',
        claimAmount: 5000000,
        claimReason: 'Natural death',
        incidentDate: new Date('2024-10-15'),
        status: 'UNDER_REVIEW',
        reviewedById: agent.id,
        reviewedAt: new Date('2024-10-20'),
        reviewNotes: 'Documentation under verification',
      },
    }),
    prisma.claim.create({
      data: {
        policyId: policies[1].id,
        claimNumber: 'CLM-002',
        claimType: 'Medical Claim',
        claimAmount: 150000,
        claimReason: 'Knee surgery and hospitalization',
        incidentDate: new Date('2024-09-10'),
        status: 'APPROVED',
        approvedAmount: 135000,
        reviewedById: agent.id,
        reviewedAt: new Date('2024-09-25'),
        reviewNotes: 'Approved with minor deduction for non-medical items',
        settledAt: new Date('2024-09-28'),
      },
    }),
    prisma.claim.create({
      data: {
        policyId: policies[2].id,
        claimNumber: 'CLM-003',
        claimType: 'Medical Claim',
        claimAmount: 80000,
        claimReason: 'Annual health checkup and treatment',
        incidentDate: new Date('2024-11-01'),
        status: 'SUBMITTED',
      },
    }),
  ]);

  console.log('✅ 3 Claims created');

  // Create Premium Payments
  const payments = await Promise.all([
    // Paid payments for Policy 1
    prisma.premiumPayment.create({
      data: {
        policyId: policies[0].id,
        receiptNumber: 'RCP-001',
        amount: 50000,
        paymentDate: new Date('2024-01-15'),
        dueDate: new Date('2024-01-15'),
        paymentMethod: PaymentMethod.ONLINE,
        transactionRef: 'TXN20240115001',
        status: PaymentStatus.PAID,
      },
    }),
    prisma.premiumPayment.create({
      data: {
        policyId: policies[0].id,
        receiptNumber: 'RCP-002',
        amount: 50000,
        paymentDate: new Date('2025-01-15'),
        dueDate: new Date('2025-01-15'),
        paymentMethod: PaymentMethod.UPI,
        transactionRef: 'UPI20250115002',
        status: PaymentStatus.PAID,
      },
    }),
    // Paid payments for Policy 2
    prisma.premiumPayment.create({
      data: {
        policyId: policies[1].id,
        receiptNumber: 'RCP-003',
        amount: 25000,
        paymentDate: new Date('2024-06-01'),
        dueDate: new Date('2024-06-01'),
        paymentMethod: PaymentMethod.CARD,
        transactionRef: 'CARD20240601003',
        status: PaymentStatus.PAID,
      },
    }),
    // Overdue payment (for testing)
    prisma.premiumPayment.create({
      data: {
        policyId: policies[1].id,
        receiptNumber: 'RCP-004',
        amount: 25000,
        paymentDate: new Date('2025-06-01'),
        dueDate: new Date('2025-06-01'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.OVERDUE,
      },
    }),
    // Pending payment for Policy 3
    prisma.premiumPayment.create({
      data: {
        policyId: policies[2].id,
        receiptNumber: 'RCP-005',
        amount: 35000,
        paymentDate: new Date('2025-03-01'),
        dueDate: new Date('2025-03-01'),
        paymentMethod: PaymentMethod.UPI,
        status: PaymentStatus.PENDING,
      },
    }),
  ]);

  console.log('✅ 5 Premium Payments created');

  // Create Documents
  await Promise.all([
    prisma.document.create({
      data: {
        customerId: user1.customer!.id,
        fileName: 'rahul_aadhar.pdf',
        originalName: 'Aadhar Card.pdf',
        fileType: 'pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        url: 'https://example.supabase.co/storage/v1/object/public/documents/rahul_aadhar.pdf',
        storagePath: 'documents/user1/rahul_aadhar.pdf',
        documentType: 'ID_PROOF',
        description: 'Government ID proof',
        isVerified: true,
        uploadedById: agent.id,
      },
    }),
    prisma.document.create({
      data: {
        customerId: user1.customer!.id,
        fileName: 'rahul_address.pdf',
        originalName: 'Address Proof.pdf',
        fileType: 'pdf',
        fileSize: 180000,
        mimeType: 'application/pdf',
        url: 'https://example.supabase.co/storage/v1/object/public/documents/rahul_address.pdf',
        storagePath: 'documents/user1/rahul_address.pdf',
        documentType: 'ADDRESS_PROOF',
        description: 'Utility bill as address proof',
        isVerified: true,
        uploadedById: agent.id,
      },
    }),
    prisma.document.create({
      data: {
        customerId: user2.customer!.id,
        fileName: 'priya_medical.pdf',
        originalName: 'Medical Report.pdf',
        fileType: 'pdf',
        fileSize: 520000,
        mimeType: 'application/pdf',
        url: 'https://example.supabase.co/storage/v1/object/public/documents/priya_medical.pdf',
        storagePath: 'documents/user2/priya_medical.pdf',
        documentType: 'MEDICAL_REPORT',
        description: 'Pre-policy medical examination report',
        isVerified: false,
        uploadedById: user2.id,
      },
    }),
  ]);

  console.log('✅ 3 Documents created');

  // Create Audit Logs
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: admin.id,
        description: 'Admin logged in',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: agent.id,
        action: 'CREATE',
        entityType: 'Customer',
        entityId: user1.customer!.id,
        description: 'Customer Rahul Sharma created',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: agent.id,
        action: 'CREATE',
        entityType: 'Policy',
        entityId: policies[0].id,
        description: 'Policy POL-LIFE-001 issued',
      },
    }),
  ]);

  console.log('✅ Audit logs created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Test credentials:');
  console.log('  Admin:    admin@insurancemgmt.com / admin123');
  console.log('  Agent:    agent@insurancemgmt.com / agent123');
  console.log('  Customer: rahul.sharma@email.com / customer123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
