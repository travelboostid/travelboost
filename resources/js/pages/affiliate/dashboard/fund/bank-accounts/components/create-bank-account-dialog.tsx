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
import { useState } from 'react';

const BANK_PROVIDERS = [
  { value: 'BCA', label: 'BCA (Bank Central Asia)' },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
  { value: 'MANDIRI', label: 'Bank Mandiri' },
  { value: 'BRI', label: 'Bank Rakyat Indonesia' },
  { value: 'OVO', label: 'OVO' },
  { value: 'GOPAY', label: 'GoPay' },
];

export default function CreateBankAccountDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    provider: '',
    account_number: '',
    account_name: '',
    branch: '',
    is_default: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post('/affiliate/dashboard/fund/bank-accounts', {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-2">
            <Label>Bank / Provider</Label>
            <Select onValueChange={(v) => form.setData('provider', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {BANK_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={form.errors.provider} />
          </div>
          <div className="grid gap-2">
            <Label>Account Number</Label>
            <Input
              value={form.data.account_number}
              onChange={(e) => form.setData('account_number', e.target.value)}
            />
            <InputError message={form.errors.account_number} />
          </div>
          <div className="grid gap-2">
            <Label>Account Holder Name</Label>
            <Input
              value={form.data.account_name}
              onChange={(e) => form.setData('account_name', e.target.value)}
            />
            <InputError message={form.errors.account_name} />
          </div>
          <div className="grid gap-2">
            <Label>Branch (Optional)</Label>
            <Input
              value={form.data.branch}
              onChange={(e) => form.setData('branch', e.target.value)}
            />
            <InputError message={form.errors.branch} />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <Label>Set as default account</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use this account for withdrawals.
              </p>
            </div>
            <Switch
              checked={form.data.is_default}
              onCheckedChange={(c) => form.setData('is_default', c)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={form.processing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {form.processing && <Spinner className="mr-2" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
