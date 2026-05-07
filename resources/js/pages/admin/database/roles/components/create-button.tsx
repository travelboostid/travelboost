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
import { store } from '@/routes/admin/database/roles';
import { useForm } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PermissionsSelector from './permissions-selector';

export default function CreateButton({ permissions }: { permissions: any[] }) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    name: '',
    display_name: '',
    description: '',
    permissions: {},
  });

  const handleSubmit = () => {
    form.post(store().url, {
      onSuccess: () => {
        toast.success('Role created successfully');
        form.reset();
        setOpen(false);
      },
    });
  };

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default">
          <PlusIcon /> Create Role
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="flex flex-col overflow-y-auto max-h-screen">
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
          <Field>
            <FieldLabel>Permissions</FieldLabel>
            <PermissionsSelector
              permissions={permissions}
              value={form.data.permissions}
              onChange={(value) => form.setData('permissions', value)}
            />
          </Field>
        </form>
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
