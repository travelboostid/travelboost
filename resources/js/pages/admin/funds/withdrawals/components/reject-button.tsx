import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { update } from '@/routes/admin/funds/withdrawals';
import { useForm } from '@inertiajs/react';
import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RejectButton({ data }: { data: any }) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    status: 'rejected',
  });

  const handleSubmit = () => {
    form.put(update(data.id).url, {
      onSuccess: () => {
        setOpen(false);
        toast.success('Withdrawal rejected successfully');
      },
      onError: (err) => {
        toast.error('Failed to reject withdrawal', {
          description:
            err.status ||
            'An unexpected error occurred. Check the logs for more details.',
        });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="destructive">
          <XIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark this withdrawal as rejected and cancel the
            transaction. User will be notified about the rejection. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.processing}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={form.processing}
          >
            Yes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
