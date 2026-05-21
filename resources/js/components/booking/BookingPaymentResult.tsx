import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/constants/booking';
import { cn, extractImageSrc } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
    ArrowRightIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    CreditCardIcon,
    MapPinIcon,
    PlaneIcon,
    ReceiptIcon,
    RotateCcwIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type BookingPaymentResultData = {
    bookingId: number | string;
    bookingNumber: string;
    bookingStatus: string;
    paymentStatus: string;
    paymentMode: string | null;
    tourName: string;
    tourCode: string | null;
    destination: string | null;
    departureDate: string | null;
    returnDate: string | null;
    paxSummary: string;
    grandTotal: number;
    paidAmount: number;
    remainingBalance: number;
    image?: unknown;
};

function normalize(value: string | null | undefined): string {
    return (value ?? '').toLowerCase().replaceAll('_', ' ');
}

function safeDate(date: string | null): string {
    if (!date) return '-';

    return formatDate(date);
}

function getResultCopy(result: BookingPaymentResultData) {
    const bookingStatus = normalize(result.bookingStatus);
    const paymentStatus = normalize(result.paymentStatus);
    const paymentMode = normalize(result.paymentMode);

    if (
        bookingStatus === 'waiting payment approval' ||
        (paymentMode === 'manual' && paymentStatus === 'pending')
    ) {
        return {
            icon: ClockIcon,
            tone: 'warning',
            eyebrow: 'Payment proof received',
            headline: 'Your payment is waiting for approval',
            body: 'We have received your payment receipt. We will verify it and update your booking status after approval.',
            badge: 'Waiting Payment Approval',
            refreshable: true,
        };
    }

    if (bookingStatus === 'full payment') {
        return {
            icon: CheckCircleIcon,
            tone: 'success',
            eyebrow: 'Booking confirmed',
            headline: "You're booked and paid",
            body: 'Your payment has been recorded. You can review your itinerary and booking details from My Bookings anytime.',
            badge: 'Full Payment',
            refreshable: false,
        };
    }

    if (bookingStatus === 'down payment') {
        return {
            icon: CheckCircleIcon,
            tone: 'success',
            eyebrow: 'Down payment confirmed',
            headline: 'Your down payment is confirmed',
            body: 'Your seat is secured. The remaining balance will stay visible in My Bookings when you are ready to complete the payment.',
            badge: 'Down Payment',
            refreshable: false,
        };
    }

    if (paymentStatus === 'pending') {
        return {
            icon: ClockIcon,
            tone: 'warning',
            eyebrow: 'Payment in progress',
            headline: 'Your payment is being processed',
            body: 'We are checking the payment status with the provider. This can take a moment if the final confirmation has not arrived yet.',
            badge: 'Payment Pending',
            refreshable: false,
        };
    }

    return {
        icon: CreditCardIcon,
        tone: 'neutral',
        eyebrow: 'Payment status',
        headline: 'Payment status received',
        body: 'Your latest payment status has been saved. You can continue tracking this booking from My Bookings.',
        badge: result.bookingStatus,
        refreshable: false,
    };
}

export default function BookingPaymentResult({
    result,
    onRefresh,
    isRefreshing = false,
}: {
    result: BookingPaymentResultData;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}) {
    const copy = getResultCopy(result);
    const Icon = copy.icon;
    const hasImage = Boolean((result.image as any)?.data?.files?.length);
    const image = hasImage ? extractImageSrc(result.image as any).src : '';
    const dateRange =
        result.departureDate && result.returnDate
            ? `${safeDate(result.departureDate)} - ${safeDate(result.returnDate)}`
            : safeDate(result.departureDate);

    return (
        <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full items-center gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12">
                    <section className="order-1 space-y-8 lg:order-none">
                        <div className="space-y-5">
                            <div
                                className={cn(
                                    'flex size-12 items-center justify-center rounded-full border shadow-sm',
                                    copy.tone === 'warning' &&
                                        'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
                                    copy.tone === 'success' &&
                                        'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
                                    copy.tone === 'neutral' &&
                                        'bg-card text-primary',
                                )}
                            >
                                <Icon className="size-6" />
                            </div>
                            <div className="space-y-3">
                                <p
                                    className={cn(
                                        'text-sm font-semibold uppercase tracking-[0.18em]',
                                        copy.tone === 'warning' &&
                                            'text-amber-600 dark:text-amber-300',
                                        copy.tone === 'success' &&
                                            'text-emerald-600 dark:text-emerald-300',
                                        copy.tone === 'neutral' &&
                                            'text-primary',
                                    )}
                                >
                                    {copy.eyebrow}
                                </p>
                                <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                                    {copy.headline}
                                </h1>
                                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                                    {copy.body}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                asChild
                                size="lg"
                                className="w-full sm:w-auto"
                            >
                                <Link href="/mybookings">
                                    View My Bookings
                                    <ArrowRightIcon className="size-4" />
                                </Link>
                            </Button>
                            {copy.refreshable && onRefresh && (
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                >
                                    <RotateCcwIcon
                                        className={cn(
                                            'size-4',
                                            isRefreshing && 'animate-spin',
                                        )}
                                    />
                                    {isRefreshing
                                        ? 'Refreshing...'
                                        : 'Refresh Status'}
                                </Button>
                            )}
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                <Link href="/tours">Back to Tours</Link>
                            </Button>
                        </div>
                    </section>

                    <aside className="order-2 lg:order-none">
                        <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-foreground/5">
                            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                                {image ? (
                                    <img
                                        src={image}
                                        alt={result.tourName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        <PlaneIcon className="size-10" />
                                    </div>
                                )}
                                <div className="absolute left-4 top-4">
                                    <Badge
                                        className={cn(
                                            'border bg-background/90 px-3 py-1 shadow-sm backdrop-blur',
                                            copy.tone === 'warning' &&
                                                'border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300',
                                            copy.tone === 'success' &&
                                                'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300',
                                            copy.tone === 'neutral' &&
                                                'border-primary/20 text-primary',
                                        )}
                                    >
                                        {copy.badge}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-5 p-5 sm:p-6">
                                <div className="space-y-2">
                                    {result.tourCode && (
                                        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            {result.tourCode}
                                        </p>
                                    )}
                                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                                        {result.tourName}
                                    </h2>
                                </div>

                                <div className="grid gap-3 text-sm text-muted-foreground">
                                    <SummaryRow
                                        icon={CalendarIcon}
                                        label="Schedule"
                                        value={dateRange}
                                    />
                                    <SummaryRow
                                        icon={MapPinIcon}
                                        label="Destination"
                                        value={result.destination || '-'}
                                    />
                                    <SummaryRow
                                        icon={ReceiptIcon}
                                        label="Booking number"
                                        value={result.bookingNumber}
                                        valueClassName="font-mono"
                                    />
                                    <SummaryRow
                                        icon={PlaneIcon}
                                        label="Guests"
                                        value={result.paxSummary}
                                    />
                                </div>

                                <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                                    <AmountRow
                                        label="Grand Total"
                                        value={result.grandTotal}
                                    />
                                    <AmountRow
                                        label="Paid Amount"
                                        value={result.paidAmount}
                                    />
                                    <AmountRow
                                        label="Remaining Balance"
                                        value={result.remainingBalance}
                                        emphasized={result.remainingBalance > 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function SummaryRow({
    icon: Icon,
    label,
    value,
    valueClassName,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                </p>
                <p
                    className={cn(
                        'mt-0.5 break-words font-medium text-foreground',
                        valueClassName,
                    )}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

function AmountRow({
    label,
    value,
    emphasized = false,
}: {
    label: string;
    value: number;
    emphasized?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={cn(
                    'text-right font-semibold text-foreground',
                    emphasized && 'text-primary',
                )}
            >
                {formatCurrency(Number(value ?? 0))}
            </span>
        </div>
    );
}
