import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { policyApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { ArrowLeft, FileText, Calendar, DollarSign, RefreshCw } from 'lucide-react';

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy', id],
    queryFn: () => policyApi.getById(id!).then((res) => res.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!policy) return <div>Policy not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild><Link to="/policies"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
          <div>
            <h1 className="text-2xl font-bold">{policy.policyNumber}</h1>
            <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Policy Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Policy Type</p>
                <p className="font-medium">{policy.policyType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sum Assured</p>
                <p className="font-medium">{formatCurrency(Number(policy.sumAssured))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium Amount</p>
                <p className="font-medium">{formatCurrency(Number(policy.premiumAmount))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium Frequency</p>
                <p className="font-medium">{policy.premiumFrequency}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{policy.description || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Tenure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(policy.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{formatDate(policy.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tenure</p>
                <p className="font-medium">{policy.tenureYears} Years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issued On</p>
                <p className="font-medium">{formatDate(policy.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{policy.customer.user.firstName} {policy.customer.user.lastName}</p>
              <p className="text-sm text-muted-foreground">{policy.customer.user.email}</p>
            </div>
            <Button variant="outline" asChild><Link to={`/customers/${policy.customer.id}`}>View Customer</Link></Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims */}
      <Card>
        <CardHeader><CardTitle>Claims ({policy.claims?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {policy.claims?.length > 0 ? (
            <div className="space-y-4">
              {policy.claims.map((claim: any) => (
                <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{claim.claimNumber}</p>
                    <p className="text-sm text-muted-foreground">{claim.claimType} - {formatCurrency(Number(claim.claimAmount))}</p>
                  </div>
                  <Badge className={getStatusColor(claim.status)}>{claim.status}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-muted-foreground py-4">No claims filed</p>}
        </CardContent>
      </Card>

      {/* Premium Payments */}
      <Card>
        <CardHeader><CardTitle>Premium Payments ({policy.premiumPayments?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {policy.premiumPayments?.length > 0 ? (
            <div className="space-y-4">
              {policy.premiumPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.receiptNumber}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                    <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-muted-foreground py-4">No payments recorded</p>}
        </CardContent>
      </Card>
    </div>
  );
}
