import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, FileText, Download, Upload, Check, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DocumentListPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page, typeFilter],
    queryFn: () => documentApi.getAll({ page, limit: 10, documentType: typeFilter }).then((res) => res.data.data),
  });

  const documents = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage uploaded documents</p>
        </div>
        <Button><Upload className="h-4 w-4 mr-2" />Upload Document</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="ID_PROOF">ID Proof</option>
              <option value="ADDRESS_PROOF">Address Proof</option>
              <option value="MEDICAL_REPORT">Medical Report</option>
              <option value="CLAIM_DOCUMENT">Claim Document</option>
              <option value="POLICY_DOCUMENT">Policy Document</option>
              <option value="PHOTO">Photo</option>
              <option value="SIGNATURE">Signature</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">No documents found</TableCell></TableRow>
                  ) : (
                    documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.originalName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{doc.documentType.replace('_', ' ')}</TableCell>
                        <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                        <TableCell>
                          <Badge className={doc.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {doc.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                            {!doc.isVerified && <Button variant="ghost" size="sm"><Check className="h-4 w-4" /></Button>}
                            <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
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
