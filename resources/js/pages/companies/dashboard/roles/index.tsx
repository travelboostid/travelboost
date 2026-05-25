import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_PHOTO } from '@/config';
import { Head, router } from '@inertiajs/react';
import AddRoleButton from './components/add-role-button';
import DeleteRoleButton from './components/delete-role-button';
import EditRoleButton from './components/edit-role-button';

function RolePermissions({ role }: { role: any }) {
    const permissionsToDisplay = role.permissions.slice(0, 3);
    const remainingPermissionsCount =
        role.permissions.length - permissionsToDisplay.length;

    return (
        <div>
            {permissionsToDisplay.map((perm: any) => (
                <Tooltip key={perm.id}>
                    <TooltipTrigger>
                        <Badge key={perm.id} className="mr-1 mb-1">
                            {perm.name}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        {perm.description || 'No description provided.'}
                    </TooltipContent>
                </Tooltip>
            ))}
            {remainingPermissionsCount > 0 && (
                <Badge className="mr-1 mb-1">
                    +{remainingPermissionsCount} more
                </Badge>
            )}
        </div>
    );
}

function RoleUsers({ role }: { role: any }) {
    const usersToDisplay = role.users.slice(0, 3);
    const remainingUsersCount = role.users.length - usersToDisplay.length;

    return (
        <AvatarGroup className="grayscale">
            {usersToDisplay.map((user: any) => (
                <Tooltip>
                    <TooltipTrigger>
                        <Avatar key={user.id}>
                            <AvatarImage
                                src={user.photoUrl || DEFAULT_PHOTO}
                                alt={user.name}
                            />
                            <AvatarFallback>
                                {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{user.name}</TooltipContent>
                </Tooltip>
            ))}
            {remainingUsersCount > 0 && (
                <AvatarGroupCount>+{remainingUsersCount}</AvatarGroupCount>
            )}
        </AvatarGroup>
    );
}

type PermissionToggleProps = {
    roleId: number;
    roleName: string;
    permissionId: number;
    checked: boolean;
};

export function PermissionToggle({
    roleId,
    roleName,
    permissionId,
    checked,
}: PermissionToggleProps) {
    const isSuperAdmin = roleName.endsWith('superadmin');

    const handleChange = (value: boolean) => {
        if (isSuperAdmin) return;

        router.post('/roles/permission-toggle', {
            role_id: roleId,
            permission_id: permissionId,
            enabled: value,
        });
    };

    return (
        <Checkbox
            checked={checked}
            disabled={isSuperAdmin}
            onCheckedChange={(value) => handleChange(Boolean(value))}
        />
    );
}

type Props = {
    roles: any[];
    permissions: any[];
};

export default function Roles({ roles, permissions }: Props) {
    return (
        <CompanyDashboardLayout
            breadcrumb={[{ title: 'Settings' }, { title: 'Roles' }]}
            openMenuIds={['settings']}
            activeMenuIds={[`settings.roles`]}
            applet={<AddRoleButton permissions={permissions} />}
            containerClassName="p-4"
        >
            <Head title="Roles" />

            <div className="[&>div]:rounded-sm [&>div]:border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Role Description</TableHead>
                            <TableHead>Assigned Permissions</TableHead>
                            <TableHead>Assigned Users</TableHead>
                            <TableHead className="w-0">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell>
                                    <div className="font-semibold">
                                        {role.display_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {role.name.split(':')?.pop() || ''}
                                    </div>
                                </TableCell>
                                <TableCell>{role.description}</TableCell>
                                <TableCell>
                                    <RolePermissions role={role} />
                                </TableCell>
                                <TableCell>
                                    <RoleUsers role={role} />
                                </TableCell>
                                <TableCell className="flex gap-1">
                                    <DeleteRoleButton role={role} />
                                    <EditRoleButton
                                        role={role}
                                        permissions={permissions}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CompanyDashboardLayout>
    );
}
