import { destroy } from '@/actions/App/Http/Controllers/Companies/Dashboard/MemberInvitationController';
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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useForm } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';

export default function DeleteInvitationDialog({
  children,
  invitation,
}: {
  children: ReactNode;
  invitation: any;
}) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm();
  const handleDelete = () => {
    form.delete(
      destroy({ company: company.username, member_invitation: invitation.id })
        .url,
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
        },
      },
    );
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the invitation. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
