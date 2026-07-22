import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { claimApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function ClaimListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['claims', page, search, statusFilter],
    queryFn: () => claimApi.getAll({ page, limit: 10, search, status: statusFilter }).then((res) => res.data.data),
  });

  const claims = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const isAdminOrAgent = user?.role === 'ADMIN' || user?.role === 'AGENT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Claims</h1>
          <p className="text-muted-foreground">Manage insurance claims</p>
        </div>
        <Button asChild>
          <Link to="/claims/new"><Plus className="h-4 w-4 mr-2" />New Claim</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search claims..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim No.</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">No claims found</TableCell></TableRow>
                  ) : (
                    claims.map((claim: any) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>{claim.policy?.policyNumber}</TableCell>
                        <TableCell>{claim.claimType}</TableCell>
                        <TableCell>{formatCurrency(Number(claim.claimAmount))}</TableCell>
                        <TableCell>{formatDate(claim.submittedAt)}</TableCell>
                        <TableCell><Badge className={getStatusColor(claim.status)}>{claim.status}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild><Link to={`/claims/${claim.id}`}>View</Link></Button>
                        </TableCell>
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
