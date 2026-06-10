import type { MediaResource } from '@/api/model';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { PhotoPicker } from '@/components/media/photo-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/admin/database/users';
import { Head, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

type UserRoleOption = {
    name: string;
    display_name: string;
};

type EditUserPageProps = {
    user: {
        id: number;
        name: string;
        username: string;
        email: string;
        phone: string | null;
        address: string | null;
        photo_id: number | null;
        photo_url?: string | null;
        gender: string | null;
        status: string;
        note: string | null;
        created_at: string;
        email_verified_at: string | null;
        company?: { id: number; name: string; username: string } | null;
        companies?: Array<{ id: number; name: string; username: string }>;
        roles?: Array<{ name: string; display_name?: string }>;
    };
    userRoles: UserRoleOption[];
};

function identityRoleNames(
    roles: EditUserPageProps['user']['roles'] = [],
): string[] {
    return roles
        .map((role) => role.name)
        .filter((name) => name.startsWith('user:'));
}

function companyRoleNames(
    roles: EditUserPageProps['user']['roles'] = [],
): string[] {
    return roles
        .map((role) => role.name)
        .filter((name) => !name.startsWith('user:'));
}

export default function EditUserPage({ user, userRoles }: EditUserPageProps) {
    const profileForm = useForm({
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        photo_id: user.photo_id,
        gender: user.gender ?? 'unspecified',
        status: user.status,
        note: user.note ?? '',
        roles: identityRoleNames(user.roles),
    });

    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleProfileUpdate = () => {
        profileForm.put(update({ user: user.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User updated successfully');
            },
        });
    };

    const handlePasswordUpdate = () => {
        passwordForm.put(`/admin/database/users/${user.id}/password`, {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                toast.success('Password updated successfully');
            },
        });
    };

    const toggleRole = (roleName: string, checked: boolean) => {
        const currentRoles = profileForm.data.roles;

        profileForm.setData(
            'roles',
            checked
                ? [...currentRoles, roleName]
                : currentRoles.filter((role) => role !== roleName),
        );
    };

    const companyRoles = companyRoleNames(user.roles);

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.users']}
            openMenuIds={['database']}
            breadcrumb={[
                { title: 'Database' },
                { title: 'User Management' },
                { title: user.name || user.username },
            ]}
        >
            <Head title={`Edit ${user.name || user.username}`} />

            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            Update account details and notes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                            <PhotoPicker
                                owner={{ type: 'user', id: user.id }}
                                defaultValue={user.photo_url}
                                onChange={(media) =>
                                    profileForm.setData(
                                        'photo_id',
                                        (media as MediaResource)?.id ?? null,
                                    )
                                }
                            />
                            <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
                                <p className="text-sm font-medium text-foreground">
                                    Profile photo
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Upload a new photo or pick an existing one
                                    from this user&apos;s media library.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="name">Name</FieldLabel>
                                <Input
                                    id="name"
                                    value={profileForm.data.name}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError>
                                    {profileForm.errors.name}
                                </FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="username">
                                    Username
                                </FieldLabel>
                                <Input
                                    id="username"
                                    value={profileForm.data.username}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'username',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError>
                                    {profileForm.errors.username}
                                </FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError>
                                    {profileForm.errors.email}
                                </FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                                <Input
                                    id="phone"
                                    value={profileForm.data.phone}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError>
                                    {profileForm.errors.phone}
                                </FieldError>
                            </Field>
                            <Field className="sm:col-span-2">
                                <FieldLabel htmlFor="address">
                                    Address
                                </FieldLabel>
                                <Input
                                    id="address"
                                    value={profileForm.data.address}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'address',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError>
                                    {profileForm.errors.address}
                                </FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                                <Select
                                    value={profileForm.data.gender}
                                    onValueChange={(value) =>
                                        profileForm.setData('gender', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Gender</SelectLabel>
                                            <SelectItem value="unspecified">
                                                Unspecified
                                            </SelectItem>
                                            <SelectItem value="male">
                                                Male
                                            </SelectItem>
                                            <SelectItem value="female">
                                                Female
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>
                                    {profileForm.errors.gender}
                                </FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="status">Status</FieldLabel>
                                <Select
                                    value={profileForm.data.status}
                                    onValueChange={(value) =>
                                        profileForm.setData('status', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Status</SelectLabel>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                            <SelectItem value="suspended">
                                                Suspended
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>
                                    {profileForm.errors.status}
                                </FieldError>
                            </Field>
                            <Field className="sm:col-span-2">
                                <FieldLabel htmlFor="note">Note</FieldLabel>
                                <Textarea
                                    id="note"
                                    rows={4}
                                    value={profileForm.data.note}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'note',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional note about this user."
                                />
                                <FieldError>
                                    {profileForm.errors.note}
                                </FieldError>
                            </Field>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Identity roles
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Platform-level roles such as customer,
                                    vendor, or admin. Company team roles are
                                    managed separately.
                                </p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {userRoles.map((role) => {
                                    const checked =
                                        profileForm.data.roles.includes(
                                            role.name,
                                        );

                                    return (
                                        <label
                                            key={role.name}
                                            htmlFor={`role-${role.name}`}
                                            className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                                        >
                                            <Checkbox
                                                id={`role-${role.name}`}
                                                checked={checked}
                                                onCheckedChange={(value) =>
                                                    toggleRole(
                                                        role.name,
                                                        value === true,
                                                    )
                                                }
                                            />
                                            <span className="text-sm">
                                                {role.display_name ||
                                                    role.name.replace(
                                                        'user:',
                                                        '',
                                                    )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <FieldError>{profileForm.errors.roles}</FieldError>
                        </div>

                        <Button
                            type="button"
                            onClick={handleProfileUpdate}
                            disabled={profileForm.processing}
                        >
                            Save profile
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Membership</CardTitle>
                        <CardDescription>
                            Read-only context for support and auditing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                User ID
                            </p>
                            <p className="text-sm">{user.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Joined
                            </p>
                            <p className="text-sm">
                                {dayjs(user.created_at).format(
                                    'DD MMM YYYY, HH:mm',
                                )}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Email verified
                            </p>
                            <p className="text-sm">
                                {user.email_verified_at
                                    ? dayjs(user.email_verified_at).format(
                                          'DD MMM YYYY, HH:mm',
                                      )
                                    : 'Not verified'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Customer company
                            </p>
                            <p className="text-sm">
                                {user.company?.name ?? '—'}
                            </p>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Company memberships
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(user.companies ?? []).length > 0 ? (
                                    user.companies?.map((company) => (
                                        <Badge
                                            key={company.id}
                                            variant="secondary"
                                        >
                                            {company.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        —
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Company roles
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {companyRoles.length > 0 ? (
                                    companyRoles.map((role) => (
                                        <Badge key={role} variant="outline">
                                            {role}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        —
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>
                            Set a new password for this user. They will not need
                            to provide their current password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="password">
                                    New password
                                </FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordForm.data.password}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError>
                                    {passwordForm.errors.password}
                                </FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password_confirmation">
                                    Confirm password
                                </FieldLabel>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldError>
                                    {passwordForm.errors.password_confirmation}
                                </FieldError>
                            </Field>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handlePasswordUpdate}
                            disabled={passwordForm.processing}
                        >
                            Update password
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AdminDashboardLayout>
    );
}
