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
import { destroy } from '@/routes/admin/database/roles';
import { useForm } from '@inertiajs/react';
import { TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DeleteButton({ role }: { role: any }) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    name: '',
    display_name: '',
    description: '',
  });

  const handleSubmit = () => {
    form.delete(destroy({ id: role.id }).url, {
      onSuccess: () => {
        toast.success('Role deleted successfully');
      },
    });
  };

  useEffect(() => {
    if (!open) return;
    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="destructive">
          <TrashIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This action can have unintended
            consequences. Please make sure you understand what will happen
            before you proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.processing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            onClick={handleSubmit}
            disabled={form.processing}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
