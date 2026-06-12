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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/companies/dashboard/roles';
import { useForm } from '@inertiajs/react';
import { EditIcon, ShieldPlusIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';
import PermissionsSelector from './permissions-selector';
import { isProtectedCompanyRole } from './role-utils';

export default function EditRoleButton({
    role,
    permissions,
}: {
    role: any;
    permissions: any[];
}) {
    const intl = useIntl();
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
            onError: () => {
                setOpen(true);
                toast.error(
                    intl.formatMessage({
                        defaultMessage: 'Failed to update role',
                    }),
                );
            },
            onSuccess: () => {
                setOpen(false);
                toast.success(
                    intl.formatMessage({
                        defaultMessage: 'Role updated successfully',
                    }),
                );
            },
        });
    };

    const shouldDisabled = isProtectedCompanyRole(role.name);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={intl.formatMessage({
                        defaultMessage: 'Edit role',
                    })}
                >
                    <EditIcon className="size-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldPlusIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                <FormattedMessage defaultMessage="Edit Role" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Update the details of the role. Click update role when you're done." />
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-5">
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="name">
                                    <FormattedMessage defaultMessage="Code" />
                                </Label>
                                <Input
                                    name="name"
                                    value={form.data.name}
                                    onChange={(e) => {
                                        const formattedValue = (
                                            e.target.value || ''
                                        )
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
                                <Label htmlFor="display_name">
                                    <FormattedMessage defaultMessage="Display Name" />
                                </Label>
                                <Input
                                    name="display_name"
                                    value={form.data.display_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'display_name',
                                            e.target.value,
                                        )
                                    }
                                />

                                <InputError
                                    message={form.errors.display_name}
                                />
                            </Field>
                            <Field>
                                <Label htmlFor="description">
                                    <FormattedMessage defaultMessage="Description" />
                                </Label>
                                <Input
                                    name="description"
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.description} />
                            </Field>
                            <Field>
                                <Label>
                                    <FormattedMessage defaultMessage="Permissions" />
                                </Label>
                                <PermissionsSelector
                                    disabled={shouldDisabled}
                                    permissions={permissions}
                                    value={form.data.permissions}
                                    onChange={(value) =>
                                        form.setData('permissions', value)
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
                            <FormattedMessage defaultMessage="Update Role" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
