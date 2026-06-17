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
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/companies/dashboard/teams';
import { useForm } from '@inertiajs/react';
import { KeyRoundIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export default function EditTeamAccountButton({
    team,
    canManageMembers,
}: {
    team: any;
    canManageMembers: boolean;
}) {
    const intl = useIntl();
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

        form.transform(() => payload);
        form.put(update({ company: company.username, team: team.id }).url, {
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
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Update credentials',
                            })}
                        >
                            <KeyRoundIcon className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <FormattedMessage defaultMessage="Update email or password" />
                </TooltipContent>
            </Tooltip>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <PencilIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                <FormattedMessage defaultMessage="Update Team Account" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Change the team member email address or set a new password." />
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-5">
                        <FieldGroup>
                            <Field>
                                <Label htmlFor={`email-${team.id}`}>
                                    <FormattedMessage defaultMessage="Email" />
                                </Label>
                                <Input
                                    id={`email-${team.id}`}
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.email} />
                            </Field>

                            <Field>
                                <Label htmlFor={`password-${team.id}`}>
                                    <FormattedMessage defaultMessage="New Password" />
                                </Label>
                                <Input
                                    id={`password-${team.id}`}
                                    type="password"
                                    placeholder={intl.formatMessage({
                                        defaultMessage:
                                            'Leave blank to keep the current password',
                                    })}
                                    value={form.data.password}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.password} />
                            </Field>

                            <Field>
                                <Label
                                    htmlFor={`password-confirmation-${team.id}`}
                                >
                                    <FormattedMessage defaultMessage="Confirm New Password" />
                                </Label>
                                <Input
                                    id={`password-confirmation-${team.id}`}
                                    type="password"
                                    placeholder={intl.formatMessage({
                                        defaultMessage:
                                            'Repeat the new password',
                                    })}
                                    value={form.data.password_confirmation}
                                    onChange={(event) =>
                                        form.setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                />
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
