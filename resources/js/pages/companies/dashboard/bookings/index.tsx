import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
    AlertTriangleIcon,
    CalendarClockIcon,
    ChevronDown,
    CircleSlashIcon,
    CreditCardIcon,
    EditIcon,
    EyeIcon,
    FileCheckIcon,
    FileTextIcon,
    MoreHorizontal,
    Search,
    Undo2Icon,
} from 'lucide-react';
import * as React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FollowupPayload = {
    state:
        | 'completed'
        | 'due'
        | 'overdue'
        | 'pending_approval'
        | 'incomplete'
        | 'not_applicable';
    label: string;
    amount_due?: number | null;
    missing_count?: number | null;
    deadline: string | null;
    days_remaining: number | null;
    is_overdue: boolean;
    action_url: string | null;
    action_label: string | null;
};

type FollowupSummary = {
    payment_overdue: number;
    payment_due_soon: number;
    documents_incomplete: number;
    documents_due_soon: number;
};

type BookingResource = {
    id: number;
    booking_number: string;
    contact_name: string | null;
    status: string;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    total_price: string;
    grand_total: string;
    paid_amount: number;
    remaining_balance: number;
    commission_amount: string | null;
    payment_mode: string | null;
    payment_receiver_type?: 'vendor' | 'agent' | null;
    payment_receiver_company_id?: number | null;
    payment_followup: FollowupPayload;
    document_followup: FollowupPayload;
    pending_action_request?: {
        id: number;
        target_action: 'cancel' | 'refund';
        status: string;
    } | null;
    can_cancel?: boolean;
    can_refund?: boolean;
    departure_date: string | null;
    created_at: string;
    tour: { id: number; name: string } | null;
    vendor: { id: number; name: string } | null;
    agent: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
    can_review_manual_payment?: boolean;
    manual_payment: {
        id: number;
        sender_bank_name: string | null;
        sender_account_number: string | null;
        transfer_amount: number;
        proof_path: string | null;
        proof_url: string | null;
        payment_type: string | null;
    } | null;
};

type PageProps = {
    data: {
        data: BookingResource[];
        total: number;
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    followupSummary: FollowupSummary;
};

const STATUS_TABS = [
    { label: 'All', value: '', style: undefined },
    {
        label: 'Booking Reserved',
        value: 'reserved',
        style: 'bg-teal-100 text-teal-800',
    },
    {
        label: 'Awaiting Payment',
        value: 'awaiting payment',
        style: 'bg-amber-100 text-amber-800',
    },
    {
        label: 'Waiting Payment Approval',
        value: 'waiting payment approval',
        style: 'bg-sky-100 text-sky-800',
    },
    {
        label: 'Down Payment',
        value: 'down payment',
        style: 'bg-cyan-100 text-cyan-800',
    },
    {
        label: 'Full Payment',
        value: 'full payment',
        style: 'bg-green-100 text-green-800',
    },
    {
        label: 'Waiting List',
        value: 'waiting list',
        style: 'bg-purple-100 text-purple-800',
    },
    {
        label: 'Manual Reserved',
        value: 'manual reserved',
        style: 'bg-violet-100 text-violet-800',
    },
    {
        label: 'Cancelled',
        value: 'cancelled',
        style: 'bg-red-100 text-red-800',
    },
    {
        label: 'Refunded',
        value: 'refunded',
        style: 'bg-orange-100 text-orange-800',
    },
    { label: 'Expired', value: 'expired', style: 'bg-gray-100 text-gray-800' },
] as const;

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
    reserved: 'Booking Reserved',
    'booking reserved': 'Booking Reserved',
    'manual reserved': 'Manual Reserved',
    'waiting payment approval': 'Waiting Payment Approval',
};

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

function followupDeadlineText(followup: FollowupPayload): string | null {
    if (!followup.deadline) {
        return null;
    }

    const date = dayjs(followup.deadline).format('DD MMM YYYY');

    if (followup.days_remaining === null) {
        return date;
    }

    if (followup.days_remaining < 0) {
        return `Overdue ${Math.abs(followup.days_remaining)}d · ${date}`;
    }

    if (followup.days_remaining === 0) {
        return `Due today · ${date}`;
    }

    return `${followup.days_remaining}d left · ${date}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FollowupCell({
    followup,
    details,
}: {
    followup: FollowupPayload;
    details?: string | null;
}) {
    const deadlineText = followupDeadlineText(followup);

    return (
        <div className="min-w-[150px]">
            <Badge
                variant="secondary"
                className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    followupBadgeClass(followup),
                )}
            >
                {followup.label}
            </Badge>
            {details && (
                <p className="mt-1 text-xs font-medium text-slate-700">
                    {details}
                </p>
            )}
            {deadlineText && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                    {deadlineText}
                </p>
            )}
        </div>
    );
}

function FollowupSummaryCards({ summary }: { summary: FollowupSummary }) {
    const items = [
        {
            label: 'Payment overdue',
            value: summary.payment_overdue,
            icon: AlertTriangleIcon,
            className: 'border-red-100 bg-red-50 text-red-600',
        },
        {
            label: 'Payment due soon',
            value: summary.payment_due_soon,
            icon: CreditCardIcon,
            className: 'border-amber-100 bg-amber-50 text-amber-700',
        },
        {
            label: 'Docs incomplete',
            value: summary.documents_incomplete,
            icon: FileCheckIcon,
            className: 'border-slate-200 bg-white text-slate-700',
        },
        {
            label: 'Docs due soon',
            value: summary.documents_due_soon,
            icon: CalendarClockIcon,
            className: 'border-sky-100 bg-sky-50 text-sky-700',
        },
    ];

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.label}
                        className={cn(
                            'flex items-center justify-between rounded-lg border px-3 py-2.5 shadow-sm',
                            item.className,
                        )}
                    >
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider">
                                {item.label}
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums">
                                {item.value}
                            </p>
                        </div>
                        <Icon className="size-5 opacity-80" />
                    </div>
                );
            })}
        </div>
    );
}

function PaxCell({
    adult,
    child,
    infant,
}: {
    adult: number;
    child: number;
    infant: number;
}) {
    const total = adult + child + infant;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="font-semibold tabular-nums text-sm text-slate-700">
                        {total}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {adult} Adult · {child} Child · {infant} Infant
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function RowActions({
    booking,
    companyUsername,
}: {
    booking: BookingResource;
    companyUsername: string;
}) {
    const [reviewOpen, setReviewOpen] = React.useState(false);
    const [actionDialog, setActionDialog] = React.useState<
        'cancel' | 'refund' | null
    >(null);
    const [actionReason, setActionReason] = React.useState('');
    const [processingAction, setProcessingAction] = React.useState<
        'accept' | 'cancel' | 'refund' | null
    >(null);
    const canReviewManualPayment =
        booking.status === 'waiting payment approval' &&
        Boolean(booking.manual_payment) &&
        Boolean(booking.can_review_manual_payment);
    const hasPendingActionRequest = Boolean(booking.pending_action_request);
    const canCancel = Boolean(booking.can_cancel) && !hasPendingActionRequest;
    const canRefund = Boolean(booking.can_refund) && !hasPendingActionRequest;
    const canViewInvoice = booking.status === 'full payment';

    const submitManualPaymentDecision = () => {
        if (!booking.manual_payment) return;

        setProcessingAction('accept');
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/manual-payments/${booking.manual_payment.id}/accept`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setReviewOpen(false),
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const submitBookingAction = () => {
        if (!actionDialog) return;

        setProcessingAction(actionDialog);
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/${actionDialog}`,
            { reason: actionReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActionDialog(null);
                    setActionReason('');
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 text-secondary-foreground hover:bg-secondary/80 shadow-sm"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canReviewManualPayment && (
                        <>
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setReviewOpen(true);
                                }}
                            >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                Review Payment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    {booking.payment_followup?.action_url && (
                        <DropdownMenuItem asChild>
                            <Link href={booking.payment_followup.action_url}>
                                <CreditCardIcon className="mr-2 h-4 w-4" />
                                {booking.payment_followup.action_label ??
                                    'Complete Payment'}
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {booking.document_followup?.action_url && (
                        <DropdownMenuItem asChild>
                            <Link href={booking.document_followup.action_url}>
                                <FileCheckIcon className="mr-2 h-4 w-4" />
                                {booking.document_followup.action_label ??
                                    'Complete Documents'}
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {(booking.payment_followup?.action_url ||
                        booking.document_followup?.action_url) && (
                        <DropdownMenuSeparator />
                    )}
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}`}
                        >
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Detail
                        </Link>
                    </DropdownMenuItem>
                    {canViewInvoice && (
                        <DropdownMenuItem asChild>
                            <a
                                href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}/invoice`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                View Invoice
                            </a>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}/edit`}
                        >
                            <EditIcon className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    {(canCancel || canRefund || hasPendingActionRequest) && (
                        <>
                            <DropdownMenuSeparator />
                            {canCancel && (
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        setActionDialog('cancel');
                                    }}
                                >
                                    <CircleSlashIcon className="mr-2 h-4 w-4" />
                                    Cancel
                                </DropdownMenuItem>
                            )}
                            {canRefund && (
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        setActionDialog('refund');
                                    }}
                                >
                                    <Undo2Icon className="mr-2 h-4 w-4" />
                                    Refund
                                </DropdownMenuItem>
                            )}
                            {hasPendingActionRequest && (
                                <DropdownMenuItem disabled>
                                    Pending{' '}
                                    {booking.pending_action_request
                                        ?.target_action ?? 'action'}{' '}
                                    request
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogContent className="w-full max-w-md">
                    <DialogHeader>
                        <DialogTitle>Review Manual Payment</DialogTitle>
                        <DialogDescription>
                            Verify the payment receipt before approving this
                            booking payment.
                        </DialogDescription>
                    </DialogHeader>

                    {booking.manual_payment && (
                        <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Sender Bank
                                </span>
                                <span className="text-right font-semibold">
                                    {booking.manual_payment.sender_bank_name ??
                                        '—'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Account Number
                                </span>
                                <span className="text-right font-mono font-semibold">
                                    {booking.manual_payment
                                        .sender_account_number ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Transfer Amount
                                </span>
                                <span className="text-right font-semibold">
                                    {formatIDR(
                                        booking.manual_payment.transfer_amount,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Payment Type
                                </span>
                                <span className="text-right font-semibold capitalize">
                                    {(
                                        booking.manual_payment.payment_type ??
                                        'full_payment'
                                    )
                                        .replace(/_/g, ' ')
                                        .toLowerCase()}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4 border-t pt-3">
                                <span className="text-muted-foreground">
                                    Receipt
                                </span>
                                {booking.manual_payment.proof_url ? (
                                    <a
                                        href={booking.manual_payment.proof_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        View receipt
                                    </a>
                                ) : (
                                    <span className="text-right text-muted-foreground">
                                        {booking.manual_payment.proof_path ??
                                            '—'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            disabled={processingAction !== null}
                            onClick={submitManualPaymentDecision}
                        >
                            {processingAction === 'accept'
                                ? 'Accepting...'
                                : 'Accept'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={actionDialog !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setActionDialog(null);
                        setActionReason('');
                    }
                }}
            >
                <DialogContent className="w-full max-w-md">
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {actionDialog} booking
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {actionDialog} this
                            booking?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Input
                            value={actionReason}
                            onChange={(event) =>
                                setActionReason(event.target.value)
                            }
                            placeholder="Reason (optional)"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processingAction !== null}
                            onClick={() => setActionDialog(null)}
                        >
                            Keep Booking
                        </Button>
                        <Button
                            type="button"
                            variant={
                                actionDialog === 'refund'
                                    ? 'default'
                                    : 'destructive'
                            }
                            disabled={processingAction !== null}
                            onClick={submitBookingAction}
                            className="capitalize"
                        >
                            {processingAction === actionDialog
                                ? 'Processing...'
                                : actionDialog}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ---------------------------------------------------------------------------
// Column factory
// ---------------------------------------------------------------------------

function buildColumns(
    isAgent: boolean,
    companyUsername: string,
): ColumnDef<BookingResource>[] {
    return [
        {
            id: 'select',
            header: ({ table }) => (
                <div className="px-1 flex items-center justify-center">
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
                        className="border-primary/50 data-[state=checked]:bg-primary"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="px-1 flex items-center justify-center">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        className="border-primary/40 data-[state=checked]:bg-primary"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: 'created_at',
            accessorKey: 'created_at',
            header: 'Booking Date',
            cell: ({ cell }) => (
                <div className="whitespace-nowrap text-xs text-slate-500">
                    {dayjs(cell.getValue<string>()).format('DD MMM YYYY')}
                </div>
            ),
        },
        {
            id: 'tour_name',
            accessorFn: (row) => row.tour?.name ?? '—',
            header: 'Tour Name',
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
            header: 'Departure Date',
            cell: ({ cell }) => {
                const val = cell.getValue<string>();
                return (
                    <div className="whitespace-nowrap text-xs text-slate-500">
                        {val ? dayjs(val).format('DD MMM YYYY') : '—'}
                    </div>
                );
            },
        },
        {
            id: 'booking_number',
            accessorKey: 'booking_number',
            header: 'Booking Number',
            cell: ({ cell }) => (
                <span className="uppercase font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                    {cell.getValue<string>()}
                </span>
            ),
        },
        {
            id: 'status',
            accessorKey: 'status',
            header: 'Status',
            cell: ({ cell }) => {
                const status = cell.getValue<string>();
                return (
                    <Badge
                        variant="secondary"
                        className={cn(
                            'capitalize text-[10px] font-bold uppercase tracking-wider',
                            statusStyles[status] ?? statusStyles['expired'],
                        )}
                    >
                        {statusLabels[status] ?? status}
                    </Badge>
                );
            },
        },
        {
            id: isAgent ? 'vendor' : 'agent',
            accessorFn: (row) =>
                isAgent
                    ? (row.vendor?.name ?? '—')
                    : (row.agent?.name ?? 'Direct'),
            header: isAgent ? 'Vendor' : 'Agent',
            cell: ({ row }) => (
                <div
                    className="font-semibold text-slate-700 max-w-[120px] xl:max-w-[150px] truncate"
                    title={
                        isAgent
                            ? (row.original.vendor?.name ?? '—')
                            : (row.original.agent?.name ?? 'Direct')
                    }
                >
                    {isAgent
                        ? (row.original.vendor?.name ?? '—')
                        : (row.original.agent?.name ?? 'Direct')}
                </div>
            ),
        },
        {
            id: 'contact_name',
            accessorKey: 'contact_name',
            header: 'Ordered By',
            cell: ({ cell }) => (
                <div className="text-slate-600 truncate max-w-[120px]">
                    {cell.getValue<string>() || '—'}
                </div>
            ),
        },
        {
            id: 'pax',
            header: 'Pax',
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
            header: 'Grand Total',
            cell: ({ cell }) => (
                <div className="font-medium tabular-nums whitespace-nowrap text-slate-700">
                    {formatIDR(cell.getValue<string>())}
                </div>
            ),
        },
        {
            id: 'remaining_balance',
            accessorKey: 'remaining_balance',
            header: 'Remaining',
            cell: ({ row }) => {
                const remaining = row.original.remaining_balance;
                const isSettled = remaining <= 0;

                return (
                    <div
                        className={cn(
                            'tabular-nums whitespace-nowrap font-medium text-sm',
                            isSettled ? 'text-emerald-600' : 'text-rose-600',
                        )}
                    >
                        {isSettled ? '—' : formatIDR(remaining)}
                    </div>
                );
            },
        },
        {
            id: 'payment_followup',
            header: 'Payment Follow-up',
            cell: ({ row }) => {
                const followup = row.original.payment_followup;
                const amountDue = Number(followup.amount_due ?? 0);

                return (
                    <FollowupCell
                        followup={followup}
                        details={
                            amountDue > 0 ? formatIDR(amountDue) : undefined
                        }
                    />
                );
            },
            enableSorting: false,
        },
        {
            id: 'document_followup',
            header: 'Documents',
            cell: ({ row }) => {
                const followup = row.original.document_followup;
                const missingCount = Number(followup.missing_count ?? 0);

                return (
                    <FollowupCell
                        followup={followup}
                        details={
                            missingCount > 0
                                ? `${missingCount} passenger${missingCount === 1 ? '' : 's'} missing`
                                : undefined
                        }
                    />
                );
            },
            enableSorting: false,
        },
        {
            id: 'payment_mode',
            accessorKey: 'payment_mode',
            header: 'Payment Mode',
            cell: ({ cell, row }) => {
                const status = row.original.status;
                const mode = cell.getValue<string | null>();
                const showPaymentMode =
                    !!mode ||
                    !['reserved', 'awaiting payment'].includes(status);

                if (!showPaymentMode)
                    return <span className="text-slate-400">—</span>;

                if (!mode) return <span className="text-slate-400">—</span>;

                const paymentLabel =
                    mode === 'manual' ? 'Manual payment' : 'Online payment';
                const receiverLabel =
                    row.original.payment_receiver_type === 'agent'
                        ? 'agent'
                        : 'vendor';
                const label = `${paymentLabel} to ${receiverLabel}`;

                return (
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide',
                            mode === 'online'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-slate-100 text-slate-500',
                        )}
                    >
                        {label}
                    </span>
                );
            },
        },
        {
            id: 'commission_amount',
            accessorKey: 'commission_amount',
            header: 'Commission',
            cell: ({ cell }) => (
                <div className="tabular-nums whitespace-nowrap text-slate-600">
                    {formatCommission(cell.getValue<string>())}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <RowActions
                        booking={row.original}
                        companyUsername={companyUsername}
                    />
                </div>
            ),
            enableHiding: false,
            enableSorting: false,
        },
    ];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page({ data, followupSummary }: PageProps) {
    const { company } = usePageSharedDataProps();
    const isAgent = company.type === 'agent';

    const columns = React.useMemo(
        () => buildColumns(isAgent, company.username),
        [isAgent, company.username],
    );

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const fuzzyFilter = React.useCallback(
        (row: any, _columnId: string, value: string) => {
            const searchVal = String(value).toLowerCase();
            return row.getAllCells().some((cell: any) => {
                const val = cell.getValue();
                if (val == null) return false;

                let strVal = String(val);
                if (
                    cell.column.id === 'created_at' ||
                    cell.column.id === 'departure_date'
                ) {
                    strVal = dayjs(val).format('DD MMM YYYY');
                }

                return strVal.toLowerCase().includes(searchVal);
            });
        },
        [],
    );

    const table = useReactTable({
        data: data?.data ?? [],
        columns,
        filterFns: { fuzzy: fuzzyFilter },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'fuzzy' as any,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={isAgent ? ['tours.bookings'] : ['tours.orders']}
            breadcrumb={[{ title: 'Tours' }, { title: 'Bookings' }]}
        >
            <Head title="Bookings" />

            <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto pb-20 min-w-0 overflow-hidden">
                {/* ── Page header ─────────────────────────────────────── */}
                {/* ── Status filter tabs ───────────────────────────── */}
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_TABS.filter(
                        (tab) => tab.value !== 'manual reserved',
                    ).map((tab) => {
                        const params = new URLSearchParams(
                            window.location.search,
                        );
                        const activeStatus = params.get('status') ?? '';
                        const isActive = activeStatus === tab.value;

                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => {
                                    const url = `/companies/${company.username}/dashboard/bookings`;
                                    const query: Record<string, string> = {};
                                    params.forEach((v, k) => {
                                        if (k !== 'status' && k !== 'page')
                                            query[k] = v;
                                    });
                                    if (tab.value) query.status = tab.value;
                                    const qs = new URLSearchParams(
                                        query,
                                    ).toString();
                                    router.get(
                                        qs ? `${url}?${qs}` : url,
                                        {},
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }}
                                className={cn(
                                    'px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all',
                                    isActive
                                        ? (tab.style ??
                                              'bg-primary/10 text-primary border-primary/30')
                                        : 'bg-white text-muted-foreground border-slate-200 hover:bg-slate-50',
                                    isActive &&
                                        !tab.style &&
                                        'border-primary/30',
                                    isActive &&
                                        tab.style &&
                                        'border-current/20',
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <FollowupSummaryCards summary={followupSummary} />

                {/* ── Toolbar: search + view-columns ──────────────────── */}
                <div className="order-first flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-50/50 p-1 rounded-lg">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search booking number, tour, guest..."
                            value={globalFilter}
                            onChange={(event) =>
                                setGlobalFilter(event.target.value)
                            }
                            className="pl-9 w-full focus-visible:ring-primary border-slate-200"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto ml-auto bg-white border-slate-200"
                            >
                                View Columns{' '}
                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
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
                                                column.toggleVisibility(!!value)
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
                <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden">
                    <div className="w-full max-h-[65vh] overflow-auto relative">
                        <Table unwrapped className="w-full text-sm">
                            <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-[0_1px_0_0_theme(colors.border)]">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-none hover:bg-transparent"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    'bg-slate-50 dark:bg-slate-900/90 text-primary font-bold h-12 px-3 whitespace-nowrap',
                                                    header.column.id ===
                                                        'actions' &&
                                                        'sticky right-0 z-30 w-20 min-w-20 text-right shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.55)]',
                                                )}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                'selected'
                                            }
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            'py-3 px-3',
                                                            cell.column.id ===
                                                                'actions' &&
                                                                'sticky right-0 z-20 w-20 min-w-20 bg-card text-right shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.55)]',
                                                        )}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                                <p>No bookings found.</p>
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
                    <p className="text-sm text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                        <span className="font-semibold text-foreground">
                            {table.getFilteredSelectedRowModel().rows.length}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-foreground">
                            {table.getFilteredRowModel().rows.length}
                        </span>{' '}
                        row(s) selected.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="border-slate-200"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="border-slate-200"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
