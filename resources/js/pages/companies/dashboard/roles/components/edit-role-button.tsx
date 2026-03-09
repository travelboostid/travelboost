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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/company/roles';
import { useForm } from '@inertiajs/react';
import { EditIcon } from 'lucide-react';
import { useState } from 'react';
import PermissionsSelector from './permissions-selector';

export default function EditRoleButton({
  role,
  permissions,
}: {
  role: any;
  permissions: any[];
}) {
  const [open, setOpen] = useState(false);
  const { company } = usePageSharedDataProps();

  const form = useForm({
    name: role.name.replace(`company:${company.id}:`, ''),
    display_name: role.display_name,
    description: role.description,
    permissions: permissions.reduce(
      (acc, permission) => {
        acc[permission.name] = role.permissions.some(
          (rolePerm: any) => rolePerm.id === permission.id,
        );
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.put(update({ company: company.username, role: role.id }).url, {
      preserveScroll: true,
      onError: () => setOpen(true),
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  const shouldDisabled = role.name.endsWith(':superadmin');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Edit role"
            >
              <EditIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit role</TooltipContent>
        </Tooltip>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the details of the role. Click update role when you're
              done.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="name">Code</Label>
              <Input
                name="name"
                value={form.data.name}
                onChange={(e) => {
                  const formattedValue = (e.target.value || '')
                    .toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');
                  form.setData('name', formattedValue);
                }}
                disabled={shouldDisabled}
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
                disabled={shouldDisabled}
                permissions={permissions}
                value={form.data.permissions}
                onChange={(value) => form.setData('permissions', value)}
              ></PermissionsSelector>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
