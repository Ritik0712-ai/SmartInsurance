import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Briefcase,
  Users,
  FileText,
  Edit,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id!).then((res) => res.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {customer.user.firstName} {customer.user.lastName}
            </h1>
            <p className="text-muted-foreground">{customer.user.email}</p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{customer.gender || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marital Status</p>
                <p className="font-medium">{customer.maritalStatus || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupation</p>
                <p className="font-medium">{customer.occupation || '-'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Annual Income</p>
              <p className="font-medium">
                {customer.annualIncome ? formatCurrency(Number(customer.annualIncome)) : '-'}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Contact</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {customer.user.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.user.phone || '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address & Nominee */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {customer.addressLine1}
                {customer.addressLine2 && <>, {customer.addressLine2}</>}
              </p>
              <p className="text-sm">
                {customer.city}, {customer.state} - {customer.zipCode}
              </p>
              <p className="text-sm text-muted-foreground">{customer.country}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nominee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nominee Name</p>
                  <p className="font-medium">{customer.nomineeName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relationship</p>
                  <p className="font-medium">{customer.nomineeRelation || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Policies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policies ({customer.policies?.length || 0})
          </CardTitle>
          <Button size="sm" asChild>
            <Link to={`/policies/new?customerId=${customer.id}`}>New Policy</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customer.policies?.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customer.policies.map((policy: any) => (
                <Link
                  key={policy.id}
                  to={`/policies/${policy.id}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{policy.policyNumber}</span>
                    <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{policy.policyType}</p>
                  <p className="text-sm font-medium mt-2">
                    {formatCurrency(Number(policy.sumAssured))}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No policies found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
