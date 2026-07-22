import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { policyApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function PolicyListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['policies', page, debouncedSearch, statusFilter],
    queryFn: () =>
      policyApi.getAll({ page, limit: 10, search: debouncedSearch, status: statusFilter }).then((res) => res.data.data),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 500);
  };

  const policies = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const isAdminOrAgent = user?.role === 'ADMIN' || user?.role === 'AGENT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Policies</h1>
          <p className="text-muted-foreground">Manage insurance policies</p>
        </div>
        {isAdminOrAgent && (
          <Button asChild>
            <Link to="/policies/new">
              <Plus className="h-4 w-4 mr-2" />
              New Policy
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RENEWED">Renewed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sum Assured</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">No policies found</TableCell>
                    </TableRow>
                  ) : (
                    policies.map((policy: any) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                        <TableCell>{policy.customer.user.firstName} {policy.customer.user.lastName}</TableCell>
                        <TableCell>{policy.policyType}</TableCell>
                        <TableCell>{formatCurrency(Number(policy.sumAssured))}</TableCell>
                        <TableCell>{formatDate(policy.endDate)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/policies/${policy.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
