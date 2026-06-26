import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    WaitingListScheduleCard,
    type WaitingListScheduleCardData,
} from '@/components/waiting-list/waiting-list-schedule-card';
import { WaitingListStatusBadge } from '@/components/waiting-list/waiting-list-status-badge';
import { useDataTable } from '@/hooks/use-data-table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import {
    resolveWaitingListDisplayStatus,
    waitingListStatusLabel,
} from '@/lib/waiting-list-status';
import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
    Building2Icon,
    CalendarIcon,
    InfoIcon,
    ListIcon,
    MailIcon,
    MoreHorizontalIcon,
    PhoneIcon,
    TextIcon,
    UserCircleIcon,
    UsersIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { EmptyWaitingLists } from './components/empty-waiting-lists';

type WaitingListRow = {
    id: number;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string | null;
    status: string;
    created_at: string;
    tour?: {
        code?: string | null;
        name: string;
    } | null;
    vendor?: {
        name: string;
    } | null;
    created_by_company?: {
        name: string;
    } | null;
    created_by_user?: {
        name: string;
    } | null;
    customer_user?: {
        name: string;
        username?: string | null;
        company?: {
            name: string;
        } | null;
    } | null;
    schedules: WaitingListScheduleCardData[];
};

type WaitingListPageProps = {
    data: {
        data: WaitingListRow[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    permissions: {
        can_manage_queues: boolean;
    };
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function formatCurrency(value: string | number): string {
    return currencyFormatter.format(Number(value) || 0);
}

function resolveSource(row: WaitingListRow): 'dashboard' | 'customer' {
    return row.created_by_company ? 'dashboard' : 'customer';
}

function resolveRequester(row: WaitingListRow): string {
    return (
        row.created_by_company?.name ||
        row.customer_user?.name ||
        row.created_by_user?.name ||
        row.contact_name ||
        '-'
    );
}

export default function WaitingListsPage({
    data,
    permissions,
}: WaitingListPageProps) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const companyType = String(company.type ?? '').toLowerCase();
    const canManageQueues = permissions.can_manage_queues;

    const statusOptions = useMemo(
        () =>
            [
                'pending',
                'contacted',
                'offered',
                'fulfilled',
                'cancelled',
                'expired',
            ].map((value) => ({
                value,
                label: waitingListStatusLabel(value),
            })),
        [],
    );

    const sourceOptions = useMemo(
        () => [
            {
                value: 'dashboard',
                label: intl.formatMessage({
                    defaultMessage: 'Dashboard team',
                }),
            },
            {
                value: 'customer',
                label: intl.formatMessage({
                    defaultMessage: 'Customer form',
                }),
            },
        ],
        [intl],
    );

    const columns = useMemo<ColumnDef<WaitingListRow>[]>(
        () => [
            {
                id: 'id',
                accessorKey: 'id',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Request',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[96px]">
                        <p className="font-semibold tabular-nums text-foreground">
                            WL-{String(row.original.id).padStart(5, '0')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {dayjs(row.original.created_at).format(
                                'DD MMM YYYY',
                            )}
                        </p>
                    </div>
                ),
                size: 110,
            },
            {
                id: 'tour_name',
                accessorFn: (row) => row.tour?.name ?? '',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Tour',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[240px]">
                        <p
                            className="truncate font-semibold text-foreground"
                            title={row.original.tour?.name ?? '-'}
                        >
                            {row.original.tour?.name ?? '-'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{row.original.tour?.code ?? '-'}</span>
                            {companyType === 'agent' && row.original.vendor && (
                                <>
                                    <span>·</span>
                                    <span
                                        className="truncate"
                                        title={row.original.vendor.name}
                                    >
                                        {row.original.vendor.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Tour name',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search tour...',
                    }),
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'tour_code',
                accessorFn: (row) => row.tour?.code ?? '',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Tour Code',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span className="font-mono text-sm text-muted-foreground">
                        {row.original.tour?.code ?? '-'}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Tour code',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search code...',
                    }),
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'contact_name',
                accessorKey: 'contact_name',
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
                                title={row.original.contact_name}
                            >
                                {row.original.contact_name}
                            </p>
                            <p
                                className="truncate text-xs text-muted-foreground"
                                title={row.original.contact_email}
                            >
                                {row.original.contact_email}
                            </p>
                        </div>
                    </div>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Customer name',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search customer...',
                    }),
                    variant: 'text',
                    icon: UsersIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'contact_phone',
                accessorKey: 'contact_phone',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Phone',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm tabular-nums">
                        {row.original.contact_phone || '-'}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Phone',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search phone...',
                    }),
                    variant: 'text',
                    icon: PhoneIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'requester_name',
                accessorFn: (row) => resolveRequester(row),
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Requester',
                        })}
                    />
                ),
                cell: ({ row }) => {
                    const source = resolveSource(row.original);
                    const secondary =
                        source === 'dashboard'
                            ? row.original.created_by_user?.name
                            : row.original.customer_user?.company?.name;

                    return (
                        <div className="min-w-[220px]">
                            <p
                                className="truncate font-semibold text-foreground"
                                title={resolveRequester(row.original)}
                            >
                                {resolveRequester(row.original)}
                            </p>
                            <p
                                className="truncate text-xs text-muted-foreground"
                                title={secondary || ''}
                            >
                                {source === 'dashboard'
                                    ? secondary ||
                                      intl.formatMessage({
                                          defaultMessage: 'Dashboard team',
                                      })
                                    : secondary ||
                                      intl.formatMessage({
                                          defaultMessage: 'Customer form',
                                      })}
                            </p>
                        </div>
                    );
                },
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Requester name',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search requester...',
                    }),
                    variant: 'text',
                    icon: Building2Icon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'source',
                accessorFn: (row) => resolveSource(row),
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
                        {resolveSource(row.original) === 'dashboard' ? (
                            <FormattedMessage defaultMessage="Dashboard team" />
                        ) : (
                            <FormattedMessage defaultMessage="Customer form" />
                        )}
                    </Badge>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Source',
                    }),
                    variant: 'multiSelect',
                    options: sourceOptions,
                    icon: UsersIcon,
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
                    <WaitingListStatusBadge
                        status={resolveWaitingListDisplayStatus(
                            row.original.status,
                            row.original.schedules,
                        )}
                    />
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Status',
                    }),
                    variant: 'multiSelect',
                    options: statusOptions,
                    icon: ListIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'schedules',
                accessorFn: (row) =>
                    row.schedules
                        .map(
                            (schedule) =>
                                schedule.tour_schedule?.departure_date ?? '',
                        )
                        .join(', '),
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Schedules',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[280px] space-y-2">
                        {row.original.schedules.map((schedule) => (
                            <WaitingListScheduleCard
                                key={schedule.id}
                                schedule={schedule}
                                parentStatus={resolveWaitingListDisplayStatus(
                                    row.original.status,
                                    row.original.schedules,
                                )}
                                companyUsername={company.username}
                                canManageQueues={canManageQueues}
                                formatCurrency={formatCurrency}
                            />
                        ))}
                    </div>
                ),
                enableColumnFilter: false,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Requested At',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                        {dayjs(row.original.created_at).format(
                            'DD MMM YYYY HH:mm',
                        )}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Requested at',
                    }),
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'vendor_name',
                accessorFn: (row) => row.vendor?.name ?? '',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Vendor',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.vendor?.name ?? '-'}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Vendor name',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search vendor...',
                    }),
                    variant: 'text',
                    icon: Building2Icon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'contact_email',
                accessorKey: 'contact_email',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label={intl.formatMessage({
                            defaultMessage: 'Email',
                        })}
                    />
                ),
                cell: ({ row }) => (
                    <span
                        className="block max-w-[220px] truncate text-sm"
                        title={row.original.contact_email}
                    >
                        {row.original.contact_email}
                    </span>
                ),
                meta: {
                    label: intl.formatMessage({
                        defaultMessage: 'Email',
                    }),
                    placeholder: intl.formatMessage({
                        defaultMessage: 'Search email...',
                    }),
                    variant: 'text',
                    icon: MailIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                header: () => (
                    <span className="sr-only">
                        <FormattedMessage defaultMessage="Actions" />
                    </span>
                ),
                cell: ({ row }) => {
                    if (!canManageQueues) {
                        return null;
                    }

                    const displayStatus = resolveWaitingListDisplayStatus(
                        row.original.status,
                        row.original.schedules,
                    );
                    const canContact = displayStatus === 'pending';
                    const canCancel = ![
                        'cancelled',
                        'expired',
                        'fulfilled',
                    ].includes(displayStatus);

                    if (!canContact && !canCancel) {
                        return null;
                    }

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                >
                                    <MoreHorizontalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canContact ? (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            router.patch(
                                                `/companies/${company.username}/dashboard/waiting-lists/${row.original.id}/status`,
                                                { status: 'contacted' },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <FormattedMessage defaultMessage="Mark contacted" />
                                    </DropdownMenuItem>
                                ) : null}
                                {canCancel ? (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            router.patch(
                                                `/companies/${company.username}/dashboard/waiting-lists/${row.original.id}/status`,
                                                { status: 'cancelled' },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <FormattedMessage defaultMessage="Cancel request" />
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableSorting: false,
                enableColumnFilter: false,
            },
        ],
        [
            canManageQueues,
            company.username,
            companyType,
            intl,
            sourceOptions,
            statusOptions,
        ],
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
            columnVisibility: {
                contact_email: false,
                tour_code: false,
                vendor_name: companyType === 'vendor' ? false : true,
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
                        defaultMessage: 'Waiting Lists',
                    }),
                },
            ]}
            activeMenuIds={['tours.waiting-lists']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Waiting Lists',
                })}
            />

            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
                <header className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] via-background to-background shadow-sm">
                    <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <ListIcon className="size-5" />
                                </div>
                                <div>
                                    <h1 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                        <FormattedMessage defaultMessage="Waiting Lists" />
                                    </h1>
                                    <p className="text-pretty text-sm leading-6 text-muted-foreground">
                                        {companyType === 'vendor' ? (
                                            <FormattedMessage defaultMessage="Review waiting-list requests across your tour inventory. Seats are offered automatically when availability opens." />
                                        ) : (
                                            <FormattedMessage defaultMessage="View waiting-list requests submitted by your team and customers. Queue management is handled by the tour vendor." />
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {canManageQueues ? (
                    <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-900 dark:text-sky-200">
                        <InfoIcon className="mt-0.5 size-4 shrink-0" />
                        <p className="text-pretty leading-6">
                            <FormattedMessage defaultMessage="When seats become available, the next customer in queue is offered automatically. Open a schedule queue to reorder entries or send a manual offer override." />
                        </p>
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <DataTable
                        table={table}
                        className="gap-0"
                        tableContainerClassName="rounded-none border-0"
                        paginationClassName="border-t px-4 py-3"
                        renderEmptyState={<EmptyWaitingLists />}
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
