import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, FileText, Download, Upload, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const DOCUMENT_TYPES = [
  { value: 'ID_PROOF', label: 'ID Proof' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'MEDICAL_REPORT', label: 'Medical Report' },
  { value: 'CLAIM_DOCUMENT', label: 'Claim Document' },
  { value: 'POLICY_DOCUMENT', label: 'Policy Document' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'SIGNATURE', label: 'Signature' },
  { value: 'OTHER', label: 'Other' },
];

export default function DocumentListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('ID_PROOF');
  const [uploadDescription, setUploadDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page, typeFilter],
    queryFn: () => documentApi.getAll({ page, limit: 10, documentType: typeFilter || undefined }).then((res) => res.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return documentApi.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadDescription('');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => documentApi.verify(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const documents = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', uploadType);
    formData.append('description', uploadDescription);

    uploadMutation.mutate(formData);
  };

  const handleDownload = async (doc: any) => {
    try {
      const response = await documentApi.getDownloadUrl(doc.id);
      if (response.data.data.url) {
        window.open(response.data.data.url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const isAdminOrAgent = user?.role === 'ADMIN' || user?.role === 'AGENT';

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-muted-foreground">Manage uploaded documents</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="h-4 w-4 mr-2" />Upload Document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="p-1 hover:bg-gray-100 rounded">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to select a file</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, XLS (max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Add a description..." />
              </div>

              {uploadMutation.isError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Upload failed. Please try again.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search documents..." className="pl-10" />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
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
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No documents found</TableCell></TableRow>
                  ) : (
                    documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.fileName || 'Untitled'}</span>
                          </div>
                          {doc.description && <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>}
                        </TableCell>
                        <TableCell className="text-sm">{DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label || doc.documentType}</TableCell>
                        <TableCell className="text-sm">{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell className="text-sm">{formatDate(doc.uploadedAt)}</TableCell>
                        <TableCell>{getVerificationBadge(doc.verificationStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {doc.fileUrl && (
                              <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)} title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdminOrAgent && doc.verificationStatus === 'PENDING' && (
                              <Button variant="ghost" size="sm" onClick={() => verifyMutation.mutate({ id: doc.id, status: 'VERIFIED' })} title="Verify">
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {isAdminOrAgent && doc.verificationStatus === 'PENDING' && (
                              <Button variant="ghost" size="sm" onClick={() => verifyMutation.mutate({ id: doc.id, status: 'REJECTED' })} title="Reject">
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                            {(isAdminOrAgent || doc.uploadedById === user?.id) && (
                              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(doc.id)} title="Delete">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
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
