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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { invite } from '@/routes/company/teams';
import { useForm } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

export default function InviteTeamButton({ roles }: { roles: any[] }) {
  const [open, setOpen] = useState(false);
  const { company } = usePageSharedDataProps();

  const form = useForm({
    invite_email: '',
    invite_role: '' as string,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(invite({ company: company.username }).url, {
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
          Invite new user
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite New Team</DialogTitle>
            <DialogDescription>
              Enter the details of the new user you want to invite. Click send
              invitation when you're done.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="invite_email">User</Label>
              <Input
                id="invite_email"
                placeholder="Email..."
                value={form.data.invite_email}
                onChange={(e) => form.setData('invite_email', e.target.value)}
              />
              <InputError message={form.errors.invite_email} />
            </Field>

            <Field>
              <Label htmlFor="invite_role">Role</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                size="lg"
                className="grid grid-cols-1 gap-2 rounded-xl"
                value={form.data.invite_role}
                onValueChange={(v) => form.setData('invite_role', v)}
              >
                {roles.map((role) => (
                  <ToggleGroupItem
                    name="invite_role"
                    key={role.name}
                    value={role.name}
                    aria-label={role.name}
                    className="block h-auto w-auto p-4 text-left"
                  >
                    <div className="font-bold">{role.display_name}</div>
                    <div className="text-muted-foreground text-xs">
                      {role.description}
                    </div>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <InputError message={form.errors.invite_role} />
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
