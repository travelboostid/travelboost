import { update } from '@/actions/App/Http/Controllers/DashboardBankAccountController';
import { BankAccountResource } from '@/api/model';
import InputError from '@/components/input-error';
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
import { useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

const BANK_PROVIDERS = [
  { value: 'BCA', label: 'BCA (Bank Central Asia)' },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
  { value: 'MANDIRI', label: 'Bank Mandiri' },
  { value: 'OVO', label: 'OVO' },
  { value: 'GOPAY', label: 'GoPay' },
];

type UpdateBankAccountDialogProps = {
  bankAccount: BankAccountResource;
  children: ReactNode;
};

export default function UpdateBankAccountDialog({
  bankAccount,
  children,
}: UpdateBankAccountDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    provider: bankAccount.provider,
    account_number: bankAccount.account_number,
    account_name: bankAccount.account_name,
    branch: bankAccount.branch || '',
    is_default: bankAccount.is_default,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    form.put(update({ bank_account: bankAccount.id }).url, {
      preserveScroll: true,
      onError: () => setOpen(true), // 🔥 keep modal open on validation error
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

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
          {bankAccount.status && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bankAccount.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : bankAccount.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {bankAccount.status.toUpperCase()}
                </div>
                <span className="text-sm text-muted-foreground">
                  {bankAccount.status === 'pending' && 'Awaiting verification'}
                  {bankAccount.status === 'verified' && 'Verified and active'}
                  {bankAccount.status === 'rejected' &&
                    'Rejected - requires update'}
                </span>
              </div>
              <InputError message={form.errors.status} />
            </div>
          )}

          {/* Provider Selection */}
          <div className="grid gap-2">
            <Label htmlFor="provider">Provider *</Label>
            <Select
              value={form.data.provider}
              onValueChange={(value) => form.setData('provider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {BANK_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
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
              onChange={(e) => form.setData('account_number', e.target.value)}
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
              onChange={(e) => form.setData('account_name', e.target.value)}
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
              onChange={(e) => form.setData('branch', e.target.value)}
              maxLength={100}
            />
            <InputError message={form.errors.branch} />
          </div>

          {/* Set as Default */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_default">Set as default account</Label>
              <p className="text-sm text-muted-foreground">
                This account will be used as the primary destination for
                payments
              </p>
            </div>
            <Switch
              id="is_default"
              checked={form.data.is_default}
              onCheckedChange={(checked) => form.setData('is_default', checked)}
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
