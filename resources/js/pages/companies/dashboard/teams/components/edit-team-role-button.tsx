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
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageProps from '@/hooks/use-page-props';
import { update } from '@/routes/companies/dashboard/teams';
import { useForm } from '@inertiajs/react';
import { IconUserShield } from '@tabler/icons-react';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { TeamsPageProps } from '..';

export default function EditTeamRoleButton({ team }: { team: any }) {
    const intl = useIntl();
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
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Edit',
                            })}
                        >
                            <IconUserShield className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <FormattedMessage defaultMessage="Edit Team Role" />
                    </TooltipContent>
                </Tooltip>
            </DialogTrigger>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <PencilIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                <FormattedMessage defaultMessage="Edit Team Role" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Enter the details of the new role you want to assign. Click save changes when you're done." />
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-5">
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="invite_role">
                                    <FormattedMessage defaultMessage="Role" />
                                </Label>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    spacing={2}
                                    size="lg"
                                    className="grid grid-cols-1 gap-2 rounded-xl"
                                    value={form.data.role}
                                    onValueChange={(v) =>
                                        form.setData('role', v)
                                    }
                                >
                                    {roles.map((role) => (
                                        <ToggleGroupItem
                                            name="role"
                                            key={role.name}
                                            value={role.name}
                                            aria-label={role.name}
                                            className="block h-auto w-auto p-4 text-left"
                                        >
                                            <div className="font-bold">
                                                {role.display_name}
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                {role.description}
                                            </div>
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>

                                <InputError message={form.errors.role} />
                            </Field>
                        </FieldGroup>
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={form.processing}
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : null}
                            <FormattedMessage defaultMessage="Save Changes" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
