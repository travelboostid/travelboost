import { useCreateTopupPayment } from '@/api/payment/payment';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useState } from 'react';

const PRESET_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const MIN_AMOUNT = 100_000;

export default function AiCreditsTopup() {
  const [amount, setAmount] = useState<number | null>(null);
  const [ongoing, setOngoing] = useState(false);
  const isValid = amount !== null && amount >= MIN_AMOUNT;
  const { company } = usePageSharedDataProps();
  const topup = useCreateTopupPayment();
  const handleTopup = () => {
    if (!isValid || ongoing) return;

    topup.mutate(
      { data: { amount, owner_type: 'company', owner_id: company.id } },
      {
        onSuccess: (payment) => {
          const snapToken = (payment.data.payload as any)?.snap_token as string;
          (window as any).snap.pay(snapToken, {
            onSuccess: () => setOngoing(false),
            onError: () => setOngoing(false),
            onClose: () => setOngoing(false),
          });
        },
      },
    );
  };

  const loaading = topup.isPending || ongoing;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top up AI credits</CardTitle>
        <CardDescription>
          Top up your AI credits for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Preset amounts */}
        <div className="grid grid-cols-2 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={amount === preset ? 'default' : 'outline'}
              onClick={() => setAmount(preset)}
            >
              Rp {preset.toLocaleString('id-ID')}
            </Button>
          ))}
        </div>

        {/* Custom amount */}
        <FieldGroup className="mt-4">
          <Field>
            <Label htmlFor="custom-amount">Custom amount</Label>
            <Input
              id="custom-amount"
              type="number"
              min={MIN_AMOUNT}
              placeholder="Minimum 100000"
              value={amount ?? ''}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          disabled={!isValid || loaading}
          onClick={handleTopup}
          className="w-full"
        >
          {loaading && <Spinner />} Topup AI Credits
        </Button>
      </CardFooter>
    </Card>
  );
}
