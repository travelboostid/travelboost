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
import { update } from '@/routes/company/teams';
import { useForm } from '@inertiajs/react';
import { ShieldBanIcon } from 'lucide-react';
import { useState } from 'react';

export default function SuspendTeamButton({ team }: { team: any }) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm();

  const handleSuspend = () => {
    form.put(update({ company: company.username, team: team.id }).url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
      },
    });
  };
  const shouldDisabled = team.is_owner;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger disabled={shouldDisabled}>
        <Tooltip>
          <TooltipTrigger>
            <Button
              disabled={shouldDisabled}
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label="Suspend"
            >
              <ShieldBanIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Suspend</TooltipContent>
        </Tooltip>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend user?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to suspend this user? They will not be able to
            access any company resources. You can unsuspend them at any time by
            clicking the unsuspend button.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSuspend}>Suspend</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
