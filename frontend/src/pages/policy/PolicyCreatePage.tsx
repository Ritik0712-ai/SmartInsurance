import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm, UseFormRegister } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { policyApi, customerApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

interface PolicyFormData {
  customerId: string;
  policyType: string;
  sumAssured: string;
  premiumAmount: string;
  premiumFrequency: string;
  tenureYears: string;
  startDate: string;
  description: string;
}

export default function PolicyCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, watch } = useForm<PolicyFormData>({
    defaultValues: {
      customerId: preselectedCustomerId || "",
      policyType: "",
      sumAssured: "",
      premiumAmount: "",
      premiumFrequency: "ANNUAL",
      tenureYears: "",
      startDate: "",
      description: "",
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers-select"],
    queryFn: () => customerApi.getAll({ limit: 100 }).then((res) => res.data.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: PolicyFormData) => policyApi.create(data),
    onSuccess: (res) => navigate(`/policies/${res.data.data.id}`),
    onError: (err: any) => setError(err.response?.data?.error || "Failed to create policy"),
  });

  const onSubmit = (data: PolicyFormData) => {
    setError("");
    createMutation.mutate({
      ...data,
      sumAssured: data.sumAssured,
      premiumAmount: data.premiumAmount,
      tenureYears: data.tenureYears,
    });
  };

  const startDate = watch("startDate");
  const tenureYears = watch("tenureYears");

  const calculateEndDate = () => {
    if (startDate && tenureYears) {
      const date = new Date(startDate);
      date.setFullYear(date.getFullYear() + parseInt(tenureYears));
      return date.toISOString().split("T")[0];
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link to="/policies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Policy</h1>
          <p className="text-muted-foreground">Issue a new insurance policy</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Policy Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Customer *</Label>
              <Select
                onValueChange={(v) => setValue("customerId", v)}
                defaultValue={preselectedCustomerId || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customersData?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.user.firstName} {c.user.lastName} ({c.user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Policy Type *</Label>
              <Select onValueChange={(v) => setValue("policyType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                  <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                  <SelectItem value="Vehicle Insurance">Vehicle Insurance</SelectItem>
                  <SelectItem value="Property Insurance">Property Insurance</SelectItem>
                  <SelectItem value="Travel Insurance">Travel Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sumAssured">Sum Assured (INR) *</Label>
              <Input
                id="sumAssured"
                type="number"
                {...register("sumAssured", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="premiumAmount">Premium Amount (INR) *</Label>
              <Input
                id="premiumAmount"
                type="number"
                {...register("premiumAmount", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Premium Frequency *</Label>
              <Select
                onValueChange={(v) => setValue("premiumFrequency", v)}
                defaultValue="ANNUAL"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenureYears">Tenure (Years) *</Label>
              <Input
                id="tenureYears"
                type="number"
                min="1"
                {...register("tenureYears", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={calculateEndDate()} readOnly />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from start date and tenure
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate("/policies")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Policy"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
