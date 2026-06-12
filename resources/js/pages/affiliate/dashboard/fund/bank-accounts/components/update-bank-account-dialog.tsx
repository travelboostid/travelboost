import InputError from '@/components/input-error';
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
import { useForm } from '@inertiajs/react';
import { PencilIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const BANK_PROVIDERS = [
    { value: 'bca', label: 'BCA (Bank Central Asia)' },
    { value: 'bni', label: 'BNI (Bank Negara Indonesia)' },
    { value: 'mandiri', label: 'Bank Mandiri' },
    { value: 'bri', label: 'Bank Rakyat Indonesia' },
    { value: 'ovo', label: 'OVO' },
    { value: 'gopay', label: 'GoPay' },
];

export default function UpdateBankAccountDialog({
    bankAccount,
    children,
}: any) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        provider: bankAccount.provider,
        account_number: bankAccount.account_number,
        account_name: bankAccount.account_name,
        branch: bankAccount.branch || '',
        is_default: bankAccount.is_default,
    });

    useEffect(() => {
        if (open) {
            form.setData({
                provider: bankAccount.provider,
                account_number: bankAccount.account_number,
                account_name: bankAccount.account_name,
                branch: bankAccount.branch || '',
                is_default: bankAccount.is_default,
            });
        }
    }, [bankAccount, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`/affiliate/dashboard/fund/bank-accounts/${bankAccount.id}`, {
            preserveScroll: true,
            onError: () => setOpen(true),
            onSuccess: () => setOpen(false),
        });
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
    };

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
                                Update Bank Account
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                Update the bank account details for withdrawals.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-5">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Bank / Provider</Label>
                            <Select
                                value={form.data.provider}
                                onValueChange={(v) =>
                                    form.setData('provider', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {BANK_PROVIDERS.map((p) => (
                                        <SelectItem
                                            key={p.value}
                                            value={p.value}
                                        >
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.provider} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="account_number">
                                Account Number
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
                                Account Holder Name
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
                            <Label htmlFor="branch">Branch (Optional)</Label>
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
                                    Default account
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Primary destination for withdrawals.
                                </p>
                            </div>
                            <Switch
                                id="is_default"
                                checked={form.data.is_default}
                                onCheckedChange={(c) =>
                                    form.setData('is_default', c)
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
                            {form.processing && <Spinner className="mr-2" />}
                            Save Changes
                        </Button>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
