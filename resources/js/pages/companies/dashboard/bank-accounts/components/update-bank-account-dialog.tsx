import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/BankAccountController';
import type { BankAccountResource } from '@/api/model';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import usePageProps from '@/hooks/use-page-props';
import { useForm } from '@inertiajs/react';
import { PencilIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import type { BankAccountsPageProps } from '..';

type UpdateBankAccountDialogProps = {
    bankAccount: BankAccountResource;
    children: ReactNode;
};

export default function UpdateBankAccountDialog({
    bankAccount,
    children,
}: UpdateBankAccountDialogProps) {
    const { company, bankAccountProviders } =
        usePageProps<BankAccountsPageProps>();
    const [open, setOpen] = useState(false);

    const form = useForm({
        provider: bankAccount.provider,
        account_number: bankAccount.account_number,
        account_name: bankAccount.account_name,
        branch: bankAccount.branch || '',
        status: bankAccount.status || 'pending',
        is_default: bankAccount.is_default,
    });

    useEffect(() => {
        if (open) {
            form.setData({
                provider: bankAccount.provider,
                account_number: bankAccount.account_number,
                account_name: bankAccount.account_name,
                branch: bankAccount.branch || '',
                status: bankAccount.status || 'pending',
                is_default: bankAccount.is_default,
            });
        }
    }, [bankAccount, form, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.put(
            update({ company: company.username, bank_account: bankAccount.id })
                .url,
            {
                preserveScroll: true,
                onError: () => setOpen(true),
                onSuccess: () => {
                    setOpen(false);
                },
            },
        );
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
    };

    const bankAccountStatus = useMemo(() => {
        const status = bankAccount.status ?? 'pending';
        const components = {
            pending: (
                <Badge
                    variant="ghost"
                    className="bg-yellow-100 text-yellow-800"
                >
                    PENDING
                </Badge>
            ),
            verified: (
                <Badge variant="ghost" className="bg-green-100 text-green-800">
                    VERIFIED
                </Badge>
            ),
            rejected: (
                <Badge variant="ghost" className="bg-red-100 text-red-800">
                    REJECTED
                </Badge>
            ),
        };

        return (
            components[status as keyof typeof components] ?? (
                <Badge
                    variant="ghost"
                    className="bg-muted/10 text-muted-foreground"
                >
                    UNKNOWN
                </Badge>
            )
        );
    }, [bankAccount.status]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <PencilIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                <FormattedMessage defaultMessage="Update bank account" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Update the bank account details for withdrawals." />
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-5">
                        <div className="grid gap-2">
                            <Label htmlFor="status">
                                <FormattedMessage defaultMessage="Status" />
                            </Label>
                            {bankAccountStatus}
                            <InputError message={form.errors.status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="provider">
                                <FormattedMessage defaultMessage="Bank" />
                            </Label>
                            <Select
                                value={form.data.provider}
                                onValueChange={(value) =>
                                    form.setData('provider', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccountProviders.map((provider) => (
                                        <SelectItem
                                            key={provider.code}
                                            value={provider.code}
                                        >
                                            {provider.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.provider} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="account_number">
                                <FormattedMessage defaultMessage="Account number" />
                            </Label>
                            <Input
                                id="account_number"
                                placeholder="1234567890"
                                value={form.data.account_number}
                                onChange={(e) =>
                                    form.setData(
                                        'account_number',
                                        e.target.value,
                                    )
                                }
                                maxLength={50}
                            />
                            <InputError message={form.errors.account_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="account_name">
                                <FormattedMessage defaultMessage="Account holder name" />
                            </Label>
                            <Input
                                id="account_name"
                                placeholder="As shown on your bank statement"
                                value={form.data.account_name}
                                onChange={(e) =>
                                    form.setData('account_name', e.target.value)
                                }
                                maxLength={100}
                            />
                            <InputError message={form.errors.account_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="branch">
                                <FormattedMessage defaultMessage="Branch (optional)" />
                            </Label>
                            <Input
                                id="branch"
                                placeholder="Branch name"
                                value={form.data.branch}
                                onChange={(e) =>
                                    form.setData('branch', e.target.value)
                                }
                                maxLength={100}
                            />
                            <InputError message={form.errors.branch} />
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-4 py-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_default">
                                    <FormattedMessage defaultMessage="Default account" />
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage defaultMessage="Primary destination for withdrawals." />
                                </p>
                            </div>
                            <Switch
                                id="is_default"
                                checked={form.data.is_default}
                                onCheckedChange={(checked) =>
                                    form.setData('is_default', checked)
                                }
                            />
                        </div>
                        <InputError message={form.errors.is_default} />
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={form.processing}
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : null}
                            <FormattedMessage defaultMessage="Save changes" />
                        </Button>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                            >
                                <FormattedMessage defaultMessage="Cancel" />
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
