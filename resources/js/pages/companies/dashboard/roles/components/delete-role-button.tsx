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
import { destroy } from '@/routes/company/roles';
import { useForm } from '@inertiajs/react';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

export default function DeleteRoleButton({ role }: { role: any }) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const form = useForm();
  const shouldDisabled =
    role.name.endsWith(':superadmin') || role.users.length > 0;

  const handleDelete = () => {
    form.delete(destroy({ company: company.username, role: role.id }).url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
      },
    });
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>
        <Tooltip>
          <TooltipTrigger>
            <Button
              disabled={shouldDisabled}
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label="Delete role"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete role</TooltipContent>
        </Tooltip>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {role.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the role. This action cannot be undone.
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
