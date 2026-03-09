import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { store } from '@/routes/company/roles';
import { useForm } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import PermissionsSelector from './permissions-selector';

export default function AddRoleButton({ permissions }: { permissions: any[] }) {
  const [open, setOpen] = useState(false);
  const { company } = usePageSharedDataProps();

  const form = useForm({
    name: '',
    display_name: '',
    description: '',
    permissions: {},
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.post(store({ company: company.username }).url, {
      preserveScroll: true,
      onError: () => setOpen(true),
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Add Role
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Enter the details of the new role you want to add. Click add role
              when you're done.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="name">Name</Label>
              <Input
                name="name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
              />

              <InputError message={form.errors.name} />
            </Field>

            <Field>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                name="display_name"
                value={form.data.display_name}
                onChange={(e) => form.setData('display_name', e.target.value)}
              />

              <InputError message={form.errors.display_name} />
            </Field>
            <Field>
              <Label htmlFor="description">Description</Label>
              <Input
                name="description"
                value={form.data.description}
                onChange={(e) => form.setData('description', e.target.value)}
              />

              <InputError message={form.errors.description} />
            </Field>

            <Field>
              <Label>Permissions</Label>
              <PermissionsSelector
                permissions={permissions}
                value={form.data.permissions}
                onChange={(value) => form.setData('permissions', value)}
              ></PermissionsSelector>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
