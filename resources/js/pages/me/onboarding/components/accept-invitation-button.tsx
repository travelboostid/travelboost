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
import { acceptInvitation } from '@/routes/me/onboarding';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function AcceptInvitationButton({
  invitation,
}: {
  invitation: any;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm();

  const handleAccept = () => {
    form.post(acceptInvitation(invitation.id).url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" aria-label="Accept Invitation">
          Accept Invitation
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Accept Invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll accept the invitation to join this company. If you feel this
            invitation is not appropriate or you want to create your own account
            instead, please decline the invitation.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.processing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAccept}
            disabled={form.processing}
            className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-600"
          >
            {form.processing && <Spinner className="mr-2 h-4 w-4" />}
            Accept Invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
