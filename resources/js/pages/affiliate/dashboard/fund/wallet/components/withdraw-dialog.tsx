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
import { useForm, usePage } from '@inertiajs/react';

const MIN_AMOUNT = 50_000; // Affiliate biasanya batas WD lebih kecil

type WithdrawDialogProps = {
  children: React.ReactNode;
};

export function WithdrawDialog({ children }: WithdrawDialogProps) {
  const { balance } = usePage<{ balance: number }>().props;

  const { data, setData, post, processing, reset } = useForm({
    amount: '' as number | string,
    bank_account_id: '',
  });

  const amountNum = Number(data.amount);
  const isValid =
    amountNum >= MIN_AMOUNT &&
    amountNum <= balance &&
    data.bank_account_id !== '';

  const handleWithdraw = () => {
    if (!isValid || processing) return;

    // Arahkan ke route pemrosesan penarikan affiliate (Nanti dibuat di controller Withdraw)
    post('/affiliate/dashboard/fund/withdraw', {
      onSuccess: () => reset(),
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Withdraw balance</DialogTitle>
          <DialogDescription>
            Available balance:{' '}
            <strong className="text-emerald-600">
              Rp {balance.toLocaleString('id-ID')}
            </strong>
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
              value={data.amount}
              onChange={(e) => setData('amount', e.target.value)}
            />
          </Field>

          <Field>
            <Label htmlFor="bank-account-id">Bank Account</Label>
            {/* Memanfaatkan komponen SelectBank bawaan tim Mba */}
            <SelectBank
              name="bank_account_id"
              onChange={(e: any) => setData('bank_account_id', e.target.value)}
            />
          </Field>

          {amountNum > balance && (
            <p className="text-sm text-rose-600 font-medium">
              Amount exceeds available balance.
            </p>
          )}
        </FieldGroup>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button
            disabled={!isValid || processing}
            onClick={handleWithdraw}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {processing && <Spinner className="mr-2" />}
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
