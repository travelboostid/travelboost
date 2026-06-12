import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataTable } from '@/hooks/use-data-table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
    Building2Icon,
    CalendarIcon,
    CircleDashedIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    PrinterIcon,
    TextIcon,
    UserCircleIcon,
    UserIcon,
    UsersIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import {
    CustomerActions,
    type CustomerRow,
} from './components/customer-actions';
import { EmptyCustomers } from './components/empty-customers';

type CustomersPageProps = {
    data: {
        data: CustomerRow[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
};

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Rejected', value: 'rejected' },
];

const GENDER_OPTIONS = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Unspecified', value: 'unspecified' },
];

const REGISTRATION_SOURCE_OPTIONS = [
    { label: 'Direct registration', value: 'direct' },
    { label: 'Via agent', value: 'agent' },
];

function statusBadgeClass(status?: string | null): string {
    switch (status) {
        case 'active':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
        case 'pending':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300';
        case 'suspended':
        case 'rejected':
            return 'border-destructive/30 bg-destructive/10 text-destructive';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

export default function CustomersPage({ data }: CustomersPageProps) {
    const { company } = usePageSharedDataProps();
    const columns = useMemo<ColumnDef<CustomerRow>[]>(
        () => [
            {
                id: 'actions',
                header: () => (
                    <div className="px-2 text-center text-[11px] font-bold tracking-wider text-primary">
                        Actions
                    </div>
                ),
                cell: ({ row }) => <CustomerActions customer={row.original} />,
                enableSorting: false,
                enableHiding: false,
                size: 52,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Customer" />
                ),
                cell: ({ row }) => (
                    <div className="flex min-w-[220px] items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserCircleIcon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p
                                className="truncate font-semibold text-foreground"
                                title={row.original.name}
                            >
                                {row.original.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                @{row.original.username || '-'}
                            </p>
                        </div>
                    </div>
                ),
                meta: {
                    label: 'Customer name',
                    placeholder: 'Search name...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'username',
                accessorKey: 'username',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Username" />
                ),
                cell: ({ row }) => (
                    <span className="font-mono text-sm text-muted-foreground">
                        @{row.original.username || '-'}
                    </span>
                ),
                meta: {
                    label: 'Username',
                    placeholder: 'Search username...',
                    variant: 'text',
                    icon: UserIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Email" />
                ),
                cell: ({ row }) => (
                    <div
                        className="max-w-[220px] truncate text-sm"
                        title={row.original.email || ''}
                    >
                        {row.original.email || '-'}
                    </div>
                ),
                meta: {
                    label: 'Email',
                    placeholder: 'Search email...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'phone',
                accessorKey: 'phone',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Phone" />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm">
                        {row.original.phone || '-'}
                    </span>
                ),
            },
            {
                id: 'agent_name',
                accessorFn: (row) => row.company?.name ?? 'Direct',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Agent" />
                ),
                cell: ({ row }) => (
                    <Badge
                        variant="secondary"
                        className="max-w-[180px] truncate font-medium uppercase"
                    >
                        {row.original.company?.name ?? 'Direct'}
                    </Badge>
                ),
                meta: {
                    label: 'Agent name',
                    placeholder: 'Search agent...',
                    variant: 'text',
                    icon: Building2Icon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'registration_source',
                accessorFn: (row) => (row.company?.name ? 'agent' : 'direct'),
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Source" />
                ),
                cell: ({ row }) => (
                    <Badge variant="outline" className="capitalize">
                        {row.original.company?.name ? 'Via agent' : 'Direct'}
                    </Badge>
                ),
                meta: {
                    label: 'Registration source',
                    variant: 'select',
                    options: REGISTRATION_SOURCE_OPTIONS,
                    icon: UsersIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'address',
                accessorKey: 'address',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Address" />
                ),
                cell: ({ row }) => (
                    <div
                        className="max-w-[220px] truncate text-sm text-muted-foreground"
                        title={row.original.address || '-'}
                    >
                        {row.original.address || '-'}
                    </div>
                ),
            },
            {
                id: 'gender',
                accessorKey: 'gender',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Gender" />
                ),
                cell: ({ row }) => (
                    <span className="capitalize text-sm">
                        {row.original.gender || '-'}
                    </span>
                ),
                meta: {
                    label: 'Gender',
                    variant: 'multiSelect',
                    options: GENDER_OPTIONS,
                    icon: UserIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ row }) => (
                    <Badge
                        variant="outline"
                        className={cn(
                            'capitalize',
                            statusBadgeClass(row.original.status),
                        )}
                    >
                        {row.original.status || '-'}
                    </Badge>
                ),
                meta: {
                    label: 'Status',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Join date" />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                        {dayjs(row.original.created_at).format('DD MMM YYYY')}
                    </span>
                ),
                meta: {
                    label: 'Join date',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
        ],
        [],
    );

    const { table } = useDataTable({
        queryKeys: { perPage: 'per_page', page: 'page' },
        data: data.data,
        columns,
        pageCount: data.last_page,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'created_at', desc: true }],
            columnPinning: { left: ['actions'] },
            columnVisibility: {
                username: false,
                address: false,
                gender: false,
                status: false,
                registration_source: false,
            },
        },
        getRowId: (row) => row.id.toString(),
    });

    const exportQuery =
        typeof window !== 'undefined' ? window.location.search : '';

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[{ title: 'Customers' }]}
            activeMenuIds={['customers']}
        >
            <Head title="Customers" />

            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
                <header className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] via-background to-background shadow-sm">
                    <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <UsersIcon className="size-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                        Customers
                                    </h1>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Browse direct and agent-registered
                                        customers. Filters run on the server
                                        across your full network.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2 rounded-xl"
                                onClick={() =>
                                    window.open(
                                        `/companies/${company.username}/dashboard/customers/print${exportQuery}`,
                                        '_blank',
                                    )
                                }
                            >
                                <PrinterIcon className="size-4" />
                                Print
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                    window.open(
                                        `/companies/${company.username}/dashboard/customers/export/pdf${exportQuery}`,
                                        '_blank',
                                    )
                                }
                            >
                                <FileTextIcon className="size-4" />
                                Export PDF
                            </Button>
                            <Button
                                type="button"
                                className="h-10 gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => {
                                    window.location.href = `/companies/${company.username}/dashboard/customers/export/excel${exportQuery}`;
                                }}
                            >
                                <FileSpreadsheetIcon className="size-4" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <DataTable
                        table={table}
                        className="gap-0"
                        tableContainerClassName="rounded-none border-0"
                        paginationClassName="border-t px-4 py-3"
                        renderEmptyState={<EmptyCustomers />}
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
