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
import { store } from '@/routes/companies/dashboard/roles';
import { useForm } from '@inertiajs/react';
import { PlusIcon, ShieldPlusIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';
import PermissionsSelector from './permissions-selector';

export default function AddRoleButton({
    permissions,
    children,
}: {
    permissions: any[];
    children?: ReactNode;
}) {
    const intl = useIntl();
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
            onError: () => {
                setOpen(true);
                toast.error(
                    intl.formatMessage({
                        defaultMessage: 'Failed to create role',
                    }),
                );
            },
            onSuccess: () => {
                form.reset();
                setOpen(false);
                toast.success(
                    intl.formatMessage({
                        defaultMessage: 'Role created successfully',
                    }),
                );
            },
        });
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            form.reset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children ?? (
                    <Button
                        variant="default"
                        aria-label={intl.formatMessage({
                            defaultMessage: 'Add role',
                        })}
                    >
                        <PlusIcon />
                        <FormattedMessage defaultMessage="Add Role" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldPlusIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                <FormattedMessage defaultMessage="Add Role" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Add a new role to your company and assign permissions to it. You can always edit the role later to update its permissions or details." />
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
                            <FormattedMessage defaultMessage="Create Role" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
