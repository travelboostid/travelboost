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
import { destroy } from '@/routes/company/teams';
import { useForm } from '@inertiajs/react';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

export default function DeleteTeamButton({ team }: { team: any }) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm();
  const handleDelete = () => {
    form.delete(destroy({ company: company.username, team: team.id }).url, {
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
              aria-label="Edit"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {team.status === 'pending' ? 'invitation' : 'user'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {team.status === 'pending'
              ? 'This will cancel the invitation. This action cannot be undone.'
              : 'This will permanently remove the user. This action cannot be undone.'}
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
