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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { resendInvitation } from '@/routes/company/teams';
import { useForm } from '@inertiajs/react';
import { RepeatIcon } from 'lucide-react';
import { useState } from 'react';

export default function ResendInvitationButton({ team }: { team: any }) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm();
  const handleResend = () => {
    form.post(
      resendInvitation({ company: company.username, team: team.id }).url,
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
      <AlertDialogTrigger>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Resend Invitation"
            >
              <RepeatIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Resend Invitation</TooltipContent>
        </Tooltip>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resend Invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will resend the invitation to the recipient. Make sure they
            check their inbox and spam folder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleResend}>Resend</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
