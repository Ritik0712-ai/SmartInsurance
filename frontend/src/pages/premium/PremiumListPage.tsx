import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { premiumApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

export default function PremiumListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['premiums', page, search, statusFilter],
    queryFn: () => premiumApi.getAll({ page, limit: 10, search, status: statusFilter }).then((res) => res.data.data),
  });

  const { data: overdueData } = useQuery({
    queryKey: ['overduePremiums'],
    queryFn: () => premiumApi.getOverdue().then((res) => res.data.data),
  });

  const payments = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Premium Payments</h1>
          <p className="text-muted-foreground">Manage premium payments</p>
        </div>
        <Button asChild>
          <Link to="/premiums/new"><Plus className="h-4 w-4 mr-2" />Record Payment</Link>
        </Button>
      </div>

      {/* Overdue Alert */}
      {overdueData && overdueData.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">{overdueData.length} Overdue Payments</p>
              <p className="text-sm text-red-600">Total outstanding: {formatCurrency(overdueData.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search payments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">No payments found</TableCell></TableRow>
                  ) : (
                    payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                        <TableCell>{payment.policy?.policyNumber}</TableCell>
                        <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell><Badge className={getStatusColor(payment.status)}>{payment.status}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
