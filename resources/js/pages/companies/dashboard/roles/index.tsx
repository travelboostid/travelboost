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
        <Badge key={perm.id} className="mr-1 mb-1">
          {perm.name}
        </Badge>
      ))}
      {remainingPermissionsCount > 0 && (
        <Badge className="mr-1 mb-1">+{remainingPermissionsCount} more</Badge>
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
        <Avatar key={user.id}>
          <AvatarImage src={user.photoUrl || DEFAULT_PHOTO} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
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
      openMenuIds={['settings']}
      activeMenuIds={[`settings.profile`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Settings' },
        { title: 'Roles' },
      ]}
      applet={<AddRoleButton permissions={permissions} />}
    >
      <Head title="Roles" />

      <div className="p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-background w-[250px]">
                Role Code
              </TableHead>
              <TableHead className="sticky left-0 z-20 bg-background w-[250px]">
                Role Name
              </TableHead>
              <TableHead className="sticky left-0 z-20 bg-background w-[250px]">
                Role Description
              </TableHead>
              <TableHead className="sticky left-0 z-20 bg-background w-[250px]">
                Assigned Permissions
              </TableHead>
              <TableHead className="sticky left-0 z-20 bg-background w-[250px]">
                Assigned Users
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.display_name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <RolePermissions role={role} />
                </TableCell>
                <TableCell>
                  <RoleUsers role={role} />
                </TableCell>
                <TableCell className="flex gap-1">
                  <DeleteRoleButton role={role} />
                  <EditRoleButton role={role} permissions={permissions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CompanyDashboardLayout>
  );
}
