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
import { ShieldBanIcon } from 'lucide-react';
import { useState } from 'react';

export default function SuspendButton({ registration }: { registration: any }) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm({
    status: 'active',
    note: '',
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
        <Button size="icon" className="text-primary" variant="destructive">
          <ShieldBanIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend Registration</AlertDialogTitle>
          <AlertDialogDescription>
            This will suspend the registration and prevent the agent from
            accessing your tours. The agent will be notified and can contact you
            to resolve any issues. Are you sure you want to proceed?
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
          <AlertDialogAction onClick={handleApprove}>Suspend</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
