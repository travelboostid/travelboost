import SelectBank from '@/components/select-bank';
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
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
// import { useCreateWithdraw } from '@/api/payment/payment'

const MIN_AMOUNT = 100_000;

type WithdrawDialogProps = {
  children: React.ReactNode;
};

export function WithdrawDialog({ children }: WithdrawDialogProps) {
  const { balance } = usePage<{ balance: number }>().props;

  const [amount, setAmount] = useState<number | null>(null);
  const [ongoing, setOngoing] = useState(false);

  // const withdraw = useCreateWithdraw()

  const isValid = amount !== null && amount >= MIN_AMOUNT && amount <= balance;

  const handleWithdraw = () => {
    if (!isValid || ongoing) return;

    setOngoing(true);

    // Example API call
    // withdraw.mutate(
    //   { data: { amount } },
    //   {
    //     onSuccess: () => setOngoing(false),
    //     onError: () => setOngoing(false),
    //   }
    // )

    // temporary
    setTimeout(() => setOngoing(false), 800);
  };

  const loading = ongoing; // or withdraw.isPending

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Withdraw balance</DialogTitle>
          <DialogDescription>
            Available balance:{' '}
            <strong>Rp {balance.toLocaleString('id-ID')}</strong>
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <Label htmlFor="withdraw-amount">Amount</Label>
            <Input
              id="withdraw-amount"
              type="number"
              min={MIN_AMOUNT}
              max={balance}
              step={1000}
              placeholder={`Minimum ${MIN_AMOUNT}`}
              value={amount ?? ''}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>

          <Field>
            <Label htmlFor="bank-account-id">Bank Account</Label>
            <SelectBank name="bank_account_id" />
          </Field>

          {amount !== null && amount > balance && (
            <p className="text-sm text-destructive">
              Amount exceeds available balance
            </p>
          )}
        </FieldGroup>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button disabled={!isValid || loading} onClick={handleWithdraw}>
            {loading && <Spinner />}
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
