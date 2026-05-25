import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Button } from '@/components/ui/button';
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
import { update } from '@/routes/admin/database/users';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

type EditUserPageProps = {
    user: any;
};

export default function EditUserPage({ user }: EditUserPageProps) {
    const form = useForm({
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        photo_id: user.photo_id,
        gender: user.gender,
        status: user.status,
        meta: user.meta,
        note: user.note,
    });

    const handleUpdate = () => {
        form.put(update({ id: user.id }).url, {
            preserveScroll: true,
        });
    };

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.users']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'User Management' }]}
        >
            <form className="grid grid-cols-2 gap-4">
                <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                        id="name"
                        placeholder="Name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                    <FieldError>{form.errors.name}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                        id="username"
                        placeholder="Username"
                        value={form.data.username}
                        onChange={(e) =>
                            form.setData('username', e.target.value)
                        }
                    />
                    <FieldError>{form.errors.username}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        placeholder="Email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                    />
                    <FieldError>{form.errors.email}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                        id="phone"
                        placeholder="Phone"
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                    />
                    <FieldError>{form.errors.phone}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <Input
                        id="address"
                        placeholder="Address"
                        value={form.data.address}
                        onChange={(e) =>
                            form.setData('address', e.target.value)
                        }
                    />
                    <FieldError>{form.errors.address}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="gender">Gender</FieldLabel>
                    <Select
                        name="gender"
                        value={form.data.gender || 'unspecified'}
                        onValueChange={(value) => form.setData('gender', value)}
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
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FieldError>{form.errors.status}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="status">Status</FieldLabel>
                    <Select
                        name="status"
                        value={form.data.status || 'active'}
                        onValueChange={(value) => form.setData('status', value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Status</SelectLabel>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                                <SelectItem value="suspended">
                                    Suspended
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FieldError>{form.errors.status}</FieldError>
                </Field>
                <Button
                    variant="default"
                    className="col-span-2"
                    onClick={handleUpdate}
                    disabled={form.processing}
                >
                    Update
                </Button>
            </form>
        </AdminDashboardLayout>
    );
}
