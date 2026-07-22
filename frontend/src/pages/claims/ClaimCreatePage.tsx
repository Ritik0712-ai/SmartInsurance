import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { claimApi, policyApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ClaimCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  const { data: policiesData } = useQuery({
    queryKey: ['policies-select'],
    queryFn: () => policyApi.getAll({ limit: 100, status: 'ACTIVE' }).then((res) => res.data.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => claimApi.create(data),
    onSuccess: (res) => navigate(`/claims/${res.data.data.id}`),
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to submit claim'),
  });

  const onSubmit = (data: any) => {
    setError('');
    createMutation.mutate({
      ...data,
      claimAmount: parseFloat(data.claimAmount),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild><Link to="/claims"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
        <div>
          <h1 className="text-2xl font-bold">Submit New Claim</h1>
          <p className="text-muted-foreground">File an insurance claim</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <Card>
          <CardHeader><CardTitle>Claim Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Policy *</Label>
              <Select onValueChange={(v) => setValue('policyId', v)}>
                <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                <SelectContent>
                  {policiesData?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.policyNumber} - {p.policyType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.policyId && <p className="text-sm text-red-500">Policy is required</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Claim Type *</Label>
                <Select onValueChange={(v) => setValue('claimType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Death Claim">Death Claim</SelectItem>
                    <SelectItem value="Maturity Claim">Maturity Claim</SelectItem>
                    <SelectItem value="Medical Claim">Medical Claim</SelectItem>
                    <SelectItem value="Accident Claim">Accident Claim</SelectItem>
                    <SelectItem value="Partial Withdrawal">Partial Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimAmount">Claim Amount (₹) *</Label>
                <Input id="claimAmount" type="number" {...register('claimAmount', { required: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidentDate">Incident Date</Label>
                <Input id="incidentDate" type="date" {...register('incidentDate')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimReason">Reason / Description *</Label>
              <Input id="claimReason" {...register('claimReason', { required: true })} placeholder="Describe the reason for claim" />
              {errors.claimReason && <p className="text-sm text-red-500">Reason is required</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate('/claims')}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Claim'}
          </Button>
        </div>
      </form>
    </div>
  );
}
