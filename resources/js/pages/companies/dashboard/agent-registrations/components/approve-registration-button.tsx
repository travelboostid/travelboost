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
import { UserCheckIcon } from 'lucide-react';
import { useState } from 'react';

export default function ApproveRegistrationButton({
  registration,
}: {
  registration: any;
}) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm({
    status: 'active',
  });
  const handleApprove = () => {
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
        <Button size="icon" className="text-primary" variant="outline">
          <UserCheckIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve registration?</AlertDialogTitle>
          <AlertDialogDescription>
            This will approve the registration and allow the agent to access
            your tours.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
