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
import { update } from '@/routes/companies/dashboard/teams';
import { useForm } from '@inertiajs/react';
import { KeyRoundIcon } from 'lucide-react';
import { useState } from 'react';

export default function EditTeamAccountButton({
  team,
  canManageMembers,
}: {
  team: any;
  canManageMembers: boolean;
}) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);
  const shouldDisable = !canManageMembers || team.is_owner;

  const form = useForm({
    email: team.user?.email || '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload: Record<string, string> = {
      email: form.data.email,
    };

    if (form.data.password) {
      payload.password = form.data.password;
      payload.password_confirmation = form.data.password_confirmation;
    }

    form
      .transform(() => payload)
      .put(update({ company: company.username, team: team.id }).url, {
        preserveScroll: true,
        onError: () => setOpen(true),
        onSuccess: () => {
          form.reset('password', 'password_confirmation');
          setOpen(false);
        },
      });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          form.setData({
            email: team.user?.email || '',
            password: '',
            password_confirmation: '',
          });
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              disabled={shouldDisable}
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Update credentials"
            >
              <KeyRoundIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Update email or password</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Update Team Account</DialogTitle>
            <DialogDescription>
              Change the team member email address or set a new password.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor={`email-${team.id}`}>Email</Label>
              <Input
                id={`email-${team.id}`}
                type="email"
                value={form.data.email}
                onChange={(event) => form.setData('email', event.target.value)}
              />
              <InputError message={form.errors.email} />
            </Field>

            <Field>
              <Label htmlFor={`password-${team.id}`}>New Password</Label>
              <Input
                id={`password-${team.id}`}
                type="password"
                placeholder="Leave blank to keep the current password"
                value={form.data.password}
                onChange={(event) =>
                  form.setData('password', event.target.value)
                }
              />
              <InputError message={form.errors.password} />
            </Field>

            <Field>
              <Label htmlFor={`password-confirmation-${team.id}`}>
                Confirm New Password
              </Label>
              <Input
                id={`password-confirmation-${team.id}`}
                type="password"
                placeholder="Repeat the new password"
                value={form.data.password_confirmation}
                onChange={(event) =>
                  form.setData('password_confirmation', event.target.value)
                }
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
