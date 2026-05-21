import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/BankAccountController';
import type { BankAccountResource } from '@/api/model';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
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
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.put(
            update({ company: company.username, bank_account: bankAccount.id })
                .url,
            {
                preserveScroll: true,
                onError: () => setOpen(true), // 🔥 keep modal open on validation error
                onSuccess: () => {
                    setOpen(false);
                },
            },
        );
    };

    const bankAccountStatus = useMemo(() => {
        const components = {
            pending: (
                <div className="flex gap-2 items-center">
                    <Badge
                        variant="ghost"
                        className="text-sm bg-yellow-100 text-yellow-800"
                    >
                        PENDING
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        Awaiting verification
                    </span>
                </div>
            ),
            verified: (
                <div className="flex gap-2 items-center">
                    <Badge
                        variant="ghost"
                        className="text-sm bg-green-100 text-green-800"
                    >
                        VERIFIED
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        Verified and active
                    </span>
                </div>
            ),
            rejected: (
                <div className="flex gap-2 items-center">
                    <Badge
                        variant="ghost"
                        className="text-sm bg-red-100 text-red-800"
                    >
                        REJECTED
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        Rejected - requires update
                    </span>
                </div>
            ),
            unknown: (
                <div className="flex gap-2 items-center">
                    <Badge
                        variant="ghost"
                        className="text-sm bg-muted/10 text-muted-foreground"
                    >
                        UNKNOWN
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        Status unknown
                    </span>
                </div>
            ),
        };

        return (
            components[bankAccount.status as keyof typeof components] ||
            components['unknown']
        );
    }, [bankAccount.status]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Bank Account</DialogTitle>
                </DialogHeader>

                {/* ❗ ONLY ONE submit button, ONLY ONE form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Account Status (Admin only) */}
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        {bankAccountStatus}
                        <InputError message={form.errors.status} />
                    </div>

                    {/* Provider Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="provider">Provider *</Label>
                        <Select
                            value={form.data.provider}
                            onValueChange={(value) =>
                                form.setData('provider', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
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

                    {/* Account Number */}
                    <div className="grid gap-2">
                        <Label htmlFor="account_number">Account Number *</Label>
                        <Input
                            id="account_number"
                            placeholder="Enter account number"
                            value={form.data.account_number}
                            onChange={(e) =>
                                form.setData('account_number', e.target.value)
                            }
                            maxLength={50}
                        />
                        <InputError message={form.errors.account_number} />
                    </div>

                    {/* Account Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="account_name">Account Name *</Label>
                        <Input
                            id="account_name"
                            placeholder="Enter account holder name"
                            value={form.data.account_name}
                            onChange={(e) =>
                                form.setData('account_name', e.target.value)
                            }
                            maxLength={100}
                        />
                        <InputError message={form.errors.account_name} />
                    </div>

                    {/* Branch (Optional) */}
                    <div className="grid gap-2">
                        <Label htmlFor="branch">Branch (Optional)</Label>
                        <Input
                            id="branch"
                            placeholder="Enter branch name"
                            value={form.data.branch}
                            onChange={(e) =>
                                form.setData('branch', e.target.value)
                            }
                            maxLength={100}
                        />
                        <InputError message={form.errors.branch} />
                    </div>

                    {/* Set as Default */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="is_default">
                                Set as default account
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                This account will be used as the primary
                                destination for payments
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

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner className="mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
