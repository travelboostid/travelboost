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
import { declineInvitations } from '@/routes/me/onboarding';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function DeclineInvitationsButton() {
  const [open, setOpen] = useState(false);
  const form = useForm();

  const handleDecline = () => {
    form.post(declineInvitations().url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="link" className="text-destructive">
          Decline all invitations and create my own agent account
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Decline all invitations?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll decline all pending invitations and proceed to create your
            own agent account. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.processing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDecline}
            disabled={form.processing}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {form.processing && <Spinner className="mr-2 h-4 w-4" />}
            Decline Invitations
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
