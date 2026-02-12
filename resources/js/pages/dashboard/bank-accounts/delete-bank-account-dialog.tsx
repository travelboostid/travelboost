import { destroy } from '@/actions/App/Http/Controllers/DashboardBankAccountController';
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
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

type DeleteBankAccountDialogProps = {
  bankAccount: any;
  children?: ReactNode;
  variant?: 'icon' | 'text' | 'destructive';
};

export default function DeleteBankAccountDialog({
  bankAccount,
  children,
  variant = 'icon',
}: DeleteBankAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm();

  const handleDelete = () => {
    form.delete(destroy({ bank_account: bankAccount.id }).url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  // Default trigger if no children provided
  const defaultTrigger = () => {
    switch (variant) {
      case 'icon':
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      case 'destructive':
        return (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        );
      case 'text':
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children || defaultTrigger()}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the bank
            account
            <span className="font-semibold text-foreground">
              {' '}
              {bankAccount.account_name} - {bankAccount.account_number}
            </span>{' '}
            from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {bankAccount.is_default && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ This is your default bank account
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Deleting this account will remove your default payment
              destination. Make sure to set another account as default first.
            </p>
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
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {form.processing && <Spinner className="mr-2 h-4 w-4" />}
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
