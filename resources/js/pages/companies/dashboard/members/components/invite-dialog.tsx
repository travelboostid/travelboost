import { store } from '@/actions/App/Http/Controllers/Companies/Dashboard/MemberInvitationController';
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
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useForm } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import UserPicker from './user-picker';

const ROLES = [
  {
    title: 'Admin',
    description: 'Manage everything as you, but with limited capabilities',
    value: 'admin',
  },
  {
    title: 'Manager',
    description: 'Manage teams and projects',
    value: 'manager',
  },
  {
    title: 'Operator',
    description: 'Manage tours and operations',
    value: 'operator',
  },
];

type InviteDialogProps = {
  children: ReactNode;
};

export default function InviteDialog({ children }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const { company } = usePageSharedDataProps();

  const form = useForm({
    email: '',
    role: '' as string,
  });

  const handleSubmit = (e: React.FormEvent) => {
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
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Enter the details of the new user you want to invite. Click send
              invitation when you're done.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="email">User</Label>
              <UserPicker
                value={form.data.email}
                onChange={(value) => form.setData('email', value || '')}
              />
              <InputError message={form.errors.email} />
            </Field>

            <Field>
              <Label htmlFor="role">Role</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                size="lg"
                className="grid grid-cols-1 gap-2 rounded-xl"
                value={form.data.role}
                onValueChange={(v) => form.setData('role', v)}
              >
                {ROLES.map((role) => (
                  <ToggleGroupItem
                    key={role.value}
                    value={role.value}
                    aria-label={role.title}
                    className="block h-auto w-auto p-4 text-left"
                  >
                    <div className="font-bold">{role.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {role.description}
                    </div>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <InputError message={form.errors.role} />
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
