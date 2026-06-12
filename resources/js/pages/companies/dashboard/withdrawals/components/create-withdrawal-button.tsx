import InputError from '@/components/input-error';
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
import { Label } from '@/components/ui/label';
import MoneyInput from '@/components/ui/money-input';
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
import { cn, formatIDR } from '@/lib/utils';
import { store } from '@/routes/companies/dashboard/withdrawals';
import { useForm } from '@inertiajs/react';
import { ArrowDownRightIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import type { WithdrawalsPageProps } from '..';

const PRESET_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const MIN_AMOUNT = 100_000;

export function CreateWithdrawalButton() {
    const { company, wallets } = usePageProps<WithdrawalsPageProps>();
    const [open, setOpen] = useState(false);

    const form = useForm({
        wallet_id: 0,
        amount: 0,
        bank_account_id: '',
    });
    const { data: formData, setData } = form;

    const selectedWallet = wallets?.find((w) => w.id === formData.wallet_id);
    const selectedWalletBalance = Number(selectedWallet?.balance ?? 0);

    useEffect(() => {
        if (!open || formData.wallet_id > 0 || !wallets?.length) {
            return;
        }

        setData('wallet_id', Number(wallets[0].id));
    }, [open, wallets, formData.wallet_id, setData]);

    const isValid =
        form.data.wallet_id > 0 &&
        form.data.bank_account_id !== '' &&
        form.data.amount >= MIN_AMOUNT &&
        form.data.amount <= selectedWalletBalance;

    const resetForm = () => {
        form.reset();
        if (wallets?.length) {
            form.setData('wallet_id', Number(wallets[0].id));
        }
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            resetForm();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.post(store({ company: company.username }).url, {
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                    <PlusIcon className="size-4" />
                    <FormattedMessage defaultMessage="New withdrawal" />
                </Button>
            </DialogTrigger>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                            <ArrowDownRightIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                <FormattedMessage defaultMessage="Withdraw balance" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage
                                    defaultMessage="Transfer funds to your bank account. Available: {amount}"
                                    values={{
                                        amount: (
                                            <span className="font-semibold text-foreground">
                                                {formatIDR(
                                                    selectedWalletBalance,
                                                )}
                                            </span>
                                        ),
                                    }}
                                />
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-5">
                        <div className="grid gap-2">
                            <Label htmlFor="wallet_id">
                                <FormattedMessage defaultMessage="Source wallet" />
                            </Label>
                            <Select
                                value={
                                    form.data.wallet_id
                                        ? String(form.data.wallet_id)
                                        : undefined
                                }
                                onValueChange={(val) =>
                                    form.setData('wallet_id', Number(val))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select wallet" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>
                                            <FormattedMessage defaultMessage="Wallet" />
                                        </SelectLabel>
                                        {wallets?.map((wallet) => (
                                            <SelectItem
                                                key={String(wallet.id)}
                                                value={String(wallet.id)}
                                            >
                                                {String(wallet.name)} ·{' '}
                                                {formatIDR(
                                                    Number(wallet.balance),
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.wallet_id} />
                        </div>

                        <div className="space-y-2.5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <FormattedMessage defaultMessage="Quick amounts" />
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {PRESET_AMOUNTS.map((preset) => {
                                    const selected =
                                        form.data.amount === preset;
                                    const disabled =
                                        preset > selectedWalletBalance;

                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            disabled={disabled}
                                            className={cn(
                                                'rounded-xl border px-3 py-3 text-left transition-all',
                                                disabled &&
                                                    'cursor-not-allowed opacity-50',
                                                selected
                                                    ? 'border-destructive bg-destructive/5 ring-1 ring-destructive/30'
                                                    : 'border-border bg-background hover:border-destructive/30 hover:bg-muted/30',
                                            )}
                                            onClick={() =>
                                                form.setData('amount', preset)
                                            }
                                        >
                                            <p className="text-sm font-semibold tabular-nums text-foreground">
                                                {formatIDR(preset)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="withdraw-amount">
                                <FormattedMessage defaultMessage="Custom amount" />
                            </Label>
                            <MoneyInput
                                name="amount"
                                placeholder="100.000"
                                value={form.data.amount || ''}
                                onChange={(raw) =>
                                    form.setData(
                                        'amount',
                                        raw ? Number(raw) : 0,
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="Minimum {amount}"
                                    values={{ amount: formatIDR(MIN_AMOUNT) }}
                                />
                            </p>
                            <InputError message={form.errors.amount} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bank-account-id">
                                <FormattedMessage defaultMessage="Destination account" />
                            </Label>
                            <SelectBank
                                name="bank_account_id"
                                value={form.data.bank_account_id}
                                onChange={(value) =>
                                    form.setData(
                                        'bank_account_id',
                                        String(value),
                                    )
                                }
                            />
                            <InputError message={form.errors.bank_account_id} />
                        </div>

                        {form.data.amount > selectedWalletBalance ? (
                            <p className="text-sm text-destructive">
                                <FormattedMessage defaultMessage="Amount exceeds available balance." />
                            </p>
                        ) : null}

                        {isValid ? (
                            <div className="rounded-xl border bg-muted/20 px-4 py-3">
                                <p className="text-xs text-muted-foreground">
                                    <FormattedMessage defaultMessage="You will withdraw" />
                                </p>
                                <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
                                    {formatIDR(form.data.amount)}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={!isValid || form.processing}
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : null}
                            <FormattedMessage defaultMessage="Submit withdrawal" />
                        </Button>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                            >
                                <FormattedMessage defaultMessage="Close" />
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
