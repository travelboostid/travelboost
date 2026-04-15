import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function DeleteBankAccountDialog({
  bankAccount,
  children,
}: any) {
  const [open, setOpen] = useState(false);
  const form = useForm();

  const handleDelete = () => {
    form.delete(`/affiliate/dashboard/fund/bank-accounts/${bankAccount.id}`, {
      preserveScroll: true,
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bank Account?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Are you sure you want to delete{' '}
            {bankAccount.account_name} - {bankAccount.account_number}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {bankAccount.is_default && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm text-amber-800">
            ⚠️ This is your default bank account. Make sure to set a new default
            afterwards.
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.processing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={form.processing}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {form.processing && <Spinner className="mr-2" />} Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
