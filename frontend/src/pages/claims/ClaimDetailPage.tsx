import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { ArrowLeft, Download } from 'lucide-react';
import { pdfService } from '@/services/pdfService';

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => claimApi.getById(id!).then((res) => res.data.data),
    enabled: !!id,
  });

  const handleDownloadPDF = () => {
    if (claim) {
      const doc = pdfService.generateClaimPDF(claim, claim.policy);
      pdfService.downloadPDF(doc, `Claim-${claim.claimNumber}`);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!claim) return <div>Claim not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild><Link to="/claims"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
          <div>
            <h1 className="text-2xl font-bold">{claim.claimNumber}</h1>
            <Badge className={getStatusColor(claim.status)}>{claim.status}</Badge>
          </div>
        </div>
        <Button onClick={handleDownloadPDF}><Download className="h-4 w-4 mr-2" />Download PDF</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Claim Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Claim Type</p>
              <p className="font-medium">{claim.claimType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Claim Amount</p>
              <p className="font-medium">{formatCurrency(Number(claim.claimAmount))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incident Date</p>
              <p className="font-medium">{claim.incidentDate ? formatDate(claim.incidentDate) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted On</p>
              <p className="font-medium">{formatDate(claim.submittedAt)}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Reason</p>
            <p>{claim.claimReason}</p>
          </div>
          {claim.approvedAmount && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="font-medium text-green-600">{formatCurrency(Number(claim.approvedAmount))}</p>
              </div>
            </>
          )}
          {claim.reviewNotes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Review Notes</p>
                <p>{claim.reviewNotes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Policy Information</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{claim.policy?.policyNumber}</p>
              <p className="text-sm text-muted-foreground">{claim.policy?.policyType}</p>
            </div>
            <Button variant="outline" asChild><Link to={`/policies/${claim.policyId}`}>View Policy</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
