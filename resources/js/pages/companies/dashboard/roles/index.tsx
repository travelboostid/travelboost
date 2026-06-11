import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_PHOTO } from '@/config';
import { useDataTable } from '@/hooks/use-data-table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { PlusIcon, ShieldIcon, TextIcon } from 'lucide-react';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import AddRoleButton from './components/add-role-button';
import DeleteRoleButton from './components/delete-role-button';
import EditRoleButton from './components/edit-role-button';
import { EmptyRoles } from './components/empty-roles';
import { isProtectedCompanyRole } from './components/role-utils';
import RolesTableActionBar from './components/roles-table-action-bar';

export type RoleRow = {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
    permissions: Array<{
        id: number;
        name: string;
        description?: string | null;
    }>;
    users: Array<{
        id: number;
        name: string;
        photo_url?: string | null;
    }>;
    users_count: number;
};

export type PermissionOption = {
    id: number;
    name: string;
    description?: string | null;
};

export type RolesPageProps = {
    data: {
        data: RoleRow[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    permissions: PermissionOption[];
};

function roleCode(name: string, companyId: number): string {
    return name.replace(`company:${companyId}:`, '');
}

function RolePermissions({ role }: { role: RoleRow }) {
    const permissionsToDisplay = role.permissions.slice(0, 3);
    const remainingPermissionsCount =
        role.permissions.length - permissionsToDisplay.length;

    return (
        <div className="flex max-w-[280px] flex-wrap gap-1">
            {permissionsToDisplay.map((perm) => (
                <Tooltip key={perm.id}>
                    <TooltipTrigger asChild>
                        <Badge variant="secondary" className="font-normal">
                            {perm.name}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        {perm.description || 'No description provided.'}
                    </TooltipContent>
                </Tooltip>
            ))}
            {remainingPermissionsCount > 0 ? (
                <Badge variant="outline" className="font-normal">
                    +{remainingPermissionsCount} more
                </Badge>
            ) : null}
        </div>
    );
}

function RoleUsers({ role }: { role: RoleRow }) {
    const usersToDisplay = role.users.slice(0, 3);
    const remainingUsersCount = role.users_count - usersToDisplay.length;

    if (role.users_count === 0) {
        return (
            <span className="text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="No users" />
            </span>
        );
    }

    return (
        <AvatarGroup className="grayscale">
            {usersToDisplay.map((user) => (
                <Tooltip key={user.id}>
                    <TooltipTrigger asChild>
                        <Avatar className="size-8 border">
                            <AvatarImage
                                src={user.photo_url || DEFAULT_PHOTO}
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
            {remainingUsersCount > 0 ? (
                <AvatarGroupCount>+{remainingUsersCount}</AvatarGroupCount>
            ) : null}
        </AvatarGroup>
    );
}

export default function Roles({ data, permissions }: RolesPageProps) {
    const { company, auth } = usePageSharedDataProps();
    const canManageRoles = auth.permissions.includes('role.mutation');

    const columns = useMemo<ColumnDef<RoleRow>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() &&
                                'indeterminate')
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                size: 32,
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: 'display_name',
                accessorKey: 'display_name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Role" />
                ),
                cell: ({ row }) => {
                    const role = row.original;
                    const code = roleCode(role.name, company.id);

                    return (
                        <div className="min-w-[180px]">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className="font-semibold text-foreground"
                                    title={role.display_name}
                                >
                                    {role.display_name}
                                </span>
                                {isProtectedCompanyRole(role.name) ? (
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        Owner
                                    </Badge>
                                ) : null}
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">
                                {code}
                            </p>
                        </div>
                    );
                },
                meta: {
                    label: 'Role name',
                    placeholder: 'Search role name...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Code" />
                ),
                cell: ({ row }) => (
                    <span className="font-mono text-sm text-muted-foreground">
                        {roleCode(row.original.name, company.id)}
                    </span>
                ),
            },
            {
                id: 'description',
                accessorKey: 'description',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Description"
                    />
                ),
                cell: ({ row }) => (
                    <p
                        className="max-w-[260px] truncate text-sm text-muted-foreground"
                        title={row.original.description || ''}
                    >
                        {row.original.description || '-'}
                    </p>
                ),
            },
            {
                id: 'permissions',
                accessorFn: (row) =>
                    row.permissions
                        .map((permission) => permission.name)
                        .join(' '),
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Permissions"
                    />
                ),
                cell: ({ row }) => <RolePermissions role={row.original} />,
                enableSorting: false,
            },
            {
                id: 'users',
                accessorFn: (row) => row.users_count,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Users" />
                ),
                cell: ({ row }) => <RoleUsers role={row.original} />,
                enableSorting: false,
            },
            {
                id: 'actions',
                enableSorting: false,
                enableHiding: false,
                header: () => (
                    <div className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Actions
                    </div>
                ),
                cell: ({ row }) => {
                    if (!canManageRoles) {
                        return null;
                    }

                    return (
                        <div className="flex items-center justify-end gap-1">
                            <EditRoleButton
                                role={row.original}
                                permissions={permissions}
                            />
                            <DeleteRoleButton role={row.original} />
                        </div>
                    );
                },
            },
        ],
        [canManageRoles, company.id, permissions],
    );

    const { table } = useDataTable({
        queryKeys: { perPage: 'per_page', page: 'page' },
        data: data.data,
        columns,
        pageCount: data.last_page,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'display_name', desc: false }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[{ title: 'Settings' }, { title: 'Access Roles' }]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.roles']}
            applet={
                canManageRoles ? (
                    <AddRoleButton permissions={permissions}>
                        <Button className="shadow-sm">
                            <PlusIcon />
                            <FormattedMessage defaultMessage="Add role" />
                        </Button>
                    </AddRoleButton>
                ) : undefined
            }
        >
            <Head title="Access Roles" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-20 sm:p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ShieldIcon className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    <FormattedMessage defaultMessage="Access roles" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage
                                        defaultMessage="{count} roles · define permissions and control team access."
                                        values={{ count: data.total }}
                                    />
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <DataTable
                        table={table}
                        className="gap-0"
                        tableContainerClassName="rounded-none border-0"
                        paginationClassName="border-t px-4 py-3"
                        renderEmptyState={<EmptyRoles />}
                        actionBar={<RolesTableActionBar table={table} />}
                    >
                        <DataTableToolbar
                            table={table}
                            className="border-b px-4 py-3"
                        />
                    </DataTable>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
