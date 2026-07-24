import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const POLICY_TYPES = [
  { id: 'LIFE', name: 'Life Insurance', icon: '🛡️' },
  { id: 'HEALTH', name: 'Health Insurance', icon: '🏥' },
  { id: 'VEHICLE', name: 'Vehicle Insurance', icon: '🚗' },
  { id: 'HOME', name: 'Home Insurance', icon: '🏠' },
  { id: 'TRAVEL', name: 'Travel Insurance', icon: '✈️' },
  { id: 'TERM', name: 'Term Insurance', icon: '📋' },
];

const OCCUPATIONS = [
  { id: 'OFFICE', name: 'Office Job' },
  { id: 'PROFESSIONAL', name: 'Professional' },
  { id: 'BUSINESS', name: 'Business Owner' },
  { id: 'LABOR', name: 'Manual Labor' },
  { id: 'RETIRED', name: 'Retired' },
  { id: 'STUDENT', name: 'Student' },
];

export default function PremiumCalculatorPage() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({
    sumAssured: '',
    tenureYears: '',
    age: '',
    occupation: '',
    gender: '',
    smokingStatus: '',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculatePremium = async () => {
    if (!selectedType || !formData.sumAssured || !formData.tenureYears || !formData.age) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/calculator/calculate`, {
        policyType: selectedType,
        sumAssured: parseFloat(formData.sumAssured),
        tenureYears: parseInt(formData.tenureYears),
        age: parseInt(formData.age),
        occupation: formData.occupation,
        gender: formData.gender,
        smokingStatus: formData.smokingStatus,
      });

      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate premium');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Premium Calculator</h1>
        <p className="text-muted-foreground">Calculate your insurance premium instantly</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Policy Type Selection */}
            <div className="space-y-2">
              <Label>Policy Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                {POLICY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedType === type.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span className="text-sm font-medium">{type.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sum Assured */}
            <div className="space-y-2">
              <Label htmlFor="sumAssured">Sum Assured (₹) *</Label>
              <Input
                id="sumAssured"
                name="sumAssured"
                type="number"
                placeholder="e.g., 5000000"
                value={formData.sumAssured}
                onChange={handleInputChange}
                min="50000"
                max="100000000"
              />
              <p className="text-xs text-muted-foreground">
                Min: ₹50,000 | Max: ₹10 Crore
              </p>
            </div>

            {/* Tenure */}
            <div className="space-y-2">
              <Label htmlFor="tenureYears">Policy Tenure (Years) *</Label>
              <Select
                value={formData.tenureYears}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, tenureYears: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenure" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40].map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year} {year === 1 ? 'Year' : 'Years'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Your Age *</Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="e.g., 30"
                value={formData.age}
                onChange={handleInputChange}
                min="18"
                max="75"
              />
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              {/* Occupation */}
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Select
                  value={formData.occupation}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, occupation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map((occ) => (
                      <SelectItem key={occ.id} value={occ.id}>
                        {occ.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Smoking Status */}
            <div className="space-y-2">
              <Label>Smoking Status</Label>
              <Select
                value={formData.smokingStatus}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, smokingStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO">Non-Smoker</SelectItem>
                  <SelectItem value="YES">Smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={calculatePremium}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Premium'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Premium Summary */}
              <Card className="border-primary/50">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Your Estimated Premium
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Annual Premium</p>
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(result.premium.annual)}
                    </p>
                    <p className="text-sm text-muted-foreground">per year</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Monthly</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.premium.monthly)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Quarterly</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.premium.quarterly)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Half-Yearly</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.premium.halfYearly)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">After Discount</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(result.premium.afterDiscount)}</p>
                    </div>
                  </div>

                  {result.calculation.tenureDiscount > 0 && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg">
                      <Badge className="bg-green-100 text-green-800">
                        {result.calculation.tenureDiscount * 100}% Tenure Discount
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Policy Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Coverage Amount</span>
                      <span className="font-semibold">{formatCurrency(result.summary.sumAssured)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Policy Type</span>
                      <span className="font-semibold">{result.summary.policyType}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Tenure</span>
                      <span className="font-semibold">{result.summary.tenureYears} Years</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Total Premium</span>
                      <span className="font-semibold">{formatCurrency(result.summary.totalPremiumOverTenure)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Est. Benefits</span>
                      <span className="font-semibold text-green-600">{formatCurrency(result.summary.totalBenefits)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Premium Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Rate per ₹1000</span>
                      <span>₹{result.calculation.baseRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Age Factor ({result.calculation.ageGroup})</span>
                      <span>×{result.calculation.ageFactor}</span>
                    </div>
                    {result.calculation.occupationFactor !== 1 && (
                      <div className="flex justify-between">
                        <span>Occupation Factor</span>
                        <span>×{result.calculation.occupationFactor}</span>
                      </div>
                    )}
                    {result.calculation.genderFactor !== 1 && (
                      <div className="flex justify-between">
                        <span>Gender Factor</span>
                        <span>×{result.calculation.genderFactor}</span>
                      </div>
                    )}
                    {result.calculation.smokingFactor !== 1 && (
                      <div className="flex justify-between">
                        <span>Smoking Factor</span>
                        <span>×{result.calculation.smokingFactor}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total Factor</span>
                      <span>×{result.calculation.totalFactor}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-amber-800">
                    <strong>Disclaimer:</strong> This calculator provides estimated premiums based on the information provided.
                    Actual premiums may vary based on medical examination, policy terms, and other factors.
                    Please contact our agents for accurate quotes.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Calculator className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Calculate Your Premium</h3>
                <p className="text-muted-foreground">
                  Fill in the form and click "Calculate Premium" to see your estimated insurance costs.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
