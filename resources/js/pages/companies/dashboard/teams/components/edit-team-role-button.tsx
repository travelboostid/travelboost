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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageProps from '@/hooks/use-page-props';
import { update } from '@/routes/company/teams';
import { useForm } from '@inertiajs/react';
import { IconUserShield } from '@tabler/icons-react';
import { useState } from 'react';
import type { TeamsPageProps } from '..';

export default function EditTeamRoleButton({ team }: { team: any }) {
  const [open, setOpen] = useState(false);
  const { roles, company } = usePageProps<TeamsPageProps>();

  const form = useForm({
    role: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.put(update({ company: company.username, team: team.id }).url, {
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
      <DialogTrigger disabled={team.is_owner}>
        <Tooltip>
          <TooltipTrigger>
            <Button
              disabled={team.is_owner}
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label="Edit"
            >
              <IconUserShield className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Team Role</TooltipContent>
        </Tooltip>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Team Role</DialogTitle>
            <DialogDescription>
              Enter the details of the new role you want to assign. Click save
              changes when you're done.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="invite_role">Role</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                size="lg"
                className="grid grid-cols-1 gap-2 rounded-xl"
                value={form.data.role}
                onValueChange={(v) => form.setData('role', v)}
              >
                {roles.map((role) => (
                  <ToggleGroupItem
                    name="role"
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

              <InputError message={form.errors.role} />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
