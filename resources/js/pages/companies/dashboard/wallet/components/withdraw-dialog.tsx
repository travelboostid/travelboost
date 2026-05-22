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
import usePageProps from '@/hooks/use-page-props';
import { store } from '@/routes/companies/dashboard/withdrawals';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { WalletPageProps } from '..';
// import { useCreateWithdraw } from '@/api/payment/payment'

const MIN_AMOUNT = 100_000;

type WithdrawDialogProps = {
    children: React.ReactNode;
};

export function WithdrawDialog({ children }: WithdrawDialogProps) {
    const { company, wallet } = usePageProps<WalletPageProps>();
    const { balance } = usePage<{ balance: number }>().props;
    const [open, setOpen] = useState(false);

    const form = useForm({
        wallet_id: wallet.id,
        amount: 0,
        bank_account_id: '',
    });

    // const withdraw = useCreateWithdraw()

    const isValid =
        form.data.amount >= MIN_AMOUNT && form.data.amount <= balance;

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
                            value={form.data.amount}
                            onChange={(e) => {
                                const value = e.target.value
                                    ? Number(e.target.value)
                                    : 0;
                                form.setData('amount', value);
                            }}
                        />
                    </Field>

                    <Field>
                        <Label htmlFor="bank-account-id">Bank Account</Label>
                        <SelectBank
                            name="bank_account_id"
                            value={form.data.bank_account_id}
                            onChange={(value) =>
                                form.setData('bank_account_id', String(value))
                            }
                        />
                    </Field>

                    {form.data.amount > balance && (
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
