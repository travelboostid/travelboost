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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { invite } from '@/routes/companies/dashboard/teams';
import { useForm } from '@inertiajs/react';
import { PlusIcon, UserPlusIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

export default function InviteTeamButton({
    roles,
    children,
}: {
    roles: any[];
    children?: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const { company } = usePageSharedDataProps();

    const form = useForm({
        name: '',
        email: '',
        username: '',
        password: '',
        password_confirmation: '',
        role: '' as string,
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
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
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        {children || (
                            <Button>
                                <PlusIcon />
                                Add Team Member
                            </Button>
                        )}
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Add team member</TooltipContent>
            </Tooltip>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <UserPlusIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                Add Team Member
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                Create a team account that can sign in
                                immediately after it is added.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-5">
                        <FieldGroup>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Full name"
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.name} />
                                </Field>

                                <Field>
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        placeholder="Username"
                                        value={form.data.username}
                                        onChange={(event) =>
                                            form.setData(
                                                'username',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.username}
                                    />
                                </Field>
                            </div>

                            <Field>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
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

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        value={form.data.password}
                                        onChange={(event) =>
                                            form.setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.password}
                                    />
                                </Field>

                                <Field>
                                    <Label htmlFor="password_confirmation">
                                        Confirm Password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        placeholder="Confirm password"
                                        value={form.data.password_confirmation}
                                        onChange={(event) =>
                                            form.setData(
                                                'password_confirmation',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>

                            <Field>
                                <Label htmlFor="role">Role</Label>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    spacing={2}
                                    size="lg"
                                    className="grid grid-cols-1 gap-2 rounded-xl"
                                    value={form.data.role}
                                    onValueChange={(value) =>
                                        form.setData('role', value)
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
                                            <div className="text-xs text-muted-foreground">
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
                            Create Account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
