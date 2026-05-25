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
import { store } from '@/routes/companies/dashboard/roles';
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
            <DialogTrigger>
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="default" aria-label="Add role">
                            <PlusIcon />
                            Add Role
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Role</TooltipContent>
                </Tooltip>
            </DialogTrigger>

            <DialogContent className="flex flex-col overflow-y-auto max-h-screen">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <DialogHeader>
                        <DialogTitle>Add Role</DialogTitle>
                        <DialogDescription>
                            Add a new role to your company and assign
                            permissions to it. You can always edit the role
                            later to update its permissions or details.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="name">Code</Label>
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
                            <Label htmlFor="display_name">Display Name</Label>
                            <Input
                                name="display_name"
                                value={form.data.display_name}
                                onChange={(e) =>
                                    form.setData('display_name', e.target.value)
                                }
                            />

                            <InputError message={form.errors.display_name} />
                        </Field>
                        <Field>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                name="description"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                            <InputError message={form.errors.description} />
                        </Field>
                        <Field>
                            <Label>Permissions</Label>
                            <PermissionsSelector
                                permissions={permissions}
                                value={form.data.permissions}
                                onChange={(value) =>
                                    form.setData('permissions', value)
                                }
                            />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Creating...' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
