import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatIDR } from '@/constants/booking';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { Deferred, Head, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ChevronDown, Search, XIcon } from 'lucide-react';
import * as React from 'react';
import { lazy, Suspense } from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

import type {
    BookingResource,
    DocumentDetail,
    FollowupPayload,
    PageProps,
    PaymentDetail,
} from './booking-index-types';
import {
    BookingIndexFollowupSummary,
    FollowupSummarySkeleton,
} from './components/booking-index-followup-summary';

const BookingIndexRowActions = lazy(() =>
    import('./components/booking-index-row-actions').then((module) => ({
        default: module.BookingIndexRowActions,
    })),
);
const BookingIndexReceiptDialog = lazy(() =>
    import('./components/booking-index-receipt-dialog').then((module) => ({
        default: module.BookingIndexReceiptDialog,
    })),
);
const BookingIndexDocumentsDialog = lazy(() =>
    import('./components/booking-index-row-actions').then((module) => ({
        default: module.BookingIndexDocumentsDialog,
    })),
);

function RowActionsFallback() {
    return (
        <div
            className="h-8 w-8 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
            aria-hidden
        />
    );
}

function DialogFallback() {
    return null;
}

const STATUS_TAB_VALUES = [
    { label: 'ALL', value: '', style: undefined },
    {
        label: 'WP',
        value: 'awaiting payment',
        style: 'bg-amber-100 text-amber-800',
    },
    {
        label: 'BR',
        value: 'reserved',
        style: 'bg-teal-100 text-teal-800',
    },
    {
        label: 'EX',
        value: 'expired',
        style: 'bg-gray-100 text-gray-800',
    },
    {
        label: 'WA',
        value: 'waiting payment approval',
        style: 'bg-sky-100 text-sky-800',
    },
    {
        label: 'DP',
        value: 'down payment',
        style: 'bg-cyan-100 text-cyan-800',
    },
    {
        label: 'FP',
        value: 'full payment',
        style: 'bg-green-100 text-green-800',
    },
    {
        label: 'CA',
        value: 'cancelled',
        style: 'bg-red-100 text-red-800',
    },
    {
        label: 'RF',
        value: 'refunded',
        style: 'bg-orange-100 text-orange-800',
    },
    {
        label: 'WL',
        value: 'waiting list',
        style: 'bg-purple-100 text-purple-800',
    },
] as const;

function getStatusTabs(intl: IntlShape) {
    const fullLabels: Record<string, string> = {
        '': intl.formatMessage({ defaultMessage: 'All' }),
        'awaiting payment': intl.formatMessage({
            defaultMessage: 'Awaiting Payment',
        }),
        reserved: intl.formatMessage({ defaultMessage: 'Booking Reserved' }),
        expired: intl.formatMessage({ defaultMessage: 'Expired' }),
        'waiting payment approval': intl.formatMessage({
            defaultMessage: 'Waiting Payment Approval',
        }),
        'down payment': intl.formatMessage({ defaultMessage: 'Down Payment' }),
        'full payment': intl.formatMessage({ defaultMessage: 'Full Payment' }),
        cancelled: intl.formatMessage({ defaultMessage: 'Cancelled' }),
        refunded: intl.formatMessage({ defaultMessage: 'Refunded' }),
        'waiting list': intl.formatMessage({ defaultMessage: 'Waiting List' }),
    };

    return STATUS_TAB_VALUES.map((tab) => ({
        ...tab,
        fullLabel: fullLabels[tab.value] ?? tab.label,
    }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusStyles: Record<string, string> = {
    reserved:
        'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    'awaiting payment':
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'waiting payment approval':
        'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    'down payment':
        'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    'full payment':
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    completed:
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'waiting list':
        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'manual reserved':
        'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    'booking reserved':
        'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-100/80 dark:text-red-300',
    refunded:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
};

const statusLabels: Record<string, string> = {
    reserved: 'BR',
    'booking reserved': 'BR',
    'manual reserved': 'RS',
    'awaiting payment': 'WP',
    'waiting payment approval': 'WA',
    'down payment': 'DP',
    'full payment': 'FP',
    'waiting list': 'WL',
    cancelled: 'CA',
    refunded: 'RF',
    expired: 'EX',
};

function getStatusFullLabels(intl: IntlShape): Record<string, string> {
    return {
        reserved: intl.formatMessage({ defaultMessage: 'Booking Reserved' }),
        'booking reserved': intl.formatMessage({
            defaultMessage: 'Booking Reserved',
        }),
        'manual reserved': intl.formatMessage({
            defaultMessage: 'Manual Reserved',
        }),
        'awaiting payment': intl.formatMessage({
            defaultMessage: 'Awaiting Payment',
        }),
        'waiting payment approval': intl.formatMessage({
            defaultMessage: 'Waiting Payment Approval',
        }),
        'down payment': intl.formatMessage({ defaultMessage: 'Down Payment' }),
        'full payment': intl.formatMessage({ defaultMessage: 'Full Payment' }),
        'waiting list': intl.formatMessage({ defaultMessage: 'Waiting List' }),
        cancelled: intl.formatMessage({ defaultMessage: 'Cancelled' }),
        refunded: intl.formatMessage({ defaultMessage: 'Refunded' }),
        expired: intl.formatMessage({ defaultMessage: 'Expired' }),
    };
}

function formatCommission(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return '—';
    return formatIDR(num);
}

function followupBadgeClass(followup: FollowupPayload): string {
    if (followup.is_overdue || followup.state === 'overdue') {
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    }

    if (followup.state === 'completed' || followup.state === 'not_applicable') {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    }

    if (followup.state === 'pending_approval') {
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
    }

    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
}

function followupDeadlineText(
    followup: FollowupPayload,
    intl: IntlShape,
): string | null {
    if (!followup.deadline) {
        return null;
    }

    const date = dayjs(followup.deadline).format('DD MMM YYYY');

    if (followup.days_remaining === null) {
        return date;
    }

    if (followup.days_remaining < 0) {
        return intl.formatMessage(
            { defaultMessage: 'Overdue {days}d · {date}' },
            { days: Math.abs(followup.days_remaining), date },
        );
    }

    if (followup.days_remaining === 0) {
        return intl.formatMessage(
            { defaultMessage: 'Due today · {date}' },
            { date },
        );
    }

    return intl.formatMessage(
        { defaultMessage: '{days}d left · {date}' },
        { days: followup.days_remaining, date },
    );
}

function FollowupCell({
    followup,
    details,
}: {
    followup: FollowupPayload;
    details?: string | null;
}) {
    const intl = useIntl();
    const deadlineText =
        followup.state === 'completed'
            ? null
            : followupDeadlineText(followup, intl);

    return (
        <div className="min-w-[150px] text-xs">
            {details && (
                <p className="font-medium text-slate-700 dark:text-slate-200">
                    {details}
                </p>
            )}
            {deadlineText && (
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {deadlineText}
                </p>
            )}
            <Badge
                variant="secondary"
                className={cn(
                    'mt-1 text-[10px] font-bold uppercase tracking-wider',
                    followupBadgeClass(followup),
                )}
            >
                {followup.label}
            </Badge>
        </div>
    );
}

function NotApplicableCell() {
    return <span className="text-slate-400">—</span>;
}

function PaymentDetailCell({
    detail,
    onViewReceipt,
}: {
    detail: PaymentDetail | null;
    onViewReceipt: (detail: PaymentDetail) => void;
}) {
    if (!detail) {
        return <span className="text-slate-400">—</span>;
    }

    const paymentLabel = detail.display_label
        ? detail.display_label
        : `${detail.method_label} to ${detail.receiver_label}`.toUpperCase();
    const hasReceipt =
        Boolean(detail.receipt) ||
        Boolean(
            detail.receipt_group?.some(
                (section) => section.detail.receipt !== null,
            ),
        );

    return (
        <div className="min-w-[150px] text-xs">
            <p className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatIDR(detail.amount)}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                    {detail.payment_date
                        ? dayjs(detail.payment_date).format('DD MMM YYYY')
                        : '—'}
                </span>
                {hasReceipt && (
                    <button
                        type="button"
                        className="whitespace-nowrap font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        onClick={(event) => {
                            event.stopPropagation();
                            onViewReceipt(detail);
                        }}
                    >
                        <FormattedMessage defaultMessage="View Receipt" />
                    </button>
                )}
            </div>
            <Badge
                variant="secondary"
                className="mt-1 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary dark:bg-primary/20"
            >
                {paymentLabel}
            </Badge>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Column factory
// ---------------------------------------------------------------------------

function buildColumns(
    intl: IntlShape,
    isAgent: boolean,
    companyUsername: string,
    onViewReceipt: (detail: PaymentDetail) => void,
    onViewDocuments: (booking: BookingResource) => void,
): ColumnDef<BookingResource>[] {
    const statusFullLabels = getStatusFullLabels(intl);
    const directLabel = intl.formatMessage({ defaultMessage: 'Direct' });

    return [
        {
            id: 'actions',
            header: intl.formatMessage({ defaultMessage: 'Actions' }),
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Suspense fallback={<RowActionsFallback />}>
                        <BookingIndexRowActions
                            booking={row.original}
                            companyUsername={companyUsername}
                            isAgent={isAgent}
                        />
                    </Suspense>
                </div>
            ),
            enableHiding: false,
            enableSorting: false,
        },
        {
            id: 'created_at',
            accessorKey: 'created_at',
            header: intl.formatMessage({ defaultMessage: 'Booking Date' }),
            cell: ({ cell }) => (
                <div className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
                    {dayjs(cell.getValue<string>()).format('DD MMM YYYY')}
                </div>
            ),
        },
        {
            id: 'tour_name',
            accessorFn: (row) => row.tour?.name ?? '—',
            header: intl.formatMessage({ defaultMessage: 'Tour Name' }),
            cell: ({ row }) => (
                <div
                    className="max-w-[180px] xl:max-w-[220px] truncate font-bold text-primary"
                    title={row.original.tour?.name ?? '—'}
                >
                    {row.original.tour?.name ?? '—'}
                </div>
            ),
        },
        {
            id: 'departure_date',
            accessorKey: 'departure_date',
            header: intl.formatMessage({ defaultMessage: 'Departure Date' }),
            cell: ({ row }) => {
                const val = row.original.departure_date;

                return (
                    <div className="flex items-center gap-2 whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
                        <span>
                            {val ? dayjs(val).format('DD MMM YYYY') : '—'}
                        </span>
                        {row.original.was_rescheduled && (
                            <Badge
                                variant="secondary"
                                className="bg-sky-100 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                            >
                                <FormattedMessage defaultMessage="Rescheduled" />
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'booking_number',
            accessorKey: 'booking_number',
            header: intl.formatMessage({ defaultMessage: 'Booking Number' }),
            cell: ({ cell }) => (
                <span className="uppercase font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700">
                    {cell.getValue<string>()}
                </span>
            ),
        },
        {
            id: 'status',
            accessorKey: 'status',
            header: intl.formatMessage({ defaultMessage: 'Status' }),
            cell: ({ cell }) => {
                const status = cell.getValue<string>();
                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="secondary"
                                className={cn(
                                    'cursor-help text-[10px] font-bold uppercase tracking-wider',
                                    statusStyles[status] ??
                                        statusStyles['expired'],
                                )}
                            >
                                {statusLabels[status] ?? status.toUpperCase()}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{statusFullLabels[status] ?? status}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            },
        },
        {
            id: isAgent ? 'vendor' : 'agent',
            accessorFn: (row) =>
                isAgent
                    ? (row.vendor?.name ?? '—')
                    : (row.agent?.name ?? directLabel),
            header: isAgent
                ? intl.formatMessage({ defaultMessage: 'Vendor' })
                : intl.formatMessage({ defaultMessage: 'Agent' }),
            cell: ({ row }) => (
                <div
                    className="font-semibold text-slate-700 max-w-[120px] xl:max-w-[150px] truncate dark:text-slate-200"
                    title={
                        isAgent
                            ? (row.original.vendor?.name ?? '—')
                            : (row.original.agent?.name ?? directLabel)
                    }
                >
                    {isAgent
                        ? (row.original.vendor?.name ?? '—')
                        : (row.original.agent?.name ?? directLabel)}
                </div>
            ),
        },
        {
            id: 'contact_name',
            accessorKey: 'contact_name',
            header: intl.formatMessage({ defaultMessage: 'Ordered By' }),
            cell: ({ cell }) => (
                <div className="text-slate-600 truncate max-w-[120px] dark:text-slate-300">
                    {cell.getValue<string>() || '—'}
                </div>
            ),
        },
        {
            id: 'pax',
            header: intl.formatMessage({ defaultMessage: 'Pax' }),
            cell: ({ row }) => (
                <PaxCell
                    adult={row.original.pax_adult ?? 0}
                    child={row.original.pax_child ?? 0}
                    infant={row.original.pax_infant ?? 0}
                />
            ),
            enableSorting: false,
        },
        {
            id: 'grand_total',
            accessorKey: 'grand_total',
            header: intl.formatMessage({ defaultMessage: 'Grand Total' }),
            cell: ({ cell }) => (
                <div className="font-medium tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-200">
                    {formatIDR(cell.getValue<string>())}
                </div>
            ),
        },
        {
            id: 'remaining_balance',
            accessorKey: 'remaining_balance',
            header: intl.formatMessage({ defaultMessage: 'Remaining' }),
            cell: ({ row }) => {
                const remaining = row.original.remaining_balance;
                const shouldShowRemaining =
                    row.original.remaining_balance_visible === true &&
                    remaining > 0;

                return (
                    <div
                        className={cn(
                            'tabular-nums whitespace-nowrap font-medium text-sm',
                            shouldShowRemaining
                                ? 'text-rose-600'
                                : 'text-slate-400',
                        )}
                    >
                        {shouldShowRemaining ? formatIDR(remaining) : '—'}
                    </div>
                );
            },
        },
        {
            id: 'down_payment_detail',
            header: intl.formatMessage({ defaultMessage: 'Down Payments' }),
            cell: ({ row }) => (
                <PaymentDetailCell
                    detail={row.original.down_payment_detail}
                    onViewReceipt={onViewReceipt}
                />
            ),
            enableSorting: false,
        },
        {
            id: 'full_payment_detail',
            header: intl.formatMessage({ defaultMessage: 'Full Payment' }),
            cell: ({ row }) => (
                <PaymentDetailCell
                    detail={row.original.full_payment_detail}
                    onViewReceipt={onViewReceipt}
                />
            ),
            enableSorting: false,
        },
        {
            id: 'payment_followup',
            header: intl.formatMessage({ defaultMessage: 'Payment Status' }),
            cell: ({ row }) =>
                row.original.payment_followup.state === 'not_applicable' ? (
                    <NotApplicableCell />
                ) : (
                    <FollowupCell followup={row.original.payment_followup} />
                ),
            enableSorting: false,
        },
        {
            id: 'document_followup',
            header: intl.formatMessage({ defaultMessage: 'Documents' }),
            cell: ({ row }) => {
                const followup = row.original.document_followup;
                const missingCount = Number(followup.missing_count ?? 0);
                const documentDetails = row.original.document_detail ?? [];

                if (followup.state === 'not_applicable') {
                    return <NotApplicableCell />;
                }

                return (
                    <div className="space-y-1">
                        {followup.state === 'completed' &&
                            documentDetails.length > 0 && (
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onViewDocuments(row.original);
                                    }}
                                >
                                    <FormattedMessage defaultMessage="View Documents" />
                                </button>
                            )}
                        <FollowupCell
                            followup={followup}
                            details={
                                missingCount > 0
                                    ? intl.formatMessage(
                                          {
                                              defaultMessage:
                                                  '{count, plural, one {# passenger} other {# passengers}}',
                                          },
                                          { count: missingCount },
                                      )
                                    : undefined
                            }
                        />
                    </div>
                );
            },
            enableSorting: false,
        },
        {
            id: 'commission_amount',
            accessorKey: 'commission_amount',
            header: intl.formatMessage({ defaultMessage: 'Commission' }),
            cell: ({ cell }) => (
                <div className="tabular-nums whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatCommission(cell.getValue<string>())}
                </div>
            ),
        },
    ];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page({ data }: PageProps) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const statusTabs = React.useMemo(() => getStatusTabs(intl), [intl]);
    const isAgent = company.type === 'agent';
    const [receiptDialogPayment, setReceiptDialogPayment] =
        React.useState<PaymentDetail | null>(null);
    const [documentsDialog, setDocumentsDialog] = React.useState<{
        bookingNumber: string;
        documents: DocumentDetail[];
    } | null>(null);
    const handleViewReceipt = React.useCallback((detail: PaymentDetail) => {
        setReceiptDialogPayment(detail);
    }, []);
    const handleViewDocuments = React.useCallback(
        (booking: BookingResource) => {
            setDocumentsDialog({
                bookingNumber: booking.booking_number,
                documents: booking.document_detail ?? [],
            });
        },
        [],
    );

    const columns = React.useMemo(
        () =>
            buildColumns(
                intl,
                isAgent,
                company.username,
                handleViewReceipt,
                handleViewDocuments,
            ),
        [
            handleViewDocuments,
            handleViewReceipt,
            intl,
            isAgent,
            company.username,
        ],
    );

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [searchInput, setSearchInput] = React.useState('');
    const [globalFilter, setGlobalFilter] = React.useState('');
    const debouncedSetGlobalFilter = useDebouncedCallback((value: string) => {
        setGlobalFilter(value);
    }, 200);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});

    const fuzzyFilter = React.useCallback(
        (row: any, _columnId: string, value: string) => {
            const searchVal = String(value).toLowerCase();
            if (searchVal === '') {
                return true;
            }

            const booking = row.original as BookingResource;

            return [
                booking.booking_number,
                booking.contact_name,
                booking.tour?.name,
                booking.vendor?.name,
                booking.agent?.name,
                booking.status,
                booking.created_at
                    ? dayjs(booking.created_at).format('DD MMM YYYY')
                    : null,
                booking.departure_date
                    ? dayjs(booking.departure_date).format('DD MMM YYYY')
                    : null,
            ].some((candidate) =>
                candidate == null
                    ? false
                    : String(candidate).toLowerCase().includes(searchVal),
            );
        },
        [],
    );

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: data?.data ?? [],
        columns,
        filterFns: { fuzzy: fuzzyFilter },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'fuzzy' as any,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
    });
    const tableRows = table.getRowModel().rows;

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={isAgent ? ['tours.bookings'] : ['tours.orders']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Tours',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Bookings',
                    }),
                },
            ]}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Bookings',
                })}
            />

            <TooltipProvider delayDuration={300}>
                <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto pb-20 min-w-0 overflow-hidden">
                    {/* ── Page header ─────────────────────────────────────── */}
                    {/* ── Status filter tabs ───────────────────────────── */}
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {statusTabs.map((tab) => {
                            const params = new URLSearchParams(
                                window.location.search,
                            );
                            const activeStatus = params.get('status') ?? '';
                            const isActive = activeStatus === tab.value;

                            return (
                                <Tooltip key={tab.value}>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = `/companies/${company.username}/dashboard/bookings`;
                                                const query: Record<
                                                    string,
                                                    string
                                                > = {};
                                                params.forEach((v, k) => {
                                                    if (
                                                        k !== 'status' &&
                                                        k !== 'page' &&
                                                        k !== 'followup'
                                                    ) {
                                                        query[k] = v;
                                                    }
                                                });
                                                if (tab.value) {
                                                    query.status = tab.value;
                                                }
                                                const qs = new URLSearchParams(
                                                    query,
                                                ).toString();
                                                router.get(
                                                    qs ? `${url}?${qs}` : url,
                                                    {},
                                                    {
                                                        preserveState: true,
                                                    },
                                                );
                                            }}
                                            className={cn(
                                                'px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all',
                                                isActive
                                                    ? (tab.style ??
                                                          'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary dark:border-primary/40')
                                                    : 'bg-white text-muted-foreground border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-900',
                                                isActive &&
                                                    !tab.style &&
                                                    'border-primary/30',
                                                isActive &&
                                                    tab.style &&
                                                    'border-current/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{tab.fullLabel}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>

                    <Deferred
                        data="followupSummary"
                        fallback={<FollowupSummarySkeleton />}
                    >
                        <BookingIndexFollowupSummary />
                    </Deferred>

                    {/* ── Toolbar: search + view-columns ──────────────────── */}
                    <div className="order-first flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-card/95 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full min-w-0 sm:max-w-xs md:max-w-sm">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15">
                                    <Search className="size-3.5" />
                                </span>
                                <Input
                                    placeholder={intl.formatMessage({
                                        defaultMessage:
                                            'Search booking number, tour, guest, vendor, or agent',
                                    })}
                                    value={searchInput}
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setSearchInput(nextValue);
                                        debouncedSetGlobalFilter(nextValue);
                                    }}
                                    className="h-9 w-full rounded-lg border-slate-200 bg-background pl-9 pr-9 text-xs font-medium shadow-inner shadow-slate-100/70 transition-all placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/20 dark:placeholder:text-slate-500"
                                />
                                {searchInput.trim() !== '' && (
                                    <button
                                        type="button"
                                        aria-label={intl.formatMessage({
                                            defaultMessage: 'Clear search',
                                        })}
                                        onClick={() => {
                                            setSearchInput('');
                                            setGlobalFilter('');
                                        }}
                                        className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <XIcon className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="ml-auto h-9 w-full border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 sm:w-auto"
                                >
                                    <FormattedMessage defaultMessage="View Columns" />{' '}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[200px]"
                            >
                                <DropdownMenuGroup>
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize cursor-pointer"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id.replace(/_/g, ' ')}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* ── Table card ──────────────────────────────────────── */}
                    <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none">
                        <div className="w-full overflow-x-auto overflow-y-visible relative [scrollbar-gutter:stable]">
                            <Table
                                unwrapped
                                className="w-full border-separate border-spacing-0 text-sm"
                            >
                                <TableHeader className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-900/90 shadow-[0_1px_0_0_theme(colors.border)]">
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <TableRow
                                                key={headerGroup.id}
                                                className="border-none bg-slate-50 hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-900/90"
                                            >
                                                {headerGroup.headers.map(
                                                    (header) => (
                                                        <TableHead
                                                            key={header.id}
                                                            className={cn(
                                                                'bg-slate-50 dark:bg-slate-900/90 text-primary font-bold h-12 px-3 whitespace-nowrap',
                                                                header.column
                                                                    .id ===
                                                                    'actions' &&
                                                                    'sticky left-0 z-50 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] overflow-visible rounded-tl-xl border-r border-border/70 px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)]',
                                                            )}
                                                        >
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                      header
                                                                          .column
                                                                          .columnDef
                                                                          .header,
                                                                      header.getContext(),
                                                                  )}
                                                        </TableHead>
                                                    ),
                                                )}
                                            </TableRow>
                                        ))}
                                </TableHeader>
                                <TableBody>
                                    {tableRows.length ? (
                                        tableRows.map((row, rowIndex) => (
                                            <TableRow
                                                key={row.id}
                                                className="group border-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell) => (
                                                        <TableCell
                                                            key={cell.id}
                                                            className={cn(
                                                                'border-b border-border py-3 px-3',
                                                                cell.column
                                                                    .id ===
                                                                    'actions' &&
                                                                    'sticky left-0 z-20 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] overflow-visible border-r border-border/70 bg-card px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)] transition-colors group-hover:bg-slate-50 dark:bg-slate-950/95 dark:group-hover:bg-slate-900/50',
                                                                cell.column
                                                                    .id ===
                                                                    'actions' &&
                                                                    rowIndex ===
                                                                        tableRows.length -
                                                                            1 &&
                                                                    'rounded-bl-xl',
                                                            )}
                                                        >
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext(),
                                                            )}
                                                        </TableCell>
                                                    ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-lg mb-1">
                                                        📭
                                                    </span>
                                                    <p>
                                                        <FormattedMessage defaultMessage="No bookings found." />
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* ── Pagination footer ───────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <p className="text-sm text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
                            <FormattedMessage
                                defaultMessage="{from} - {to} of {total} booking(s)"
                                values={{
                                    from: (
                                        <span className="font-semibold text-foreground">
                                            {data.from ?? 0}
                                        </span>
                                    ),
                                    to: (
                                        <span className="font-semibold text-foreground">
                                            {data.to ?? 0}
                                        </span>
                                    ),
                                    total: (
                                        <span className="font-semibold text-foreground">
                                            {data.total}
                                        </span>
                                    ),
                                }}
                            />
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {data.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveState: true,
                                            });
                                        }
                                    }}
                                    disabled={!link.url}
                                    className="min-w-9 border-slate-200"
                                >
                                    {paginationLabel(link.label, intl)}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </TooltipProvider>
            <Suspense fallback={<DialogFallback />}>
                <BookingIndexReceiptDialog
                    payment={receiptDialogPayment}
                    onOpenChange={(open) => {
                        if (!open) {
                            setReceiptDialogPayment(null);
                        }
                    }}
                />
            </Suspense>
            <Suspense fallback={<DialogFallback />}>
                <BookingIndexDocumentsDialog
                    bookingNumber={documentsDialog?.bookingNumber ?? null}
                    documents={documentsDialog?.documents ?? []}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDocumentsDialog(null);
                        }
                    }}
                />
            </Suspense>
        </CompanyDashboardLayout>
    );
}
