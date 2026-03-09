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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/company/agent-registrations';
import { useForm } from '@inertiajs/react';
import { UserX2Icon } from 'lucide-react';
import { useState } from 'react';

export default function RejectRegistrationButton({
  registration,
}: {
  registration: any;
}) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm();
  const handleReject = () => {
    form.setData({
      status: 'rejected',
    });
    form.put(
      update({
        company: company.username,
        agent_registration: registration.id,
      }).url,
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
      <AlertDialogTrigger asChild>
        <Button size="icon" className="text-destructive" variant="outline">
          <UserX2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete registration?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the registration. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReject}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
