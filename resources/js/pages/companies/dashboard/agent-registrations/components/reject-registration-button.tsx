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
import { Textarea } from '@/components/ui/textarea';
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
  const form = useForm({
    status: 'rejected',
    note: '',
  });
  const handleReject = () => {
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
          <AlertDialogTitle>Reject Registration</AlertDialogTitle>
          <AlertDialogDescription>
            This action will reject the registration. The agent will be notified
            and can re-apply if they wish. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          cols={5}
          placeholder="Write a note for the agent"
          value={form.data.note}
          onChange={(e) => form.setData('note', e.target.value)}
          className="w-full"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
