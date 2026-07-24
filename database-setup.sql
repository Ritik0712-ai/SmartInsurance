-- ============================================================
-- Insurance Management System - Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT', 'CUSTOMER');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PENDING', 'RENEWED');
CREATE TYPE "ClaimStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'ONLINE');
CREATE TYPE "DocumentType" AS ENUM ('ID_PROOF', 'ADDRESS_PROOF', 'MEDICAL_REPORT', 'CLAIM_DOCUMENT', 'POLICY_DOCUMENT', 'PHOTO', 'SIGNATURE', 'OTHER');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW');

-- ============================================================
-- TABLES
-- ============================================================

-- Users Table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" "Role" DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP
);

CREATE INDEX "User_email_idx" ON "User"(email);
CREATE INDEX "User_role_idx" ON "User"(role);

-- Customers Table
CREATE TABLE "Customer" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "maritalStatus" "MaritalStatus",
    "occupation" VARCHAR(100),
    "annualIncome" DECIMAL(15,2),
    "addressLine1" VARCHAR(255),
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "zipCode" VARCHAR(20),
    "country" VARCHAR(100) DEFAULT 'India',
    "nomineeName" VARCHAR(200),
    "nomineeRelation" VARCHAR(50),
    "agentNotes" TEXT,
    "createdById" UUID REFERENCES "User"(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Customer_userId_idx" ON "Customer"(userId);

-- Policies Table
CREATE TABLE "Policy" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE RESTRICT,
    "policyNumber" VARCHAR(50) UNIQUE NOT NULL,
    "policyType" VARCHAR(100) NOT NULL,
    "sumAssured" DECIMAL(15,2) NOT NULL,
    "premiumAmount" DECIMAL(15,2) NOT NULL,
    "premiumFrequency" VARCHAR(20) DEFAULT 'ANNUAL',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "tenureYears" INTEGER NOT NULL,
    "status" "PolicyStatus" DEFAULT 'PENDING',
    "description" TEXT,
    "issuedById" UUID REFERENCES "User"(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Policy_customerId_idx" ON "Policy"(customerId);
CREATE INDEX "Policy_policyNumber_idx" ON "Policy"(policyNumber);
CREATE INDEX "Policy_status_idx" ON "Policy"(status);

-- Claims Table
CREATE TABLE "Claim" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "policyId" UUID NOT NULL REFERENCES "Policy"(id) ON DELETE RESTRICT,
    "claimNumber" VARCHAR(50) UNIQUE NOT NULL,
    "claimType" VARCHAR(100) NOT NULL,
    "claimAmount" DECIMAL(15,2) NOT NULL,
    "claimReason" TEXT NOT NULL,
    "incidentDate" DATE,
    "status" "ClaimStatus" DEFAULT 'SUBMITTED',
    "reviewedById" UUID REFERENCES "User"(id),
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    "approvedAmount" DECIMAL(15,2),
    "settledAt" TIMESTAMP,
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Claim_policyId_idx" ON "Claim"(policyId);
CREATE INDEX "Claim_status_idx" ON "Claim"(status);

-- Premium Payments Table
CREATE TABLE "PremiumPayment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "policyId" UUID NOT NULL REFERENCES "Policy"(id) ON DELETE RESTRICT,
    "receiptNumber" VARCHAR(50) UNIQUE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" DEFAULT 'PENDING',
    "transactionRef" VARCHAR(100),
    "remarks" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "PremiumPayment_policyId_idx" ON "PremiumPayment"(policyId);
CREATE INDEX "PremiumPayment_status_idx" ON "PremiumPayment"(status);

-- Documents Table
CREATE TABLE "Document" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE RESTRICT,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(20) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "description" TEXT,
    "isVerified" BOOLEAN DEFAULT false,
    "uploadedById" UUID REFERENCES "User"(id),
    "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Document_customerId_idx" ON "Document"(customerId);
CREATE INDEX "Document_documentType_idx" ON "Document"(documentType);

-- Audit Logs Table
CREATE TABLE "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID,
    "description" TEXT,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"(userId);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin User (password: admin123)
INSERT INTO "User" ("id", "email", "password", "firstName", "lastName", "phone", "role") VALUES
('00000000-0000-0000-0000-000000000001',
 'admin@insurancemgmt.com',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYuN7sMYinm',
 'System',
 'Administrator',
 '+91-9876543210',
 'ADMIN');

-- Agent User (password: agent123)
INSERT INTO "User" ("id", "email", "password", "firstName", "lastName", "phone", "role") VALUES
('00000000-0000-0000-0000-000000000002',
 'agent@insurancemgmt.com',
 '$2a$12$KIXWRz3n8VJDv5z9gLQZZOQhV6h3Z0YH3L6p7c0eH5yR8bKfWqVuS',
 'John',
 'Agent',
 '+91-9876543211',
 'AGENT');

-- Customer User (password: customer123)
INSERT INTO "User" ("id", "email", "password", "firstName", "lastName", "phone", "role") VALUES
('00000000-0000-0000-0000-000000000003',
 'rahul.sharma@email.com',
 '$2a$12$HvZL5vKqJ9fLY7z8gMQZZOQhV6h3Z0YH3L6p7c0eH5yR8bKfWqVuS',
 'Rahul',
 'Sharma',
 '+91-9988776655',
 'CUSTOMER');

-- Customer Profile
INSERT INTO "Customer" ("id", "userId", "dateOfBirth", "gender", "maritalStatus", "occupation", "annualIncome", "addressLine1", "city", "state", "zipCode", "nomineeName", "nomineeRelation", "createdById") VALUES
('00000000-0000-0000-0000-000000000010',
 '00000000-0000-0000-0000-000000000003',
 '1990-05-15',
 'MALE',
 'MARRIED',
 'Software Engineer',
 1200000.00,
 '123 Tech Park, Sector 62',
 'Noida',
 'Uttar Pradesh',
 '201301',
 'Priya Sharma',
 'Spouse',
 '00000000-0000-0000-0000-000000000002');

-- Sample Policy
INSERT INTO "Policy" ("id", "customerId", "policyNumber", "policyType", "sumAssured", "premiumAmount", "premiumFrequency", "startDate", "endDate", "tenureYears", "status", "description", "issuedById") VALUES
('00000000-0000-0000-0000-000000000020',
 '00000000-0000-0000-0000-000000000010',
 'POL-LIFE-2024-001',
 'Life Insurance',
 5000000.00,
 50000.00,
 'ANNUAL',
 '2024-01-15',
 '2034-01-14',
 10,
 'ACTIVE',
 'Standard life insurance policy with accidental death benefit',
 '00000000-0000-0000-0000-000000000002');

-- Sample Premium Payment
INSERT INTO "PremiumPayment" ("id", "policyId", "receiptNumber", "amount", "paymentDate", "dueDate", "paymentMethod", "status") VALUES
('00000000-0000-0000-0000-000000000030',
 '00000000-0000-0000-0000-000000000020',
 'RCP-2024-001',
 50000.00,
 '2024-01-15',
 '2024-01-15',
 'ONLINE',
 'PAID');

-- Sample Claim
INSERT INTO "Claim" ("id", "policyId", "claimNumber", "claimType", "claimAmount", "claimReason", "incidentDate", "status", "submittedAt") VALUES
('00000000-0000-0000-0000-000000000040',
 '00000000-0000-0000-0000-000000000020',
 'CLM-2024-001',
 'Medical',
 150000.00,
 'Hospitalization due to illness',
 '2024-06-01',
 'SUBMITTED',
 '2024-06-05');

-- ============================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Policy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Claim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PremiumPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Policy for Users
CREATE POLICY "Users are viewable by authenticated users" ON "User" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON "User" FOR UPDATE USING (auth.uid() = id);

-- Policy for Customers
CREATE POLICY "Customers are viewable by authenticated users" ON "Customer" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Customers can be created by agents/admins" ON "Customer" FOR INSERT WITH CHECK (auth.role() IN ('authenticated'));

-- Policy for Policies
CREATE POLICY "Policies are viewable by authenticated users" ON "Policy" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Policies can be created by agents/admins" ON "Policy" FOR INSERT WITH CHECK (auth.role() IN ('authenticated'));

-- Policy for Claims
CREATE POLICY "Claims are viewable by authenticated users" ON "Claim" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Claims can be created by authenticated users" ON "Claim" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for PremiumPayments
CREATE POLICY "PremiumPayments are viewable by authenticated users" ON "PremiumPayment" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "PremiumPayments can be created by agents/admins" ON "PremiumPayment" FOR INSERT WITH CHECK (auth.role() IN ('authenticated'));

-- Policy for Documents
CREATE POLICY "Documents are viewable by authenticated users" ON "Document" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Documents can be uploaded by authenticated users" ON "Document" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for AuditLogs
CREATE POLICY "AuditLogs are viewable by admins" ON "AuditLog" FOR SELECT USING (auth.role() = 'admin');

-- ============================================================
-- COMPLETE!
-- ============================================================

SELECT 'Database setup complete!' AS status;
