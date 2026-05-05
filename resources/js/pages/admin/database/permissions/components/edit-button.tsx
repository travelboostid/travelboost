import { Alert, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { update } from '@/routes/admin/database/permissions';
import { useForm } from '@inertiajs/react';
import { AlertCircleIcon, PencilIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EditButton({ permission }: { permission: any }) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    name: permission.name,
    display_name: permission.display_name,
    description: permission.description,
  });

  const handleSubmit = () => {
    form.put(update(permission.id).url, {
      onSuccess: () => {
        toast.success('Permission updated successfully');
      },
    });
  };

  useEffect(() => {
    if (!open) return;
    form.setData({
      name: permission.name,
      display_name: permission.display_name,
      description: permission.description,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="outline">
          <PencilIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form className="space-y-8">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              placeholder="Name"
              value={form.data.name}
              onChange={(e) => form.setData('name', e.target.value)}
            />
            <FieldError>{form.errors.name}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="display_name">Display Name</FieldLabel>
            <Input
              id="display_name"
              placeholder="Display Name"
              value={form.data.display_name}
              onChange={(e) => form.setData('display_name', e.target.value)}
            />
            <FieldError>{form.errors.display_name}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Input
              id="description"
              placeholder="Description"
              value={form.data.description}
              onChange={(e) => form.setData('description', e.target.value)}
            />
            <FieldError>{form.errors.description}</FieldError>
          </Field>
        </form>
        {form.data.name !== permission.name && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>
              Changing permission name can have unintended consequences
            </AlertTitle>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.processing}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={form.processing}
          >
            Save
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
