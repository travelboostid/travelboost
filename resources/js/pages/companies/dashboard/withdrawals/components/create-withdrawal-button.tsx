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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import usePageProps from '@/hooks/use-page-props';
import { store } from '@/routes/companies/dashboard/withdrawals';
import { useForm } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { WithdrawalsPageProps } from '..';

const MIN_AMOUNT = 100_000;

export function CreateWithdrawalButton() {
  const { company, wallets } = usePageProps<WithdrawalsPageProps>();
  const [open, setOpen] = useState(false);

  const form = useForm({
    wallet_id: 0,
    amount: 0,
    bank_account_id: '',
  });

  const selectedWallet = wallets?.find((w) => w.id === form.data.wallet_id);
  const selectedWalletBalance = selectedWallet?.balance || 0;

  // const withdraw = useCreateWithdraw()

  const isValid =
    form.data.amount >= MIN_AMOUNT && form.data.amount <= selectedWalletBalance;

  const handleWithdraw = () => {
    form.post(store({ company: company.username }).url, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New Withdrawal
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Withdraw balance</DialogTitle>
          <DialogDescription>
            Available balance:{' '}
            <strong>Rp {selectedWalletBalance.toLocaleString('id-ID')}</strong>
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <Label htmlFor="wallet_id">Source Wallet</Label>
            <Select
              name="wallet_id"
              value={form.data.wallet_id?.toString()}
              onValueChange={(val) => form.setData('wallet_id', Number(val))}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Wallet</SelectLabel>
                  {wallets?.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="withdraw-amount">Amount</Label>
            <Input
              id="withdraw-amount"
              type="number"
              min={MIN_AMOUNT}
              max={selectedWalletBalance}
              step={1000}
              placeholder={`Minimum ${MIN_AMOUNT}`}
              value={form.data.amount}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : 0;
                form.setData('amount', value);
              }}
            />
          </Field>

          <Field>
            <Label htmlFor="bank-account-id">Bank Account Destination</Label>
            <SelectBank
              name="bank_account_id"
              value={form.data.bank_account_id}
              onChange={(value) =>
                form.setData('bank_account_id', String(value))
              }
            />
          </Field>

          {form.data.amount > selectedWalletBalance && (
            <p className="text-sm text-destructive">
              Amount exceeds available balance
            </p>
          )}
        </FieldGroup>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button
            disabled={!isValid || form.processing}
            onClick={handleWithdraw}
          >
            {form.processing && <Spinner />}
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
