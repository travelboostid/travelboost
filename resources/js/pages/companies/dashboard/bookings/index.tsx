import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    RotateCcwIcon,
    Search,
    Undo2Icon,
    XIcon,
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

type PaymentDetail = {
    method_label: string;
    receiver_label: string;
    amount: number;
    payment_date: string | null;
    booking_payment_type?: 'down_payment' | 'full_payment' | null;
    receipt: {
        type: 'manual' | 'online';
        url?: string | null;
        provider?: string | null;
        method?: string | null;
        order_id?: string | null;
        transaction_id?: string | null;
        status?: string | null;
        raw?: Record<string, unknown> | null;
    } | null;
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
    payment_receiver_type?: 'vendor' | 'agent' | null;
    payment_receiver_company_id?: number | null;
    input_by?: {
        user_name: string;
        role_label: string;
        company_name?: string | null;
        created_at: string | null;
    } | null;
    payment_followup: FollowupPayload;
    document_followup: FollowupPayload;
    pending_action_request?: {
        id: number;
        target_action: 'cancel' | 'refund';
        status: string;
    } | null;
    can_cancel?: boolean;
    can_refund?: boolean;
    can_reorder?: boolean;
    down_payment_detail: PaymentDetail | null;
    full_payment_detail: PaymentDetail | null;
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
        payment_date: string | null;
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
    { label: 'ALL', fullLabel: 'All', value: '', style: undefined },
    {
        label: 'BR',
        fullLabel: 'Booking Reserved',
        value: 'reserved',
        style: 'bg-teal-100 text-teal-800',
    },
    {
        label: 'WP',
        fullLabel: 'Awaiting Payment',
        value: 'awaiting payment',
        style: 'bg-amber-100 text-amber-800',
    },
    {
        label: 'WA',
        fullLabel: 'Waiting Payment Approval',
        value: 'waiting payment approval',
        style: 'bg-sky-100 text-sky-800',
    },
    {
        label: 'DP',
        fullLabel: 'Down Payment',
        value: 'down payment',
        style: 'bg-cyan-100 text-cyan-800',
    },
    {
        label: 'FP',
        fullLabel: 'Full Payment',
        value: 'full payment',
        style: 'bg-green-100 text-green-800',
    },
    {
        label: 'WL',
        fullLabel: 'Waiting List',
        value: 'waiting list',
        style: 'bg-purple-100 text-purple-800',
    },
    {
        label: 'CA',
        fullLabel: 'Cancelled',
        value: 'cancelled',
        style: 'bg-red-100 text-red-800',
    },
    {
        label: 'RF',
        fullLabel: 'Refunded',
        value: 'refunded',
        style: 'bg-orange-100 text-orange-800',
    },
    {
        label: 'EX',
        fullLabel: 'Expired',
        value: 'expired',
        style: 'bg-gray-100 text-gray-800',
    },
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

const statusFullLabels: Record<string, string> = {
    reserved: 'Booking Reserved',
    'booking reserved': 'Booking Reserved',
    'manual reserved': 'Manual Reserved',
    'awaiting payment': 'Awaiting Payment',
    'waiting payment approval': 'Waiting Payment Approval',
    'down payment': 'Down Payment',
    'full payment': 'Full Payment',
    'waiting list': 'Waiting List',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    expired: 'Expired',
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
                <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {details}
                </p>
            )}
            {deadlineText && (
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {deadlineText}
                </p>
            )}
        </div>
    );
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

    const paymentLabel =
        `${detail.method_label} to ${detail.receiver_label}`.toUpperCase();

    return (
        <div className="min-w-[150px] text-xs">
            <Badge
                variant="secondary"
                className="bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary dark:bg-primary/20"
            >
                {paymentLabel}
            </Badge>
            <p className="mt-0.5 font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatIDR(detail.amount)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {detail.payment_date
                    ? dayjs(detail.payment_date).format('DD MMM YYYY')
                    : '—'}
            </p>
            {detail.receipt && (
                <button
                    type="button"
                    className="mt-1 text-[11px] font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                    onClick={(event) => {
                        event.stopPropagation();
                        onViewReceipt(detail);
                    }}
                >
                    View Receipt
                </button>
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
            className:
                'border-red-100 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300',
        },
        {
            label: 'Payment due soon',
            value: summary.payment_due_soon,
            icon: CreditCardIcon,
            className:
                'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
        },
        {
            label: 'Docs incomplete',
            value: summary.documents_incomplete,
            icon: FileCheckIcon,
            className:
                'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200',
        },
        {
            label: 'Docs due soon',
            value: summary.documents_due_soon,
            icon: CalendarClockIcon,
            className:
                'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300',
        },
    ];

    return (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.label}
                        className={cn(
                            'flex items-center justify-between rounded-md border px-2.5 py-2 shadow-sm dark:shadow-none',
                            item.className,
                        )}
                    >
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider">
                                {item.label}
                            </p>
                            <p className="mt-0.5 text-lg font-bold tabular-nums">
                                {item.value}
                            </p>
                        </div>
                        <Icon className="size-4 opacity-80" />
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
                    <span className="font-semibold tabular-nums text-sm text-slate-700 dark:text-slate-200">
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
        'accept' | 'cancel' | 'refund' | 'reorder' | null
    >(null);
    const canReviewManualPayment =
        booking.status === 'waiting payment approval' &&
        Boolean(booking.manual_payment) &&
        Boolean(booking.can_review_manual_payment);
    const hasPendingActionRequest = Boolean(booking.pending_action_request);
    const canCancel = Boolean(booking.can_cancel) && !hasPendingActionRequest;
    const canRefund = Boolean(booking.can_refund) && !hasPendingActionRequest;
    const canReorder = Boolean(booking.can_reorder);
    const canViewInvoice = booking.status === 'full payment';
    const manualPaymentId = booking.manual_payment?.id;

    React.useEffect(() => {
        if (!canReviewManualPayment || !manualPaymentId) {
            return;
        }

        const reviewPaymentId = new URLSearchParams(window.location.search).get(
            'review_payment',
        );

        if (reviewPaymentId === String(manualPaymentId)) {
            setReviewOpen(true);
        }
    }, [canReviewManualPayment, manualPaymentId]);

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
    const submitReorder = () => {
        setProcessingAction('reorder');
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/reorder`,
            {},
            {
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
                <DropdownMenuContent align="start">
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
                    {canReorder && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                disabled={processingAction !== null}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    submitReorder();
                                }}
                            >
                                <RotateCcwIcon className="mr-2 h-4 w-4" />
                                {processingAction === 'reorder'
                                    ? 'Reordering...'
                                    : 'Reorder'}
                            </DropdownMenuItem>
                        </>
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
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Payment Time
                                </span>
                                <span className="text-right font-semibold">
                                    {booking.manual_payment.payment_date
                                        ? dayjs(
                                              booking.manual_payment
                                                  .payment_date,
                                          ).format('DD MMM YYYY')
                                        : '—'}
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
    onViewReceipt: (detail: PaymentDetail) => void,
): ColumnDef<BookingResource>[] {
    return [
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <RowActions
                        booking={row.original}
                        companyUsername={companyUsername}
                    />
                </div>
            ),
            enableHiding: false,
            enableSorting: false,
        },
        {
            id: 'created_at',
            accessorKey: 'created_at',
            header: 'Booking Date',
            cell: ({ cell }) => (
                <div className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
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
                    <div className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
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
                <span className="uppercase font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700">
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
                    <TooltipProvider>
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
                                    {statusLabels[status] ??
                                        status.toUpperCase()}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{statusFullLabels[status] ?? status}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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
                    className="font-semibold text-slate-700 max-w-[120px] xl:max-w-[150px] truncate dark:text-slate-200"
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
                <div className="text-slate-600 truncate max-w-[120px] dark:text-slate-300">
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
                <div className="font-medium tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-200">
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
            id: 'down_payment_detail',
            header: 'Down Payments',
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
            header: 'Full Payment',
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
            id: 'commission_amount',
            accessorKey: 'commission_amount',
            header: 'Commission',
            cell: ({ cell }) => (
                <div className="tabular-nums whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatCommission(cell.getValue<string>())}
                </div>
            ),
        },
    ];
}

function receiptPaymentTime(payment: PaymentDetail): string {
    if (!payment.payment_date) {
        return '-';
    }

    return dayjs(payment.payment_date).format(
        payment.receipt?.type === 'online'
            ? 'DD MMM YYYY HH:mm:ss'
            : 'DD MMM YYYY',
    );
}

function ReceiptDialog({
    payment,
    onOpenChange,
}: {
    payment: PaymentDetail | null;
    onOpenChange: (open: boolean) => void;
}) {
    const receipt = payment?.receipt ?? null;
    const receiptRows =
        payment && receipt
            ? [
                  ['Type', receipt.type.toUpperCase()],
                  ['Method', payment.method_label],
                  ['Receiver', payment.receiver_label],
                  ['Amount', formatIDR(payment.amount)],
                  ['Payment Time', receiptPaymentTime(payment)],
              ]
            : [];

    return (
        <Dialog open={payment !== null} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-md">
                <DialogHeader>
                    <DialogTitle>Payment Receipt</DialogTitle>
                    <DialogDescription>
                        Transaction details for this booking payment.
                    </DialogDescription>
                </DialogHeader>

                {payment && receipt && (
                    <div className="space-y-3 text-sm">
                        {receiptRows.map(([label, value]) => (
                            <div
                                key={label}
                                className="flex justify-between gap-4"
                            >
                                <span className="text-muted-foreground">
                                    {label}
                                </span>
                                <span className="text-right font-semibold">
                                    {value}
                                </span>
                            </div>
                        ))}

                        {receipt.type === 'manual' && receipt.url && (
                            <a
                                href={receipt.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-sm font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                            >
                                Open uploaded receipt
                            </a>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page({ data, followupSummary }: PageProps) {
    const { company } = usePageSharedDataProps();
    const isAgent = company.type === 'agent';
    const [receiptDialogPayment, setReceiptDialogPayment] =
        React.useState<PaymentDetail | null>(null);
    const handleViewReceipt = React.useCallback((detail: PaymentDetail) => {
        setReceiptDialogPayment(detail);
    }, []);

    const columns = React.useMemo(
        () => buildColumns(isAgent, company.username, handleViewReceipt),
        [handleViewReceipt, isAgent, company.username],
    );

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});

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
        getPaginationRowModel: getPaginationRowModel(),
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
            breadcrumb={[{ title: 'Tours' }, { title: 'Bookings' }]}
        >
            <Head title="Bookings" />

            <div className="w-full flex flex-col gap-6 p-4 md:p-6 max-w-screen-2xl mx-auto pb-20 min-w-0 overflow-hidden">
                {/* ── Page header ─────────────────────────────────────── */}
                {/* ── Status filter tabs ───────────────────────────── */}
                <div className="flex flex-wrap justify-center gap-1.5">
                    {STATUS_TABS.map((tab) => {
                        const params = new URLSearchParams(
                            window.location.search,
                        );
                        const activeStatus = params.get('status') ?? '';
                        const isActive = activeStatus === tab.value;

                        return (
                            <TooltipProvider key={tab.value}>
                                <Tooltip>
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
                                                        k !== 'page'
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
                                                        preserveScroll: true,
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
                            </TooltipProvider>
                        );
                    })}
                </div>

                <FollowupSummaryCards summary={followupSummary} />

                {/* ── Toolbar: search + view-columns ──────────────────── */}
                <div className="order-first flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-card/95 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full min-w-0 sm:max-w-xs md:max-w-sm">
                        <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15">
                                <Search className="size-3.5" />
                            </span>
                            <Input
                                placeholder="Search booking number, tour, guest, vendor, or agent"
                                value={globalFilter}
                                onChange={(event) =>
                                    setGlobalFilter(event.target.value)
                                }
                                className="h-9 w-full rounded-lg border-slate-200 bg-background pl-9 pr-9 text-xs font-medium shadow-inner shadow-slate-100/70 transition-all placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/20 dark:placeholder:text-slate-500"
                            />
                            {globalFilter.trim() !== '' && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setGlobalFilter('')}
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
                <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none">
                    <div className="w-full max-h-[65vh] overflow-auto relative [scrollbar-gutter:stable]">
                        <Table
                            unwrapped
                            className="w-full border-separate border-spacing-0 text-sm"
                        >
                            <TableHeader className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-900/90 shadow-[0_1px_0_0_theme(colors.border)]">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-none bg-slate-50 hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-900/90"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    'bg-slate-50 dark:bg-slate-900/90 text-primary font-bold h-12 px-3 whitespace-nowrap',
                                                    header.column.id ===
                                                        'actions' &&
                                                        'sticky left-0 z-50 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] overflow-visible rounded-tl-xl border-r border-border/70 px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)]',
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
                                                            cell.column.id ===
                                                                'actions' &&
                                                                'sticky left-0 z-20 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] overflow-visible border-r border-border/70 bg-card px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)] transition-colors group-hover:bg-slate-50 dark:bg-slate-950/95 dark:group-hover:bg-slate-900/50',
                                                            cell.column.id ===
                                                                'actions' &&
                                                                rowIndex ===
                                                                    tableRows.length -
                                                                        1 &&
                                                                'rounded-bl-xl',
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
                    <p className="text-sm text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
                        <span className="font-semibold text-foreground">
                            {tableRows.length}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-foreground">
                            {table.getFilteredRowModel().rows.length}
                        </span>{' '}
                        booking(s) shown.
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
            <ReceiptDialog
                payment={receiptDialogPayment}
                onOpenChange={(open) => {
                    if (!open) {
                        setReceiptDialogPayment(null);
                    }
                }}
            />
        </CompanyDashboardLayout>
    );
}
