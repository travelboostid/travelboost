import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
    Building2Icon,
    CalendarIcon,
    CircleDashedIcon,
    TextIcon,
    UserCircleIcon,
    UserIcon,
    UsersIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
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
    const intl = useIntl();

    const statusOptions = useMemo(
        () => [
            {
                label: intl.formatMessage({ defaultMessage: 'Active' }),
                value: 'active',
            },
            {
                label: intl.formatMessage({ defaultMessage: 'Pending' }),
                value: 'pending',
            },
            {
                label: intl.formatMessage({ defaultMessage: 'Inactive' }),
                value: 'inactive',
            },
            {
                label: intl.formatMessage({ defaultMessage: 'Suspended' }),
                value: 'suspended',
            },
            {
                label: intl.formatMessage({ defaultMessage: 'Rejected' }),
                value: 'rejected',
            },
        ],
        [intl],
    );

    const genderOptions = useMemo(
        () => [
            {
                label: intl.formatMessage({ defaultMessage: 'Male' }),
                value: 'male',
            },
            {
                label: intl.formatMessage({ defaultMessage: 'Female' }),
                value: 'female',
            },
            {
                label: intl.formatMessage({
                    defaultMessage: 'Unspecified',
                }),
                value: 'unspecified',
            },
        ],
        [intl],
    );

    const registrationSourceOptions = useMemo(
        () => [
            {
                label: intl.formatMessage({
                    defaultMessage: 'Direct registration',
                }),
                value: 'direct',
            },
            {
                label: intl.formatMessage({ defaultMessage: 'Via agent' }),
                value: 'agent',
            },
        ],
        [intl],
    );

    const columns = useMemo<ColumnDef<CustomerRow>[]>(
        () => [
            {
                id: 'actions',
                header: () => (
                    <div className="px-2 text-center text-[11px] font-bold tracking-wider text-primary">
                        <FormattedMessage defaultMessage="Actions" />
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
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Customer',
                        })}
                    />
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
                    label: intl.formatMessage({
                        defaultMessage: 'Customer name',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search name...',
                    }),
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'username',
                accessorKey: 'username',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Username',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span className="font-mono text-sm text-muted-foreground">
                        @{row.original.username || '-'}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Username',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search username...',
                    }),
                    variant: 'text',
                    icon: UserIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Email',
                        })}
                    />
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
                    label: intl.formatMessage({
                        defaultMessage: 'Email',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search email...',
                    }),
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'phone',
                accessorKey: 'phone',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Phone',
                        })}
                    />
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
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Agent',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <Badge
                        variant="secondary"
                        className="max-w-[180px] truncate font-medium uppercase"
                    >
                        {row.original.company?.name ?? (
                            <FormattedMessage defaultMessage="Direct" />
                        )}
                    </Badge>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Agent name',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search agent...',
                    }),
                    variant: 'text',
                    icon: Building2Icon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'registration_source',
                accessorFn: (row) => (row.company?.name ? 'agent' : 'direct'),
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Source',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <Badge variant="outline" className="capitalize">
                        {row.original.company?.name ? (
                            <FormattedMessage defaultMessage="Via agent" />
                        ) : (
                            <FormattedMessage defaultMessage="Direct" />
                        )}
                    </Badge>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Registration source',
                    }),
                    variant: 'select',
                    options: registrationSourceOptions,
                    icon: UsersIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'address',
                accessorKey: 'address',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Address',
                        })}
                    />
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
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Gender',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span className="capitalize text-sm">
                        {row.original.gender || '-'}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Gender',
                    }),
                    variant: 'multiSelect',
                    options: genderOptions,
                    icon: UserIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Status',
                        })}
                    />
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
                    label: intl.formatMessage({
                        defaultMessage: 'Status',
                    }),
                    variant: 'multiSelect',
                    options: statusOptions,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Join date',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                        {dayjs(row.original.created_at).format('DD MMM YYYY')}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Join date',
                    }),
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
        ],
        [genderOptions, intl, registrationSourceOptions, statusOptions],
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

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Customers',
                    }),
                },
            ]}
            activeMenuIds={['customers']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Customers',
                })}
            />

            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
                <header>
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <UsersIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Customers" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Browse direct and agent-registered customers. Filters run on the server across your full network." />
                            </p>
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
