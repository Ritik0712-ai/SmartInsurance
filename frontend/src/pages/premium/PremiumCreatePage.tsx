import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { premiumApi, policyApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function PremiumCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  const { data: policiesData } = useQuery({
    queryKey: ['policies-select'],
    queryFn: () => policyApi.getAll({ limit: 100, status: 'ACTIVE' }).then((res) => res.data.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => premiumApi.create(data),
    onSuccess: () => navigate('/premiums'),
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to record payment'),
  });

  const onSubmit = (data: any) => {
    setError('');
    createMutation.mutate({
      ...data,
      amount: parseFloat(data.amount),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild><Link to="/premiums"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
        <div>
          <h1 className="text-2xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">Record a new premium payment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <Card>
          <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount', { required: true })} />
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select onValueChange={(v) => setValue('paymentMethod', v)} defaultValue="ONLINE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input id="paymentDate" type="date" {...register('paymentDate', { required: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input id="dueDate" type="date" {...register('dueDate', { required: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference</Label>
              <Input id="transactionRef" {...register('transactionRef')} placeholder="e.g., UPI ID, Transaction ID" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input id="remarks" {...register('remarks')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate('/premiums')}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Recording...</> : 'Record Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
