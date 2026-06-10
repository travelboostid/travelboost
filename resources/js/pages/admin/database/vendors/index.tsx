import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { edit } from '@/routes/admin/database/vendors';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, Text } from 'lucide-react';
import { useMemo } from 'react';
import { CompaniesTableActionBar } from '../shared/companies-table-action-bar';
import { CompanyRowActions } from '../shared/company-row-actions';
import type {
    AdminCompanyRow,
    PaginatedCompanies,
} from '../shared/company-types';
import { EmptyVendors } from './components/empty-vendors';

export default function VendorsPage({ data }: { data: PaginatedCompanies }) {
    const columns = useMemo<ColumnDef<AdminCompanyRow>[]>(
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
                enableHiding: false,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Name" />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[160px]">
                        <div className="font-medium">{row.original.name}</div>
                        <div className="text-xs text-muted-foreground">
                            @{row.original.username}
                        </div>
                    </div>
                ),
                meta: {
                    label: 'Name',
                    placeholder: 'Search names...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'username',
                accessorKey: 'username',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Username" />
                ),
                cell: ({ cell }) => (
                    <div className="text-sm">@{cell.getValue<string>()}</div>
                ),
                meta: {
                    label: 'Username',
                    placeholder: 'Search usernames...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Email" />
                ),
                cell: ({ cell }) => (
                    <div className="text-sm">{cell.getValue<string>()}</div>
                ),
                meta: {
                    label: 'Email',
                    placeholder: 'Search email...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'phone',
                accessorKey: 'phone',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Phone" />
                ),
                cell: ({ cell }) => (
                    <div className="text-sm">
                        {cell.getValue<string>() || '—'}
                    </div>
                ),
                meta: {
                    label: 'Phone',
                    placeholder: 'Search phone...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'customer_service_phone',
                accessorKey: 'customer_service_phone',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="CS Phone" />
                ),
                cell: ({ cell }) => (
                    <div className="text-sm">
                        {cell.getValue<string>() || '—'}
                    </div>
                ),
            },
            {
                id: 'address',
                accessorKey: 'address',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Address" />
                ),
                cell: ({ cell }) => (
                    <div className="max-w-[220px] truncate text-sm">
                        {cell.getValue<string>() || '—'}
                    </div>
                ),
                meta: {
                    label: 'Address',
                    placeholder: 'Search address...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Join Date" />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<string | null>();

                    return (
                        <div className="text-sm">
                            {createdAt
                                ? dayjs(createdAt).format('DD MMM YYYY')
                                : '—'}
                        </div>
                    );
                },
                meta: {
                    label: 'Join Date',
                    placeholder: 'Search join date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <CompanyRowActions
                        company={row.original}
                        entityLabel="Vendor"
                        editHref={edit({ vendor: row.original.id }).url}
                    />
                ),
                size: 40,
            },
        ],
        [],
    );

    const { table } = useDataTable({
        queryKeys: {
            perPage: 'per_page',
            page: 'page',
        },
        data: data.data,
        columns,
        pageCount: data.last_page,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'created_at', desc: true }],
            columnPinning: { right: ['actions'] },
            columnVisibility: {
                username: false,
                address: false,
            },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.vendors']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'Vendor' }]}
        >
            <DataTable
                table={table}
                renderEmptyState={<EmptyVendors />}
                actionBar={
                    <CompaniesTableActionBar table={table} entity="vendor" />
                }
            >
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
