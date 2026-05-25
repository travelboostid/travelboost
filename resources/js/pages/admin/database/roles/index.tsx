import type { Company } from '@/api/model';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataTable } from '@/hooks/use-data-table';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Text } from 'lucide-react';
import { useMemo } from 'react';
import CreateButton from './components/create-button';
import DeleteButton from './components/delete-button';
import EditButton from './components/edit-button';
import { EmptyRoles } from './components/empty-roles';
dayjs.extend(relativeTime);

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

type PageProps = {
    data: {
        data: Company[];
        total: number;
    };
    permissions: any[];
};

export default function Page({ data, permissions }: PageProps) {
    const columns = useMemo<ColumnDef<Company>[]>(
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
                enableSorting: true,
                enableHiding: false,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }: { column: Column<Company, unknown> }) => (
                    <DataTableColumnHeader column={column} label="Name" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
                meta: {
                    label: 'Name',
                    placeholder: 'Search names...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'display_name',
                accessorKey: 'display_name',
                header: ({ column }: { column: Column<Company, unknown> }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Display Name"
                    />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
            },
            {
                id: 'description',
                accessorKey: 'description',
                header: ({ column }: { column: Column<Company, unknown> }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Description"
                    />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
            },
            {
                id: 'permissions',
                header: ({ column }: { column: Column<Company, unknown> }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Permissions"
                    />
                ),
                cell: ({ cell }) => (
                    <RolePermissions role={cell.row.original} />
                ),
            },
            {
                id: 'actions',
                cell: ({ cell }) => {
                    return (
                        <div className="flex gap-1">
                            <EditButton
                                role={cell.row.original}
                                permissions={permissions}
                            />
                            <DeleteButton role={cell.row.original} />
                        </div>
                    );
                },
                size: 32,
            },
        ],
        [permissions],
    );

    const { table } = useDataTable({
        queryKeys: {
            perPage: 'per_page',
            page: 'page',
        },
        data: data.data,
        columns,
        pageCount: 1,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'id', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            breadcrumb={[{ title: 'Database' }, { title: 'Roles' }]}
            applet={<CreateButton permissions={permissions} />}
        >
            <div className="p-4">
                <DataTable table={table} renderEmptyState={<EmptyRoles />}>
                    <DataTableToolbar table={table} />
                </DataTable>
            </div>
        </AdminDashboardLayout>
    );
}
