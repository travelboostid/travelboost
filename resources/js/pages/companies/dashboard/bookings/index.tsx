import BookingSchedulePicker, {
    type RescheduleScheduleOption,
} from '@/components/booking/booking-schedule-picker';
import {
    ManualPaymentDialog,
    type ManualPaymentData,
} from '@/components/booking/ManualPaymentDialog';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatIDR } from '@/constants/booking';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { hasOnlinePaymentInstructions } from '@/lib/payment-instructions';
import { cn } from '@/lib/utils';
import { CorrectionChangeSummary } from '@/pages/companies/dashboard/bookings/components/booking-correction/correction-change-summary';
import ReschedulePriceAdjustmentField from '@/pages/companies/dashboard/bookings/components/booking-correction/reschedule-price-adjustment-field';
import { Head, Link, router } from '@inertiajs/react';
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
import axios from 'axios';
import dayjs from 'dayjs';
import {
    AlertTriangleIcon,
    ArrowRightIcon,
    CalendarClockIcon,
    ChevronDown,
    CircleSlashIcon,
    Clock3Icon,
    CreditCardIcon,
    EditIcon,
    EyeIcon,
    FileCheckIcon,
    FileTextIcon,
    HistoryIcon,
    MoreHorizontal,
    RotateCcwIcon,
    Search,
    Undo2Icon,
    XIcon,
} from 'lucide-react';
import * as React from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

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
    payment_overdue_amount: number;
    payment_due_soon: number;
    payment_due_soon_amount: number;
    documents_incomplete: number;
    documents_due_soon: number;
};

type PaymentDetail = {
    method_label: string;
    receiver_label: string;
    amount: number;
    payment_date: string | null;
    booking_payment_type?: 'down_payment' | 'full_payment' | null;
    display_label?: string | null;
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
    receipt_group?: {
        title: string;
        detail: PaymentDetail;
    }[];
};

type DocumentDetail = {
    passenger_name: string;
    passport_file_url: string | null;
    visa_file_url: string | null;
    passport_file_name: string | null;
    visa_file_name: string | null;
};

type PaymentReviewItem = {
    id: number;
    provider: string | null;
    payment_method: string | null;
    status: string | null;
    payment_flow_stage: string | null;
    sender_bank_name: string | null;
    sender_account_number: string | null;
    transfer_amount: number;
    amount?: number;
    proof_path: string | null;
    proof_url: string | null;
    payment_type: string | null;
    payment_date: string | null;
    receipt?: PaymentDetail['receipt'];
};

type BookingResource = {
    id: number;
    booking_number: string;
    contact_name: string | null;
    status: string;
    reserved_type?: string | null;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    total_price: string;
    grand_total: string;
    paid_amount: number;
    remaining_balance: number;
    remaining_balance_visible?: boolean;
    commission_amount: string | null;
    continue_booking_url?: string | null;
    document_detail?: DocumentDetail[];
    payment_receiver_type?: 'vendor' | 'agent' | null;
    payment_receiver_company_id?: number | null;
    invoice_options?: {
        type: 'vendor_to_customer' | 'vendor_to_agent' | 'agent_to_customer';
        label: string;
    }[];
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
        target_action: 'cancel' | 'refund' | 'reschedule' | 'restore';
        status: string;
    } | null;
    can_cancel?: boolean;
    can_refund?: boolean;
    can_reschedule?: boolean;
    can_reactivate?: boolean;
    can_reorder?: boolean;
    proforma_invoice_available?: boolean;
    down_payment_detail: PaymentDetail | null;
    full_payment_detail: PaymentDetail | null;
    departure_date: string | null;
    was_rescheduled?: boolean;
    created_at: string;
    tour: { id: number; name: string } | null;
    vendor: { id: number; name: string } | null;
    agent: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
    payment_workflow?: {
        mode: 'direct' | 'agent_collection';
        stage:
            | 'direct_payment'
            | 'customer_payment_due'
            | 'customer_review'
            | 'agent_vendor_payment_due'
            | 'vendor_review'
            | 'complete'
            | 'closed';
        customer_payment: PaymentReviewItem | null;
        agent_vendor_payment: PaymentReviewItem | null;
        can_review_customer_payment: boolean;
        can_pay_vendor: boolean;
        can_review_agent_vendor_payment: boolean;
        vendor_bank_info?: {
            bankName: string;
            accountName: string;
            accountNumber: string;
        } | null;
    };
    can_review_manual_payment?: boolean;
    can_review_payment?: boolean;
    manual_payment:
        | (PaymentReviewItem & {
              id: number;
              customer_payment?: PaymentReviewItem | null;
              agent_vendor_payment?: PaymentReviewItem | null;
          })
        | null;
};

type PageProps = {
    data: {
        data: BookingResource[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from: number | null;
        to: number | null;
        links: { url: string | null; label: string; active: boolean }[];
    };
    followupSummary: FollowupSummary;
};

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

function DocumentsDialog({
    bookingNumber,
    documents,
    onOpenChange,
}: {
    bookingNumber: string | null;
    documents: DocumentDetail[];
    onOpenChange: (open: boolean) => void;
}) {
    const intl = useIntl();

    return (
        <Dialog open={Boolean(bookingNumber)} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        <FormattedMessage defaultMessage="Travel Documents" />
                    </DialogTitle>
                    <DialogDescription>
                        {bookingNumber
                            ? intl.formatMessage(
                                  {
                                      defaultMessage:
                                          'Documents for booking {bookingNumber}.',
                                  },
                                  { bookingNumber },
                              )
                            : intl.formatMessage({
                                  defaultMessage: 'Submitted travel documents.',
                              })}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {documents.length > 0 ? (
                        documents.map((document, index) => (
                            <div
                                key={`${document.passenger_name}-${index}`}
                                className="rounded-lg border bg-muted/30 p-4 text-sm"
                            >
                                <p className="font-semibold">
                                    {document.passenger_name}
                                </p>
                                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                    <div className="rounded-md border bg-background p-3">
                                        <p className="font-semibold text-muted-foreground">
                                            <FormattedMessage defaultMessage="Passport" />
                                        </p>
                                        {document.passport_file_url ? (
                                            <a
                                                href={
                                                    document.passport_file_url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-1 block truncate font-semibold text-primary hover:underline"
                                            >
                                                {document.passport_file_name ??
                                                    intl.formatMessage({
                                                        defaultMessage:
                                                            'View passport',
                                                    })}
                                            </a>
                                        ) : (
                                            <p className="mt-1 text-muted-foreground">
                                                -
                                            </p>
                                        )}
                                    </div>
                                    <div className="rounded-md border bg-background p-3">
                                        <p className="font-semibold text-muted-foreground">
                                            <FormattedMessage defaultMessage="Visa" />
                                        </p>
                                        {document.visa_file_url ? (
                                            <a
                                                href={document.visa_file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-1 block truncate font-semibold text-primary hover:underline"
                                            >
                                                {document.visa_file_name ??
                                                    intl.formatMessage({
                                                        defaultMessage:
                                                            'View visa',
                                                    })}
                                            </a>
                                        ) : (
                                            <p className="mt-1 text-muted-foreground">
                                                -
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="No submitted documents are available." />
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function FollowupSummaryCards({
    summary,
    companyUsername,
}: {
    summary: FollowupSummary;
    companyUsername: string;
}) {
    const intl = useIntl();
    const activeFollowup =
        typeof window === 'undefined'
            ? ''
            : (new URLSearchParams(window.location.search).get('followup') ??
              '');
    const applyFollowupFilter = (followup: string) => {
        const params = new URLSearchParams(window.location.search);
        params.delete('page');
        params.delete('status');

        if (activeFollowup === followup) {
            params.delete('followup');
        } else {
            params.set('followup', followup);
        }

        const query = params.toString();
        router.get(
            `/companies/${companyUsername}/dashboard/bookings${query ? `?${query}` : ''}`,
            {},
            {
                preserveState: true,
            },
        );
    };
    const items = [
        {
            label: intl.formatMessage({ defaultMessage: 'Payment overdue' }),
            value: summary.payment_overdue,
            amount: summary.payment_overdue_amount,
            followup: 'payment_overdue',
            icon: AlertTriangleIcon,
            className:
                'border-red-100 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300',
        },
        {
            label: intl.formatMessage({ defaultMessage: 'Payment due soon' }),
            value: summary.payment_due_soon,
            amount: summary.payment_due_soon_amount,
            followup: 'payment_due_soon',
            icon: CreditCardIcon,
            className:
                'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
        },
        {
            label: intl.formatMessage({ defaultMessage: 'Docs incomplete' }),
            value: summary.documents_incomplete,
            amount: null,
            followup: 'documents_incomplete',
            icon: FileCheckIcon,
            className:
                'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200',
        },
        {
            label: intl.formatMessage({ defaultMessage: 'Docs due soon' }),
            value: summary.documents_due_soon,
            amount: null,
            followup: 'documents_due_soon',
            icon: CalendarClockIcon,
            className:
                'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300',
        },
    ];

    return (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeFollowup === item.followup;

                return (
                    <button
                        type="button"
                        key={item.label}
                        onClick={() => applyFollowupFilter(item.followup)}
                        className={cn(
                            'flex items-center justify-between rounded-md border px-2.5 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:shadow-none',
                            item.className,
                            isActive &&
                                'ring-2 ring-primary/35 ring-offset-1 ring-offset-background',
                        )}
                    >
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider">
                                {item.label}
                            </p>
                            <p className="mt-0.5 text-lg font-bold tabular-nums">
                                {item.value}
                            </p>
                            {item.amount !== null && item.amount > 0 && (
                                <p className="mt-0.5 text-[10px] font-semibold tabular-nums opacity-85">
                                    {formatIDR(item.amount)}
                                </p>
                            )}
                        </div>
                        <Icon className="size-4 opacity-80" />
                    </button>
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
    const intl = useIntl();
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
                        {intl.formatMessage(
                            {
                                defaultMessage:
                                    '{adult} Adult · {child} Child · {infant} Infant',
                            },
                            { adult, child, infant },
                        )}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function reviewPaymentAmount(payment: PaymentReviewItem): number {
    return Number(payment.transfer_amount ?? payment.amount ?? 0);
}

function reviewPaymentType(payment: PaymentReviewItem): string {
    return (payment.payment_type ?? 'full_payment').replace(/_/g, ' ');
}

function reviewPaymentDetail(
    payment: PaymentReviewItem,
    intl: IntlShape,
): PaymentDetail {
    const receiptType = payment.provider === 'midtrans' ? 'online' : 'manual';

    return {
        method_label:
            payment.provider === 'midtrans'
                ? intl.formatMessage({ defaultMessage: 'Online payment' })
                : intl.formatMessage({ defaultMessage: 'Manual payment' }),
        receiver_label:
            payment.payment_flow_stage === 'agent_to_vendor'
                ? intl.formatMessage({ defaultMessage: 'vendor' })
                : intl.formatMessage({ defaultMessage: 'agent' }),
        amount: reviewPaymentAmount(payment),
        payment_date: payment.payment_date,
        booking_payment_type: payment.payment_type as
            | 'down_payment'
            | 'full_payment'
            | null
            | undefined,
        receipt:
            payment.receipt ??
            (payment.proof_url || payment.proof_path
                ? {
                      type: receiptType,
                      url: payment.proof_url,
                      provider: payment.provider,
                      method: payment.payment_method,
                      status: payment.status,
                  }
                : null),
    };
}

function PaymentReviewSection({
    title,
    payment,
    onViewReceipt,
}: {
    title: string;
    payment: PaymentReviewItem;
    onViewReceipt?: (detail: PaymentDetail) => void;
}) {
    const intl = useIntl();
    const amount = reviewPaymentAmount(payment);
    const detail = reviewPaymentDetail(payment, intl);
    const isOnlinePayment = payment.provider === 'midtrans';
    const senderLabel = isOnlinePayment
        ? intl.formatMessage({ defaultMessage: 'Payment Channel' })
        : intl.formatMessage({ defaultMessage: 'Sender Bank' });
    const senderValue = isOnlinePayment
        ? intl.formatMessage({ defaultMessage: 'Midtrans Online Payment' })
        : (payment.sender_bank_name ?? '—');
    const accountLabel = isOnlinePayment
        ? intl.formatMessage({ defaultMessage: 'Reference' })
        : intl.formatMessage({ defaultMessage: 'Account Number' });
    const accountValue = isOnlinePayment
        ? (detail.receipt?.order_id ??
          intl.formatMessage({ defaultMessage: 'Gateway transaction' }))
        : (payment.sender_account_number ?? '—');

    return (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b pb-2">
                <span className="font-semibold">{title}</span>
                <Badge variant="outline" className="uppercase">
                    {payment.provider === 'midtrans'
                        ? intl.formatMessage({
                              defaultMessage: 'Online payment',
                          })
                        : intl.formatMessage({
                              defaultMessage: 'Manual payment',
                          })}
                </Badge>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{senderLabel}</span>
                <span className="text-right font-semibold">{senderValue}</span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{accountLabel}</span>
                <span
                    className={cn(
                        'text-right font-semibold',
                        !isOnlinePayment && 'font-mono',
                    )}
                >
                    {accountValue}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Transfer Amount" />
                </span>
                <span className="text-right font-semibold">
                    {formatIDR(amount)}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Payment Type" />
                </span>
                <span className="text-right font-semibold capitalize">
                    {reviewPaymentType(payment).toLowerCase()}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Payment Time" />
                </span>
                <span className="text-right font-semibold">
                    {payment.payment_date
                        ? dayjs(payment.payment_date).format('DD MMM YYYY')
                        : '—'}
                </span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-3">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Receipt" />
                </span>
                {payment.proof_url ? (
                    <a
                        href={payment.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary hover:underline"
                    >
                        <FormattedMessage defaultMessage="View receipt" />
                    </a>
                ) : detail.receipt && onViewReceipt ? (
                    <button
                        type="button"
                        className="font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        onClick={() => onViewReceipt(detail)}
                    >
                        <FormattedMessage defaultMessage="View receipt" />
                    </button>
                ) : (
                    <span className="text-right text-muted-foreground">
                        {payment.proof_path ??
                            intl.formatMessage({
                                defaultMessage: 'Gateway receipt',
                            })}
                    </span>
                )}
            </div>
        </div>
    );
}

function RowActions({
    booking,
    companyUsername,
    isAgent,
}: {
    booking: BookingResource;
    companyUsername: string;
    isAgent: boolean;
}) {
    const intl = useIntl();
    const [reviewOpen, setReviewOpen] = React.useState(false);
    const [reviewReceiptPayment, setReviewReceiptPayment] =
        React.useState<PaymentDetail | null>(null);
    const [manualPayVendorOpen, setManualPayVendorOpen] = React.useState(false);
    const [paymentActionError, setPaymentActionError] = React.useState<
        string | null
    >(null);
    const [vendorMethodDialogOpen, setVendorMethodDialogOpen] =
        React.useState(false);
    const [actionDialog, setActionDialog] = React.useState<
        'cancel' | 'refund' | 'reschedule' | 'restore' | null
    >(null);
    const [correctionAction, setCorrectionAction] = React.useState<
        'cancel' | 'refund' | 'reschedule' | 'restore'
    >('cancel');
    const [selectedSchedule, setSelectedSchedule] =
        React.useState<RescheduleScheduleOption | null>(null);
    const [actionReason, setActionReason] = React.useState('');
    const [applyCustomerPriceAdjustment, setApplyCustomerPriceAdjustment] =
        React.useState(true);
    const [processingAction, setProcessingAction] = React.useState<
        | 'accept'
        | 'cancel'
        | 'refund'
        | 'reschedule'
        | 'restore'
        | 'reorder'
        | 'pay_vendor_manual'
        | 'pay_vendor_online'
        | null
    >(null);
    const workflow = booking.payment_workflow;
    const workflowCustomerPayment = workflow?.customer_payment ?? null;
    const workflowAgentVendorPayment = workflow?.agent_vendor_payment ?? null;
    const manualPayment = booking.manual_payment;
    const customerPayment =
        manualPayment?.customer_payment ??
        workflowCustomerPayment ??
        (manualPayment?.payment_flow_stage === 'customer_to_agent'
            ? manualPayment
            : null);
    const agentVendorPayment =
        manualPayment?.agent_vendor_payment ?? workflowAgentVendorPayment;
    const canPayVendor = Boolean(workflow?.can_pay_vendor && customerPayment);
    const canReviewPayment =
        booking.status === 'waiting payment approval' &&
        Boolean(booking.manual_payment) &&
        Boolean(
            booking.can_review_payment ?? booking.can_review_manual_payment,
        );
    const canOpenPaymentReview = canReviewPayment || canPayVendor;
    const isAgentCollectionWorkflow = workflow?.mode === 'agent_collection';
    const canReviewCustomerPayment = Boolean(
        isAgentCollectionWorkflow &&
        workflow?.can_review_customer_payment &&
        booking.manual_payment?.payment_flow_stage === 'customer_to_agent',
    );
    const canReviewAgentVendorPayment = Boolean(
        isAgentCollectionWorkflow &&
        workflow?.can_review_agent_vendor_payment &&
        booking.manual_payment?.payment_flow_stage === 'agent_to_vendor',
    );
    const canReviewDirectPayment = Boolean(
        !isAgentCollectionWorkflow &&
        canReviewPayment &&
        booking.manual_payment,
    );
    const canSubmitPaymentReviewDecision =
        canReviewCustomerPayment ||
        canReviewAgentVendorPayment ||
        canReviewDirectPayment;
    const hasPendingActionRequest = Boolean(booking.pending_action_request);
    const canCancel = Boolean(booking.can_cancel) && !hasPendingActionRequest;
    const canRefund = Boolean(booking.can_refund) && !hasPendingActionRequest;
    const canReschedule =
        Boolean(booking.can_reschedule) && !hasPendingActionRequest;
    const canReactivate =
        Boolean(booking.can_reactivate) && !hasPendingActionRequest;
    const canReorder = Boolean(booking.can_reorder);
    const canOpenCorrection =
        canCancel || canRefund || canReschedule || canReactivate;
    const activeCorrectionAction = isAgent ? correctionAction : actionDialog;
    const invoiceOptions = booking.invoice_options ?? [];
    const manualPaymentId = booking.manual_payment?.id;
    const isPayVendorFollowup =
        booking.payment_followup?.action_label === 'Pay Vendor';
    const editStep =
        booking.payment_followup?.action_url && !isPayVendorFollowup
            ? 'payment'
            : booking.document_followup?.action_url
              ? 'documents'
              : null;
    const editHref = `/companies/${companyUsername}/dashboard/bookings/${booking.id}/edit${
        editStep ? `?step=${editStep}` : ''
    }`;
    const editLabel = intl.formatMessage({ defaultMessage: 'Edit' });

    React.useEffect(() => {
        if (!canOpenPaymentReview || !manualPaymentId) {
            return;
        }

        const reviewPaymentId = new URLSearchParams(window.location.search).get(
            'review_payment',
        );

        if (reviewPaymentId === String(manualPaymentId)) {
            setReviewOpen(true);
        }
    }, [canOpenPaymentReview, manualPaymentId]);

    const handleReviewOpenChange = React.useCallback((open: boolean) => {
        setReviewOpen(open);
    }, []);

    const submitManualPaymentDecision = () => {
        if (!booking.manual_payment || !canSubmitPaymentReviewDecision) return;

        setProcessingAction('accept');
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/payments/${booking.manual_payment.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setReviewOpen(false),
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const submitBookingAction = () => {
        const action = isAgent ? correctionAction : actionDialog;

        if (!action) {
            return;
        }

        if (action === 'reschedule' && !selectedSchedule) {
            return;
        }

        setProcessingAction(action);
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/${action}`,
            {
                reason: actionReason,
                ...(action === 'reschedule' && selectedSchedule
                    ? {
                          schedule_id: selectedSchedule.id,
                          ...(!isAgent
                              ? {
                                    apply_customer_price_adjustment:
                                        applyCustomerPriceAdjustment,
                                }
                              : {}),
                      }
                    : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActionDialog(null);
                    setActionReason('');
                    setSelectedSchedule(null);
                    setApplyCustomerPriceAdjustment(true);
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const openCorrectionDialog = (
        action: 'cancel' | 'refund' | 'reschedule' | 'restore',
    ) => {
        setCorrectionAction(action);
        setActionDialog(action);
        setSelectedSchedule(null);
        setActionReason('');
        setApplyCustomerPriceAdjustment(true);
    };
    const submitReorder = () => {
        setProcessingAction('reorder');
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/reorder`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const customerPaymentAmount = customerPayment
        ? reviewPaymentAmount(customerPayment)
        : 0;
    const customerPaymentType =
        (customerPayment?.payment_type as 'down_payment' | 'full_payment') ??
        'full_payment';
    const submitAgentVendorManualPayment = (data: ManualPaymentData) => {
        if (!customerPayment || !data.proofFile) return;

        setProcessingAction('pay_vendor_manual');
        setPaymentActionError(null);

        const formData = new FormData();
        formData.append('sender_bank_name', data.senderBankName);
        formData.append('sender_account_number', data.senderAccountNumber);
        formData.append('transfer_amount', String(customerPaymentAmount));
        formData.append('payment_type', customerPaymentType);
        formData.append('payment_date', data.paymentDate);
        formData.append('proof', data.proofFile);

        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/manual-payment`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setManualPayVendorOpen(false);
                    setReviewOpen(false);
                },
                onError: (errors) => {
                    setPaymentActionError(
                        String(
                            errors.payment ??
                                errors.payment_type ??
                                errors.transfer_amount ??
                                intl.formatMessage({
                                    defaultMessage:
                                        'Payment could not be submitted.',
                                }),
                        ),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const confirmAgentVendorOnlinePayment = (
        paymentId: number | string | undefined,
    ) => {
        if (!paymentId) {
            setProcessingAction(null);
            return;
        }

        axios
            .post(
                `/companies/${companyUsername}/dashboard/bookings/${booking.id}/online-payment/${paymentId}/confirm`,
                {},
                {
                    withCredentials: true,
                    withXSRFToken: true,
                },
            )
            .then((response) => {
                const status = response.data?.payment?.status;

                if (status === 'paid') {
                    setReviewOpen(false);
                    router.reload();
                    return;
                }

                setPaymentActionError(
                    intl.formatMessage({
                        defaultMessage:
                            'Payment is not completed yet. You can reopen Online Payment to continue the same attempt while it is active.',
                    }),
                );
            })
            .catch(() => {
                setPaymentActionError(
                    intl.formatMessage({
                        defaultMessage:
                            'Payment status could not be confirmed yet. You can reopen Pay Vendor and continue the same payment attempt.',
                    }),
                );
            })
            .finally(() => setProcessingAction(null));
    };
    const submitAgentVendorOnlinePayment = (paymentMethodId: number) => {
        if (!customerPayment || customerPaymentAmount <= 0) return;

        setProcessingAction('pay_vendor_online');
        setPaymentActionError(null);

        axios
            .post(
                `/companies/${companyUsername}/dashboard/bookings/${booking.id}/online-payment`,
                {
                    payment_type: customerPaymentType,
                    amount: customerPaymentAmount,
                    payment_method_id: paymentMethodId,
                },
                {
                    withCredentials: true,
                    withXSRFToken: true,
                },
            )
            .then((response) => {
                const payment = response.data?.payment as
                    | {
                          id?: number | string;
                          provider?: string | null;
                          amount?: number | string | null;
                          status?: string | null;
                          payload?: Record<string, unknown>;
                      }
                    | undefined;
                const paymentId = response.data?.payment?.id as
                    | number
                    | string
                    | undefined;
                const payload = response.data?.payment?.payload as
                    | Record<string, unknown>
                    | undefined;
                const provider = payment?.provider ?? 'midtrans';
                const paymentAmount = Number(
                    payment?.amount ?? customerPaymentAmount,
                );

                if (
                    !payload ||
                    (!hasOnlinePaymentInstructions(provider, payload) &&
                        Object.keys(payload).length === 0)
                ) {
                    setPaymentActionError(
                        intl.formatMessage({
                            defaultMessage:
                                'Online payment could not be started. Please try again.',
                        }),
                    );
                    setProcessingAction(null);
                    return;
                }

                openOnlinePayment(
                    {
                        id: paymentId,
                        status: payment?.status ?? 'pending',
                        provider,
                        amount: Number.isFinite(paymentAmount)
                            ? paymentAmount
                            : customerPaymentAmount,
                        payload,
                    },
                    {
                        onPaid: () =>
                            confirmAgentVendorOnlinePayment(paymentId),
                        onComplete: () => setProcessingAction(null),
                        reloadOnPaid: false,
                        statusCheck: paymentId
                            ? {
                                  url: `/companies/${companyUsername}/dashboard/bookings/${booking.id}/online-payment/${paymentId}/confirm`,
                                  method: 'POST',
                              }
                            : undefined,
                    },
                );
            })
            .catch((error) => {
                const message =
                    error?.response?.data?.message ??
                    error?.response?.data?.errors?.payment?.[0] ??
                    intl.formatMessage({
                        defaultMessage: 'Online payment could not be started.',
                    });

                setPaymentActionError(String(message));
                setProcessingAction(null);
            });
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
                        <span className="sr-only">
                            <FormattedMessage defaultMessage="Open menu" />
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {canReviewPayment && (
                        <>
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setReviewOpen(true);
                                }}
                            >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="Payment Approval" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    {canPayVendor && (
                        <>
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setReviewOpen(true);
                                }}
                            >
                                <CreditCardIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="Pay Vendor" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}`}
                        >
                            <EyeIcon className="mr-2 h-4 w-4" />
                            <FormattedMessage defaultMessage="View Detail" />
                        </Link>
                    </DropdownMenuItem>
                    {booking.continue_booking_url && (
                        <DropdownMenuItem asChild>
                            <Link href={booking.continue_booking_url}>
                                <ArrowRightIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="Continue Booking" />
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {invoiceOptions.map((option) => (
                        <DropdownMenuItem key={option.type} asChild>
                            <a
                                href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}/invoice?type=${option.type}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                {option.label}
                            </a>
                        </DropdownMenuItem>
                    ))}
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
                                    ? intl.formatMessage({
                                          defaultMessage: 'Reordering...',
                                      })
                                    : intl.formatMessage({
                                          defaultMessage: 'Reorder',
                                      })}
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={editHref}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            {editLabel}
                        </Link>
                    </DropdownMenuItem>
                    {isAgent &&
                        (canOpenCorrection || hasPendingActionRequest) && (
                            <>
                                <DropdownMenuSeparator />
                                {canOpenCorrection && (
                                    <DropdownMenuItem
                                        disabled={hasPendingActionRequest}
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            const defaultAction = canReschedule
                                                ? 'reschedule'
                                                : canReactivate
                                                  ? 'restore'
                                                  : canCancel && canRefund
                                                    ? 'cancel'
                                                    : canRefund
                                                      ? 'refund'
                                                      : canCancel
                                                        ? 'cancel'
                                                        : 'reschedule';
                                            openCorrectionDialog(defaultAction);
                                        }}
                                    >
                                        <CircleSlashIcon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Correction" />
                                    </DropdownMenuItem>
                                )}
                                {hasPendingActionRequest && (
                                    <DropdownMenuItem disabled>
                                        <FormattedMessage
                                            defaultMessage="Pending {action} request"
                                            values={{
                                                action:
                                                    booking
                                                        .pending_action_request
                                                        ?.target_action ??
                                                    intl.formatMessage({
                                                        defaultMessage:
                                                            'action',
                                                    }),
                                            }}
                                        />
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                    {!isAgent &&
                        (canCancel ||
                            canRefund ||
                            canReschedule ||
                            canReactivate) && (
                            <>
                                <DropdownMenuSeparator />
                                {canReschedule && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('reschedule');
                                        }}
                                    >
                                        <Clock3Icon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Reschedule" />
                                    </DropdownMenuItem>
                                )}
                                {canReactivate && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('restore');
                                        }}
                                    >
                                        <HistoryIcon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Reactivate" />
                                    </DropdownMenuItem>
                                )}
                                {canCancel && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('cancel');
                                        }}
                                    >
                                        <CircleSlashIcon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Cancel" />
                                    </DropdownMenuItem>
                                )}
                                {canRefund && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('refund');
                                        }}
                                    >
                                        <Undo2Icon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Refund" />
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={reviewOpen} onOpenChange={handleReviewOpenChange}>
                <DialogContent className="w-full max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {canPayVendor && !canSubmitPaymentReviewDecision
                                ? intl.formatMessage({
                                      defaultMessage: 'Pay Vendor',
                                  })
                                : intl.formatMessage({
                                      defaultMessage: 'Payment Approval',
                                  })}
                        </DialogTitle>
                        <DialogDescription>
                            {canPayVendor && !canSubmitPaymentReviewDecision
                                ? intl.formatMessage({
                                      defaultMessage:
                                          'Review the customer receipt, then submit the agent-to-vendor settlement.',
                                  })
                                : intl.formatMessage({
                                      defaultMessage:
                                          'Verify the payment receipt before approving this booking payment.',
                                  })}
                        </DialogDescription>
                    </DialogHeader>

                    {workflow?.mode === 'agent_collection' && (
                        <div className="space-y-4">
                            {customerPayment && (
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Customer to Agent',
                                    })}
                                    payment={customerPayment}
                                    onViewReceipt={setReviewReceiptPayment}
                                />
                            )}

                            {agentVendorPayment ? (
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Agent to Vendor',
                                    })}
                                    payment={agentVendorPayment}
                                    onViewReceipt={setReviewReceiptPayment}
                                />
                            ) : canPayVendor ? (
                                <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold">
                                                <FormattedMessage defaultMessage="Agent to Vendor" />
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="Submit the vendor settlement for this verified customer payment." />
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="uppercase"
                                        >
                                            {customerPayment
                                                ? reviewPaymentType(
                                                      customerPayment,
                                                  )
                                                : intl.formatMessage({
                                                      defaultMessage: 'Payment',
                                                  })}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t pt-3">
                                        <span className="text-muted-foreground">
                                            <FormattedMessage defaultMessage="Amount" />
                                        </span>
                                        <span className="font-semibold">
                                            {formatIDR(customerPaymentAmount)}
                                        </span>
                                    </div>
                                    {paymentActionError && (
                                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                                            {paymentActionError}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={processingAction !== null}
                                            onClick={() =>
                                                setManualPayVendorOpen(true)
                                            }
                                        >
                                            <FormattedMessage defaultMessage="Manual Transfer" />
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={processingAction !== null}
                                            onClick={() =>
                                                setVendorMethodDialogOpen(true)
                                            }
                                        >
                                            {processingAction ===
                                            'pay_vendor_online'
                                                ? intl.formatMessage({
                                                      defaultMessage:
                                                          'Opening...',
                                                  })
                                                : intl.formatMessage({
                                                      defaultMessage:
                                                          'Online Payment',
                                                  })}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {workflow?.mode !== 'agent_collection' &&
                        booking.manual_payment &&
                        !booking.manual_payment.agent_vendor_payment && (
                            <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Sender Bank" />
                                    </span>
                                    <span className="text-right font-semibold">
                                        {booking.manual_payment
                                            .sender_bank_name ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Account Number" />
                                    </span>
                                    <span className="text-right font-mono font-semibold">
                                        {booking.manual_payment
                                            .sender_account_number ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Transfer Amount" />
                                    </span>
                                    <span className="text-right font-semibold">
                                        {formatIDR(
                                            booking.manual_payment
                                                .transfer_amount,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Payment Type" />
                                    </span>
                                    <span className="text-right font-semibold capitalize">
                                        {(
                                            booking.manual_payment
                                                .payment_type ?? 'full_payment'
                                        )
                                            .replace(/_/g, ' ')
                                            .toLowerCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Payment Time" />
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
                                        <FormattedMessage defaultMessage="Receipt" />
                                    </span>
                                    {booking.manual_payment.proof_url ? (
                                        <a
                                            href={
                                                booking.manual_payment.proof_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-semibold text-primary hover:underline"
                                        >
                                            <FormattedMessage defaultMessage="View receipt" />
                                        </a>
                                    ) : (
                                        <span className="text-right text-muted-foreground">
                                            {booking.manual_payment
                                                .proof_path ?? '—'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                    {workflow?.mode !== 'agent_collection' &&
                        booking.manual_payment?.customer_payment &&
                        booking.manual_payment.agent_vendor_payment && (
                            <div className="space-y-4">
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Customer to Agent',
                                    })}
                                    payment={
                                        booking.manual_payment.customer_payment
                                    }
                                />
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Agent to Vendor',
                                    })}
                                    payment={
                                        booking.manual_payment
                                            .agent_vendor_payment
                                    }
                                />
                            </div>
                        )}

                    {canSubmitPaymentReviewDecision && (
                        <DialogFooter>
                            <Button
                                type="button"
                                disabled={processingAction !== null}
                                onClick={submitManualPaymentDecision}
                            >
                                {processingAction === 'accept'
                                    ? intl.formatMessage({
                                          defaultMessage: 'Approving...',
                                      })
                                    : intl.formatMessage({
                                          defaultMessage: 'Approve',
                                      })}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            <PaymentMethodDialog
                open={vendorMethodDialogOpen}
                onOpenChange={setVendorMethodDialogOpen}
                description={intl.formatMessage(
                    {
                        defaultMessage:
                            'Select how you want to pay {amount} to the vendor',
                    },
                    { amount: formatIDR(customerPaymentAmount) },
                )}
                loading={processingAction === 'pay_vendor_online'}
                onConfirm={(methodId) => {
                    setVendorMethodDialogOpen(false);
                    submitAgentVendorOnlinePayment(methodId);
                }}
            />

            <ManualPaymentDialog
                open={manualPayVendorOpen}
                onClose={() => setManualPayVendorOpen(false)}
                onSubmit={submitAgentVendorManualPayment}
                isSubmitting={processingAction === 'pay_vendor_manual'}
                vendorBank={
                    workflow?.vendor_bank_info ?? {
                        bankName: '',
                        accountName: '',
                        accountNumber: '',
                    }
                }
                amount={customerPaymentAmount}
            />

            <ReceiptDialog
                payment={reviewReceiptPayment}
                onOpenChange={(open) => {
                    if (!open) {
                        setReviewReceiptPayment(null);
                    }
                }}
            />

            <Dialog
                open={actionDialog !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setActionDialog(null);
                        setActionReason('');
                        setSelectedSchedule(null);
                    }
                }}
            >
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {isAgent
                                ? intl.formatMessage({
                                      defaultMessage: 'Booking Correction',
                                  })
                                : actionDialog === 'cancel'
                                  ? intl.formatMessage({
                                        defaultMessage: 'Cancel booking',
                                    })
                                  : actionDialog === 'refund'
                                    ? intl.formatMessage({
                                          defaultMessage: 'Refund booking',
                                      })
                                    : actionDialog === 'reschedule'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Reschedule booking',
                                        })
                                      : intl.formatMessage({
                                            defaultMessage:
                                                'Reactivate booking',
                                        })}
                        </DialogTitle>
                        <DialogDescription>
                            {isAgent
                                ? intl.formatMessage({
                                      defaultMessage:
                                          'Choose the correction type and add a reason. The vendor will review your request.',
                                  })
                                : actionDialog === 'cancel'
                                  ? intl.formatMessage({
                                        defaultMessage:
                                            'Are you sure you want to cancel this booking?',
                                    })
                                  : actionDialog === 'refund'
                                    ? intl.formatMessage({
                                          defaultMessage:
                                              'Are you sure you want to refund this booking?',
                                      })
                                    : actionDialog === 'reschedule'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Choose a new departure date for this booking.',
                                        })
                                      : intl.formatMessage({
                                            defaultMessage:
                                                'Restore this cancelled booking to an active status.',
                                        })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        {isAgent && (
                            <RadioGroup
                                value={correctionAction}
                                onValueChange={(value) => {
                                    const nextAction = value as
                                        | 'cancel'
                                        | 'refund'
                                        | 'reschedule'
                                        | 'restore';
                                    setCorrectionAction(nextAction);
                                    setActionDialog(nextAction);
                                    setSelectedSchedule(null);
                                }}
                                className="grid grid-cols-2 gap-2"
                            >
                                <Label
                                    htmlFor="correction-cancel"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="cancel"
                                        id="correction-cancel"
                                        disabled={!canCancel}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Cancellation" />
                                </Label>
                                <Label
                                    htmlFor="correction-refund"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="refund"
                                        id="correction-refund"
                                        disabled={!canRefund}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Refund" />
                                </Label>
                                <Label
                                    htmlFor="correction-reschedule"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="reschedule"
                                        id="correction-reschedule"
                                        disabled={!canReschedule}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Reschedule" />
                                </Label>
                                <Label
                                    htmlFor="correction-restore"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="restore"
                                        id="correction-restore"
                                        disabled={!canReactivate}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Reactivation" />
                                </Label>
                            </RadioGroup>
                        )}
                        {activeCorrectionAction === 'reschedule' && (
                            <BookingSchedulePicker
                                companyUsername={companyUsername}
                                bookingId={booking.id}
                                selectedScheduleId={
                                    selectedSchedule?.id ?? null
                                }
                                onSelect={setSelectedSchedule}
                            />
                        )}
                        {activeCorrectionAction === 'reschedule' &&
                            selectedSchedule && (
                                <div className="space-y-2">
                                    <CorrectionChangeSummary
                                        targetAction="reschedule"
                                        currentDeparture={
                                            booking.departure_date
                                        }
                                        payload={{
                                            previous_departure_date:
                                                booking.departure_date,
                                            requested_departure_date:
                                                selectedSchedule.departure_date,
                                            price_before: Number(
                                                booking.grand_total ?? 0,
                                            ),
                                            price_after:
                                                selectedSchedule.price_preview
                                                    .grand_total,
                                            price_difference:
                                                selectedSchedule.price_preview
                                                    .price_difference,
                                        }}
                                    />
                                    {isAgent ? (
                                        <>
                                            {selectedSchedule.price_preview
                                                .price_difference > 0 && (
                                                <p className="rounded-md border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                                    <FormattedMessage defaultMessage="The customer may need to pay an additional balance after reschedule. The vendor will confirm payment terms." />
                                                </p>
                                            )}
                                            {selectedSchedule.price_preview
                                                .price_difference < 0 && (
                                                <p className="rounded-md border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                    <FormattedMessage defaultMessage="A credit balance may be available. Contact the vendor to arrange a refund for the price difference." />
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <ReschedulePriceAdjustmentField
                                            priceDifference={
                                                selectedSchedule.price_preview
                                                    .price_difference
                                            }
                                            value={applyCustomerPriceAdjustment}
                                            onChange={
                                                setApplyCustomerPriceAdjustment
                                            }
                                        />
                                    )}
                                </div>
                            )}
                        {activeCorrectionAction === 'restore' && (
                            <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="This will reactivate the cancelled booking on {date} and restore its previous payment status."
                                    values={{
                                        date: booking.departure_date
                                            ? dayjs(
                                                  booking.departure_date,
                                              ).format('DD MMM YYYY')
                                            : '-',
                                    }}
                                />
                            </div>
                        )}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="correction-reason"
                                className="text-xs"
                            >
                                <FormattedMessage defaultMessage="Reason" />
                            </Label>
                            <Textarea
                                id="correction-reason"
                                value={actionReason}
                                onChange={(event) =>
                                    setActionReason(event.target.value)
                                }
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Reason (optional)',
                                })}
                                rows={3}
                                className="text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            size="sm"
                            variant={
                                actionDialog === 'refund' ||
                                actionDialog === 'reschedule' ||
                                actionDialog === 'restore'
                                    ? 'default'
                                    : 'destructive'
                            }
                            disabled={
                                processingAction !== null ||
                                (isAgent &&
                                    correctionAction === 'cancel' &&
                                    !canCancel) ||
                                (isAgent &&
                                    correctionAction === 'refund' &&
                                    !canRefund) ||
                                (isAgent &&
                                    correctionAction === 'reschedule' &&
                                    !canReschedule) ||
                                (isAgent &&
                                    correctionAction === 'restore' &&
                                    !canReactivate) ||
                                (!isAgent &&
                                    actionDialog === 'cancel' &&
                                    !canCancel) ||
                                (!isAgent &&
                                    actionDialog === 'refund' &&
                                    !canRefund) ||
                                (!isAgent &&
                                    actionDialog === 'reschedule' &&
                                    (!canReschedule || !selectedSchedule)) ||
                                (!isAgent &&
                                    actionDialog === 'restore' &&
                                    !canReactivate) ||
                                ((isAgent ? correctionAction : actionDialog) ===
                                    'reschedule' &&
                                    !selectedSchedule)
                            }
                            onClick={submitBookingAction}
                            className="capitalize"
                        >
                            {processingAction !== null
                                ? intl.formatMessage({
                                      defaultMessage: 'Processing...',
                                  })
                                : isAgent
                                  ? correctionAction === 'cancel'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Request cancellation',
                                        })
                                      : correctionAction === 'refund'
                                        ? intl.formatMessage({
                                              defaultMessage: 'Request refund',
                                          })
                                        : correctionAction === 'reschedule'
                                          ? intl.formatMessage({
                                                defaultMessage:
                                                    'Request reschedule',
                                            })
                                          : intl.formatMessage({
                                                defaultMessage:
                                                    'Request reactivation',
                                            })
                                  : actionDialog === 'cancel'
                                    ? intl.formatMessage({
                                          defaultMessage: 'Yes, cancel booking',
                                      })
                                    : actionDialog === 'refund'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Yes, refund booking',
                                        })
                                      : actionDialog === 'reschedule'
                                        ? intl.formatMessage({
                                              defaultMessage:
                                                  'Confirm reschedule',
                                          })
                                        : intl.formatMessage({
                                              defaultMessage:
                                                  'Confirm reactivation',
                                          })}
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
                    <RowActions
                        booking={row.original}
                        companyUsername={companyUsername}
                        isAgent={isAgent}
                    />
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

function receiptPaymentTime(payment: PaymentDetail): string {
    if (!payment.payment_date) {
        return '—';
    }

    return dayjs(payment.payment_date).format(
        payment.receipt?.type === 'online'
            ? 'DD MMM YYYY HH:mm:ss'
            : 'DD MMM YYYY',
    );
}

function receiptRowsForPayment(
    payment: PaymentDetail,
    intl: IntlShape,
): string[][] {
    if (!payment.receipt) {
        return [];
    }

    return [
        [
            intl.formatMessage({ defaultMessage: 'Type' }),
            payment.receipt.type.toUpperCase(),
        ],
        [
            intl.formatMessage({ defaultMessage: 'Method' }),
            payment.method_label,
        ],
        [
            intl.formatMessage({ defaultMessage: 'Receiver' }),
            payment.receiver_label,
        ],
        [
            intl.formatMessage({ defaultMessage: 'Amount' }),
            formatIDR(payment.amount),
        ],
        [
            intl.formatMessage({ defaultMessage: 'Payment Time' }),
            receiptPaymentTime(payment),
        ],
    ];
}

function paginationLabel(label: string, intl: IntlShape): string {
    const previous = intl.formatMessage({ defaultMessage: 'Previous' });
    const next = intl.formatMessage({ defaultMessage: 'Next' });

    return label
        .replace('&laquo; Previous', previous)
        .replace('Next &raquo;', next)
        .replace('&laquo;', previous)
        .replace('&raquo;', next);
}

function ReceiptDialog({
    payment,
    onOpenChange,
}: {
    payment: PaymentDetail | null;
    onOpenChange: (open: boolean) => void;
}) {
    const intl = useIntl();
    const receipt = payment?.receipt ?? null;
    const receiptRows = payment ? receiptRowsForPayment(payment, intl) : [];
    const receiptGroup =
        payment?.receipt_group?.filter((section) => section.detail.receipt) ??
        [];
    const hasReceiptGroup = receiptGroup.length > 0;

    return (
        <Dialog open={payment !== null} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        <FormattedMessage defaultMessage="Payment Receipt" />
                    </DialogTitle>
                    <DialogDescription>
                        <FormattedMessage defaultMessage="Transaction details for this booking payment." />
                    </DialogDescription>
                </DialogHeader>

                {hasReceiptGroup ? (
                    <div className="space-y-4 text-sm">
                        {receiptGroup.map((section) => {
                            const sectionReceipt = section.detail.receipt;
                            const sectionRows = receiptRowsForPayment(
                                section.detail,
                                intl,
                            );

                            return (
                                <div
                                    key={section.title}
                                    className="space-y-3 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b pb-2">
                                        <span className="font-semibold">
                                            {section.title}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="uppercase"
                                        >
                                            {sectionReceipt?.type ??
                                                intl.formatMessage({
                                                    defaultMessage: 'receipt',
                                                })}
                                        </Badge>
                                    </div>

                                    {sectionRows.map(([label, value]) => (
                                        <div
                                            key={`${section.title}-${label}`}
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

                                    {sectionReceipt?.type === 'manual' &&
                                        sectionReceipt.url && (
                                            <a
                                                href={sectionReceipt.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex text-sm font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                                            >
                                                <FormattedMessage defaultMessage="Open uploaded receipt" />
                                            </a>
                                        )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    payment &&
                    receipt && (
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
                                    <FormattedMessage defaultMessage="Open uploaded receipt" />
                                </a>
                            )}
                        </div>
                    )
                )}
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page({ data, followupSummary }: PageProps) {
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
                            </TooltipProvider>
                        );
                    })}
                </div>

                <FollowupSummaryCards
                    summary={followupSummary}
                    companyUsername={company.username}
                />

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
                                value={globalFilter}
                                onChange={(event) =>
                                    setGlobalFilter(event.target.value)
                                }
                                className="h-9 w-full rounded-lg border-slate-200 bg-background pl-9 pr-9 text-xs font-medium shadow-inner shadow-slate-100/70 transition-all placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/20 dark:placeholder:text-slate-500"
                            />
                            {globalFilter.trim() !== '' && (
                                <button
                                    type="button"
                                    aria-label={intl.formatMessage({
                                        defaultMessage: 'Clear search',
                                    })}
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
                                <FormattedMessage defaultMessage="View Columns" />{' '}
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
                    <div className="w-full overflow-x-auto overflow-y-visible relative [scrollbar-gutter:stable]">
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
                                variant={link.active ? 'default' : 'outline'}
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
            <ReceiptDialog
                payment={receiptDialogPayment}
                onOpenChange={(open) => {
                    if (!open) {
                        setReceiptDialogPayment(null);
                    }
                }}
            />
            <DocumentsDialog
                bookingNumber={documentsDialog?.bookingNumber ?? null}
                documents={documentsDialog?.documents ?? []}
                onOpenChange={(open) => {
                    if (!open) {
                        setDocumentsDialog(null);
                    }
                }}
            />
        </CompanyDashboardLayout>
    );
}
