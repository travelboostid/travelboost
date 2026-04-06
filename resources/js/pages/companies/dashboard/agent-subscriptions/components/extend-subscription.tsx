'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ExtendSubscriptionProps {
  currentSubscription: {
    id: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    billingAmount: number;
    billingCycle: string;
  };
  onClose: () => void;
}

const extensionPeriods = [
  { id: '1month', label: '1 Month', months: 1, pricePerMonth: 9.99 },
  { id: '3months', label: '3 Months', months: 3, pricePerMonth: 9.99 },
  { id: '6months', label: '6 Months', months: 6, pricePerMonth: 8.99 },
  { id: '1year', label: '1 Year', months: 12, pricePerMonth: 8.33 },
];

export function ExtendSubscription({
  currentSubscription,
  onClose,
}: ExtendSubscriptionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1year');
  const [isProcessing, setIsProcessing] = useState(false);

  const selected = extensionPeriods.find((p) => p.id === selectedPeriod);
  const totalCost = selected ? selected.months * selected.pricePerMonth : 0;
  const savings =
    selected && selectedPeriod !== '1month'
      ? ((9.99 - selected.pricePerMonth) * selected.months).toFixed(2)
      : '0';

  const handleExtend = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Extend Your Subscription</CardTitle>
            <CardDescription>Choose your extension period</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Extension Period Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              Select Extension Period
            </p>
            <div className="grid gap-2">
              {extensionPeriods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`relative rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedPeriod === period.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {period.label}
                      </p>
                      <p className="text-sm text-slate-600">
                        ${(period.months * period.pricePerMonth).toFixed(2)}{' '}
                        total
                      </p>
                    </div>
                    {period.pricePerMonth < 9.99 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-emerald-100 text-emerald-700"
                      >
                        Save
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          {selected && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Duration</span>
                <span className="font-medium text-slate-900">
                  {selected.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Price per month</span>
                <span className="font-medium text-slate-900">
                  ${selected.pricePerMonth.toFixed(2)}
                </span>
              </div>
              {savings !== '0' && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Savings</span>
                  <span className="font-medium">-${savings}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-blue-600">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleExtend}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Processing...' : 'Extend Subscription'}
            </Button>
            <Button
              onClick={onClose}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 border-slate-200"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
