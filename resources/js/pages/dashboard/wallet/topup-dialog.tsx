import { useCreateTopupPayment } from '@/api/payment/payment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';

const PRESET_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const MIN_AMOUNT = 100_000;

type TopupDialogProps = {
  children: React.ReactNode;
};

export function TopupDialog({ children }: TopupDialogProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [ongoing, setOngoing] = useState(false);
  const isValid = amount !== null && amount >= MIN_AMOUNT;
  const topup = useCreateTopupPayment();
  const handleTopup = () => {
    if (!isValid || ongoing) return;

    topup.mutate(
      { data: { amount } },
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
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Top up wallet</DialogTitle>
          <DialogDescription>
            Choose an amount or enter a custom value (minimum Rp 100.000)
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button disabled={!isValid || loaading} onClick={handleTopup}>
            {loaading && <Spinner />} Topup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
