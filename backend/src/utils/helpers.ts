import { getSupabase } from '../config/database.js';

/**
 * Get customerId from userId for CUSTOMER role users
 * Returns null if user is not a customer or customer record not found
 */
export async function getCustomerIdFromUserId(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('Customer')
    .select('id')
    .eq('userId', userId)
    .single();
  return data?.id || null;
}

/**
 * Get customerId for any user (handles all roles)
 * ADMIN/AGENT: returns the requested customerId
 * CUSTOMER: looks up their own customerId
 */
export async function resolveCustomerId(userId: string, userRole: string, requestedCustomerId?: string): Promise<string | null> {
  if (userRole === 'CUSTOMER') {
    return getCustomerIdFromUserId(userId);
  }
  // ADMIN and AGENT can access any customer
  return requestedCustomerId || null;
}

/**
 * Generate unique document number
 */
export function generateDocumentNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}

/**
 * Format currency in Indian format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate policy end date based on start date and tenure
 */
export function calculateEndDate(startDate: string, tenureYears: number): string {
  const start = new Date(startDate);
  start.setFullYear(start.getFullYear() + tenureYears);
  return start.toISOString().split('T')[0];
}

/**
 * Check if a policy is expiring within given days
 */
export function isPolicyExpiring(endDate: string, days: number): boolean {
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= days;
}

/**
 * Get status color class for badges
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Policy status
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    EXPIRED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    SUSPENDED: 'bg-orange-100 text-orange-800',
    RENEWED: 'bg-blue-100 text-blue-800',
    // Claim status
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    // Payment status
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    // Document status
    VERIFIED: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
