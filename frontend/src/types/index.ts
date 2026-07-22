export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    createdAt: string;
  };
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  occupation?: string;
  annualIncome?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  agentNotes?: string;
  createdAt: string;
}

export interface Policy {
  id: string;
  customerId: string;
  customer: Customer;
  policyNumber: string;
  policyType: string;
  sumAssured: number;
  premiumAmount: number;
  premiumFrequency: string;
  startDate: string;
  endDate: string;
  tenureYears: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'PENDING' | 'RENEWED';
  description?: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  policyId: string;
  policy: Policy;
  claimNumber: string;
  claimType: string;
  claimAmount: number;
  claimReason: string;
  incidentDate?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  reviewedById?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  approvedAmount?: number;
  settledAt?: string;
  submittedAt: string;
}

export interface PremiumPayment {
  id: string;
  policyId: string;
  policy: Policy;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  dueDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'ONLINE';
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED' | 'REFUNDED';
  transactionRef?: string;
  remarks?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  customerId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  url: string;
  storagePath: string;
  documentType: 'ID_PROOF' | 'ADDRESS_PROOF' | 'MEDICAL_REPORT' | 'CLAIM_DOCUMENT' | 'POLICY_DOCUMENT' | 'PHOTO' | 'SIGNATURE' | 'OTHER';
  description?: string;
  isVerified: boolean;
  uploadedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activePolicies: number;
  pendingClaims: number;
  overduePayments: number;
}
