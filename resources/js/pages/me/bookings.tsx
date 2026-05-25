import TenantLayout from '@/components/layouts/tenant-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatIDR } from '@/constants/booking';
import { cn, extractImageSrc } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { IconPdf } from '@tabler/icons-react';
import dayjs from 'dayjs';
import {
    ArrowRightIcon,
    CalendarIcon,
    ClipboardCheckIcon,
    ClockIcon,
    CreditCardIcon,
    EyeIcon,
    FileTextIcon,
    HeartIcon,
    type LucideIcon,
    RefreshCwIcon,
    SearchCheckIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type BookingItem = {
    id: number;
    booking_number: string;
    status: string;
    departure_date: string | null;
    created_at?: string | null;
    grand_total: string | number;
    paid_amount?: string | number | null;
    remaining_balance?: string | number | null;
    display_amount?: string | number | null;
    display_amount_label?: string | null;
    needs_travel_documents?: boolean;
    payment_deadline?: DeadlineInfo | null;
    document_deadline?: DeadlineInfo | null;
    document_url?: string | null;
    can_continue_booking?: boolean;
    can_reorder?: boolean;
    booking_window_closed?: boolean;
    action_unavailable_reason?: string | null;
    tour: {
        id: number;
        code?: string | null;
        name: string;
        destination?: string | null;
        duration_days?: number | null;
        image?: unknown;
        document?: unknown;
        company?: {
            id: number;
            username?: string | null;
            name?: string | null;
        };
    } | null;
    vendor: { id: number; name: string } | null;
};

type DeadlineInfo = {
    date: string;
    days_before_departure: number;
    days_remaining: number;
    is_overdue: boolean;
};

type TourItem = {
    id: number;
    name: string;
    destination?: string | null;
    code?: string | null;
    duration_days?: number | null;
    showprice?: string | number | null;
    image?: unknown;
    company?: { id: number; name: string } | null;
    schedules?: unknown[];
};

type Paginated<T> = {
    data: T[];
};

type PageProps = {
    auth: { user: { id: number; name: string } | null };
    bookings: Paginated<BookingItem> | null;
    favorites: Paginated<TourItem> | null;
    activeTab: 'favorites' | 'current' | 'history';
    selectedBookingNumber?: string | null;
};

type BookingAction = {
    label: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
};

type MetadataItem = {
    caption: string;
    label: string;
    valueClassName?: string;
    wrap?: 'normal' | 'break';
};

const TABS = [
    { key: 'favorites', label: 'Favorites', icon: HeartIcon },
    { key: 'current', label: 'Current Bookings', icon: CalendarIcon },
    { key: 'history', label: 'History', icon: ClockIcon },
] as const;

const STATUS_STYLES: Record<string, string> = {
    'awaiting payment':
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'waiting payment approval':
        'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'booking reserved':
        'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    'down payment':
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'full payment':
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    expired:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    refunded:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'waiting list':
        'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
};

const STATUS_LABELS: Record<string, string> = {
    'awaiting payment': 'Awaiting Payment',
    'waiting payment approval': 'Waiting Payment Approval',
    'booking reserved': 'Booking Reserved',
    'down payment': 'Down Payment',
    'full payment': 'Full Payment',
    expired: 'Expired',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    'waiting list': 'Waiting List',
};

function normalizeStatus(status: string) {
    const normalized = status
        .toLowerCase()
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .trim();

    if (normalized === 'dp') {
        return 'down payment';
    }

    if (normalized === 'fp') {
        return 'full payment';
    }

    if (normalized === 'brs') {
        return 'booking reserved';
    }

    if (normalized === 'wpa') {
        return 'waiting payment approval';
    }

    return normalized;
}

function getBookingCardId(bookingNumber: string) {
    return `booking-${bookingNumber.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function bookingCreateHref(
    booking: BookingItem,
    options: {
        reuseBookingNumber?: boolean;
        mode?: 'review';
        returnTab?: PageProps['activeTab'];
        step?: 'documents';
    } = {},
) {
    if (!booking.tour || !booking.departure_date) {
        return null;
    }

    const params = new URLSearchParams({
        date: dayjs(booking.departure_date).format('YYYY-MM-DD'),
    });
    if (options.reuseBookingNumber || options.mode || options.step) {
        params.set('booking_number', booking.booking_number);
    }
    if (options.mode) {
        params.set('mode', options.mode);
    }
    if (options.returnTab) {
        params.set('return_tab', options.returnTab);
    }
    if (options.step) {
        params.set('step', options.step);
    }

    return `/bookings/${booking.tour.id}/create?${params.toString()}`;
}

function bookingPaymentStatusHref(booking: BookingItem) {
    const params = new URLSearchParams({
        tab: 'current',
        booking_number: booking.booking_number,
    });

    return `/mybookings?${params.toString()}`;
}

function bookingDocumentsHref(booking: BookingItem) {
    const href = bookingCreateHref(booking, {
        reuseBookingNumber: true,
        step: 'documents',
    });

    return href;
}

function bookingReviewHref(
    booking: BookingItem,
    activeTab: PageProps['activeTab'],
) {
    return bookingCreateHref(booking, {
        reuseBookingNumber: true,
        mode: 'review',
        returnTab: activeTab,
    });
}

function deadlineText(label: string, deadline?: DeadlineInfo | null) {
    if (!deadline) {
        return null;
    }

    const date = dayjs(deadline.date).format('DD MMM YYYY');

    if (deadline.is_overdue) {
        return `${label} was due on ${date}`;
    }

    if (deadline.days_remaining === 0) {
        return `${label} is due today`;
    }

    return `${label} in ${deadline.days_remaining} day${
        deadline.days_remaining === 1 ? '' : 's'
    } (${date})`;
}

function getBookingAction(booking: BookingItem): BookingAction | null {
    const status = normalizeStatus(booking.status);
    const href = bookingCreateHref(booking);

    if (status === 'awaiting payment' && href) {
        if (booking.can_continue_booking === false) {
            return null;
        }

        return {
            label: 'Continue Booking',
            icon: ArrowRightIcon,
            href:
                bookingCreateHref(booking, { reuseBookingNumber: true }) ??
                href,
        };
    }

    if (status === 'booking reserved' && href) {
        if (booking.can_continue_booking === false) {
            return null;
        }

        return {
            label: 'Continue Booking',
            icon: ArrowRightIcon,
            href:
                bookingCreateHref(booking, { reuseBookingNumber: true }) ??
                href,
        };
    }

    if (status === 'expired' && href) {
        if (booking.can_reorder === false) {
            return null;
        }

        return {
            label: 'Reorder',
            icon: RefreshCwIcon,
            onClick: () =>
                router.post(
                    `/bookings/${booking.id}/reorder`,
                    {},
                    {
                        preserveScroll: true,
                    },
                ),
        };
    }

    if (status === 'down payment' && href) {
        return {
            label: 'Pay Balance',
            icon: CreditCardIcon,
            href:
                bookingCreateHref(booking, { reuseBookingNumber: true }) ??
                href,
        };
    }

    if (status === 'full payment') {
        return {
            label: 'Invoice',
            icon: FileTextIcon,
            onClick: () =>
                window.open(
                    `/mybookings/${booking.id}/invoice`,
                    '_blank',
                    'noopener,noreferrer',
                ),
        };
    }

    if (status === 'waiting payment approval') {
        return {
            label: 'Check Payment Status',
            icon: SearchCheckIcon,
            href: bookingPaymentStatusHref(booking),
        };
    }

    return null;
}

export default function Page({
    auth,
    bookings,
    favorites,
    activeTab: initialActiveTab,
    selectedBookingNumber: initialSelectedBookingNumber = null,
}: PageProps) {
    const params = new URLSearchParams(window.location.search);
    const [activeTab, setActiveTab] = useState(
        (params.get('tab') as PageProps['activeTab'] | null) ??
            initialActiveTab ??
            'current',
    );
    const selectedBookingNumber =
        initialSelectedBookingNumber ?? params.get('booking_number') ?? null;

    const bookingCount = bookings?.data.length ?? 0;
    const favoriteCount = favorites?.data.length ?? 0;
    const visibleCount =
        activeTab === 'favorites' ? favoriteCount : bookingCount;

    const switchTab = (tab: PageProps['activeTab']) => {
        setActiveTab(tab);
        router.get(
            '/mybookings',
            { tab },
            { preserveState: true, replace: true },
        );
    };

    useEffect(() => {
        if (activeTab !== 'current' || !selectedBookingNumber) {
            return;
        }

        const element = document.getElementById(
            getBookingCardId(selectedBookingNumber),
        );

        if (!element) {
            return;
        }

        const timeout = window.setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (element as HTMLElement).focus({ preventScroll: true });
        }, 50);

        return () => window.clearTimeout(timeout);
    }, [activeTab, selectedBookingNumber, bookings?.data.length]);

    if (!auth.user) {
        return (
            <TenantLayout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
                    <h2 className="text-xl font-semibold">My Bookings</h2>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Please log in or create an account to view your
                        bookings, saved favorites, and travel history.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button asChild>
                            <Link href="/customers/login">Log In</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/customers/register">Register</Link>
                        </Button>
                    </div>
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout>
            <div className="min-h-[calc(100vh-4rem)] bg-linear-to-b from-background via-background to-muted/30">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                                    Travel Desk
                                </p>
                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    My Bookings
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Track saved tours, active bookings, payment
                                    progress, and completed departures in one
                                    place.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                                <SummaryTile
                                    label="Visible items"
                                    value={visibleCount}
                                />
                                <SummaryTextTile
                                    label="Signed in as"
                                    value={auth.user.name}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-wrap justify-center gap-2">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => switchTab(tab.key)}
                                    className={cn(
                                        'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                                        isActive
                                            ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
                                            : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-foreground',
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {activeTab === 'favorites' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {(favorites?.data ?? []).map((tour) => (
                                <FavoriteCard
                                    key={tour.id}
                                    tour={tour}
                                    onViewSchedule={() =>
                                        router.visit(`/tours?tour=${tour.id}`)
                                    }
                                />
                            ))}
                            {(favorites?.data ?? []).length === 0 && (
                                <EmptyState
                                    title="No favorite tours yet"
                                    message="Tours you save from the catalog will appear here."
                                />
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {(bookings?.data ?? []).map((booking) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    activeTab={activeTab}
                                    isHighlighted={
                                        selectedBookingNumber ===
                                        booking.booking_number
                                    }
                                />
                            ))}
                            {(bookings?.data ?? []).length === 0 && (
                                <EmptyState
                                    title={
                                        activeTab === 'history'
                                            ? 'No completed trips yet'
                                            : 'No current bookings yet'
                                    }
                                    message={
                                        activeTab === 'history'
                                            ? 'Full-payment bookings move here after the departure date has passed.'
                                            : 'Your draft, active, payment, and expired bookings will appear here.'
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </TenantLayout>
    );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
    return (
        <div className="grid h-20 min-w-0 grid-rows-[1rem_2rem] content-center justify-items-end gap-1 rounded-xl border bg-background px-4 py-3 text-right sm:min-w-40">
            <p className="text-[11px] font-medium leading-4 text-muted-foreground">
                {label}
            </p>
            <p className="flex h-8 items-center justify-end text-2xl font-bold leading-none text-foreground">
                {value}
            </p>
        </div>
    );
}

function SummaryTextTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid h-20 min-w-0 grid-rows-[1rem_2rem] content-center justify-items-end gap-1 rounded-xl border bg-background px-4 py-3 text-right sm:min-w-40">
            <p className="text-[11px] font-medium leading-4 text-muted-foreground">
                {label}
            </p>
            <p className="flex h-8 max-w-40 items-center justify-end truncate text-sm font-bold leading-5 text-foreground">
                {value}
            </p>
        </div>
    );
}

function FavoriteCard({
    tour,
    onViewSchedule,
}: {
    tour: TourItem;
    onViewSchedule: () => void;
}) {
    const imageMedia = tour.image as any;
    const hasImage = Boolean(imageMedia?.data?.files?.length);
    const image = extractImageSrc(imageMedia).src;

    return (
        <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
                <TourImage
                    image={image}
                    label={tour.name}
                    hasImage={hasImage}
                />
                <div className="flex min-w-0 flex-col justify-between gap-5 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="line-clamp-2 text-base font-bold text-foreground">
                                {tour.name}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {tour.company?.name ??
                                    tour.destination ??
                                    'Saved tour'}
                            </p>
                        </div>
                        <HeartIcon className="size-5 shrink-0 fill-rose-500 text-rose-500" />
                    </div>
                    <div className="flex items-end justify-between gap-3">
                        {tour.showprice !== null &&
                        tour.showprice !== undefined ? (
                            <p className="text-sm font-bold text-primary">
                                {formatIDR(tour.showprice)}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Price on request
                            </p>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 shrink-0 rounded-xl"
                            onClick={onViewSchedule}
                        >
                            View Tour
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BookingCard({
    booking,
    activeTab,
    isHighlighted,
}: {
    booking: BookingItem;
    activeTab: PageProps['activeTab'];
    isHighlighted: boolean;
}) {
    const status = normalizeStatus(booking.status);
    const imageMedia = booking.tour?.image as any;
    const hasImage = Boolean(imageMedia?.data?.files?.length);
    const image = extractImageSrc(imageMedia).src;
    const action = getBookingAction(booking);
    const reviewHref =
        status === 'down payment' || status === 'full payment'
            ? bookingReviewHref(booking, activeTab)
            : null;
    const documentHref =
        booking.needs_travel_documents &&
        (status === 'down payment' || status === 'full payment')
            ? bookingDocumentsHref(booking)
            : null;
    const paymentDeadline = deadlineText(
        'Balance payment',
        booking.payment_deadline,
    );
    const documentDeadline = deadlineText(
        'Travel documents',
        booking.document_deadline,
    );
    const shouldShowDocumentStatus =
        status === 'down payment' || status === 'full payment';
    const documentStatusLabel = shouldShowDocumentStatus
        ? booking.needs_travel_documents
            ? documentDeadline
            : 'Travel documents completed'
        : null;
    const statusClass =
        STATUS_STYLES[status] ??
        'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    const actionCount = [
        action,
        reviewHref,
        documentHref,
        booking.document_url,
    ].filter(Boolean).length;
    const shouldPrimaryActionSpanMobile =
        Boolean(action) && (actionCount === 1 || actionCount === 3);
    const grandTotal = Number(booking.grand_total ?? 0);
    const paidAmount = Number(booking.paid_amount ?? 0);
    const remainingBalance =
        booking.remaining_balance !== null &&
        booking.remaining_balance !== undefined
            ? Number(booking.remaining_balance)
            : Math.max(0, grandTotal - paidAmount);
    const bookingDate = booking.created_at
        ? dayjs(booking.created_at).format('DD MMM YYYY')
        : 'Date pending';
    const metadataItems = [
        {
            caption: 'Tour code',
            label: booking.tour?.code ?? 'Tour code pending',
            valueClassName: 'font-mono font-semibold text-foreground',
            wrap: 'break' as const,
        },
        {
            caption: 'Departure date',
            label: booking.departure_date
                ? dayjs(booking.departure_date).format('dddd, DD MMM YYYY')
                : 'Departure pending',
            wrap: 'normal' as const,
        },
        {
            caption: 'Duration',
            label: booking.tour?.duration_days
                ? `${booking.tour.duration_days} days`
                : 'Trip details',
            wrap: 'normal' as const,
        },
        {
            caption: 'Destination',
            label: booking.tour?.destination ?? 'Destination pending',
            wrap: 'normal' as const,
        },
    ];

    return (
        <article
            id={getBookingCardId(booking.booking_number)}
            tabIndex={isHighlighted ? -1 : undefined}
            className={cn(
                'group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all focus:outline-none hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
                isHighlighted &&
                    'border-primary/50 ring-2 ring-primary/25 shadow-md shadow-primary/10',
            )}
        >
            <div className="grid items-stretch gap-0 md:min-h-[16rem] md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)_320px] 2xl:grid-cols-[300px_minmax(0,1fr)_320px]">
                <TourImage
                    image={image}
                    label={booking.tour?.name ?? 'Tour'}
                    hasImage={hasImage}
                    landscape
                />
                <div className="flex min-w-0 flex-col p-4 sm:p-5 md:justify-center lg:pr-4">
                    <h2 className="line-clamp-2 text-lg font-bold leading-tight text-foreground">
                        {booking.tour?.name ?? 'Tour'}
                    </h2>
                    <div className="mt-2 grid min-w-0 gap-2 text-xs sm:grid-cols-2">
                        <BookingReferenceItem
                            label="Booking number"
                            value={booking.booking_number}
                            valueClassName="break-all font-mono uppercase tracking-[0.12em]"
                        />
                        <BookingReferenceItem
                            label="Booking date"
                            value={bookingDate}
                        />
                    </div>
                    <div className="mt-4 flex min-w-0 flex-wrap items-start gap-2 text-sm text-muted-foreground">
                        {metadataItems.map((item) => (
                            <TripMetadataItem key={item.caption} {...item} />
                        ))}
                    </div>
                </div>
                <div
                    className={cn(
                        'flex h-full min-h-40 flex-col gap-4 border-t p-4 sm:p-5 md:col-start-2 lg:col-auto lg:min-h-44 lg:w-80 lg:min-w-80 lg:border-l lg:border-t-0 lg:text-right',
                    )}
                >
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-start gap-2">
                            <Badge
                                variant="secondary"
                                className={cn('capitalize', statusClass)}
                            >
                                {STATUS_LABELS[status] ?? booking.status}
                            </Badge>
                        </div>
                        <div className="grid gap-2 text-left">
                            <AmountStackItem
                                label="Grand total"
                                value={grandTotal}
                                emphasis
                            />
                            <AmountStackItem
                                label="Remaining balance"
                                value={remainingBalance}
                                valueClassName="text-primary"
                            />
                            <AmountStackItem label="Paid" value={paidAmount} />
                        </div>
                        {(status === 'down payment' ||
                            shouldShowDocumentStatus) && (
                            <div className="grid max-w-full gap-1.5 justify-items-start lg:justify-items-end">
                                {status === 'down payment' &&
                                    paymentDeadline && (
                                        <DeadlineBadge
                                            tone="payment"
                                            label={paymentDeadline}
                                        />
                                    )}
                                {documentStatusLabel && (
                                    <DeadlineBadge
                                        tone={
                                            booking.needs_travel_documents
                                                ? 'document'
                                                : 'complete'
                                        }
                                        label={documentStatusLabel}
                                    />
                                )}
                            </div>
                        )}
                        {booking.booking_window_closed &&
                            booking.action_unavailable_reason && (
                                <div className="grid max-w-full justify-items-start lg:justify-items-end">
                                    <DeadlineBadge
                                        tone="closed"
                                        label={
                                            booking.action_unavailable_reason
                                        }
                                    />
                                </div>
                            )}
                    </div>
                    <div
                        className={cn(
                            'grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end',
                            actionCount === 0 && 'hidden',
                        )}
                    >
                        {action && (
                            <div
                                className={cn(
                                    'min-w-0 sm:flex-none',
                                    shouldPrimaryActionSpanMobile &&
                                        'col-span-2 sm:col-span-1',
                                )}
                            >
                                <BookingActionButton action={action} />
                            </div>
                        )}
                        {reviewHref && (
                            <div className="min-w-0 sm:flex-none">
                                <BookingReviewButton href={reviewHref} />
                            </div>
                        )}
                        {documentHref && (
                            <div className="min-w-0 sm:flex-none">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            asChild
                                            variant="outline"
                                            aria-label="Complete Documents"
                                            className="h-9 w-full min-w-0 gap-1.5 rounded-xl px-2 text-xs sm:w-9 sm:flex-none sm:px-0"
                                        >
                                            <Link href={documentHref}>
                                                <ClipboardCheckIcon className="size-4" />
                                                <span className="truncate font-semibold sm:sr-only">
                                                    Complete Documents
                                                </span>
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Complete missing passport and visa
                                        documents.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                        {booking.document_url && (
                            <div className="min-w-0 sm:flex-none">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            asChild
                                            variant="outline"
                                            aria-label="View trip PDF"
                                            className="h-9 w-full min-w-0 gap-1.5 rounded-xl px-2 text-xs sm:w-9 sm:flex-none sm:px-0"
                                        >
                                            <a
                                                href={booking.document_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <IconPdf size={18} />
                                                <span className="truncate font-semibold sm:sr-only">
                                                    Itinerary
                                                </span>
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        View itinerary and other trip
                                        information.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function BookingActionButton({ action }: { action: BookingAction }) {
    const Icon = action.icon;
    const content = (
        <>
            <Icon className="size-4" />
            <span className="truncate">{action.label}</span>
        </>
    );

    if (action.href) {
        return (
            <Button
                asChild
                className="h-9 w-full min-w-0 gap-1.5 rounded-xl px-3 text-xs sm:min-w-36 sm:flex-none"
            >
                <Link href={action.href}>{content}</Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            className="h-9 w-full min-w-0 gap-1.5 rounded-xl px-3 text-xs sm:min-w-36 sm:flex-none"
            onClick={action.onClick}
        >
            {content}
        </Button>
    );
}

function BookingReviewButton({ href }: { href: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    variant="outline"
                    aria-label="View Booking"
                    className="h-9 w-full min-w-0 gap-1.5 rounded-xl px-2 text-xs sm:w-9 sm:flex-none sm:px-0"
                >
                    <Link href={href}>
                        <EyeIcon className="size-4" />
                        <span className="truncate font-semibold sm:sr-only">
                            View Booking
                        </span>
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent>View booking details.</TooltipContent>
        </Tooltip>
    );
}

function AmountStackItem({
    label,
    value,
    emphasis = false,
    valueClassName,
}: {
    label: string;
    value: number;
    emphasis?: boolean;
    valueClassName?: string;
}) {
    return (
        <div className="flex min-w-0 items-baseline justify-between gap-3">
            <p className="min-w-0 text-[11px] font-medium text-muted-foreground">
                {label}
            </p>
            <p
                className={cn(
                    'shrink-0 text-right font-bold leading-5 text-foreground',
                    emphasis ? 'text-xl leading-6' : 'text-sm',
                    valueClassName,
                )}
            >
                {formatIDR(value)}
            </p>
        </div>
    );
}

function DeadlineBadge({
    label,
    tone,
}: {
    label: string;
    tone: 'payment' | 'document' | 'complete' | 'closed';
}) {
    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-left text-[11px] font-medium leading-4 break-words',
                tone === 'payment' &&
                    'bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900/40',
                tone === 'document' &&
                    'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40',
                tone === 'complete' &&
                    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/40',
                tone === 'closed' &&
                    'bg-slate-50 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-800',
            )}
        >
            {label}
        </span>
    );
}

function BookingReferenceItem({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
            </p>
            <p
                className={cn(
                    'mt-0.5 min-w-0 text-xs font-semibold text-foreground/85',
                    valueClassName,
                )}
            >
                {value}
            </p>
        </div>
    );
}

function TripMetadataItem({
    label,
    caption,
    valueClassName,
    wrap = 'normal',
}: MetadataItem) {
    return (
        <div className="flex w-fit max-w-full min-w-0 flex-col items-start gap-1.5 rounded-xl bg-muted/50 px-3 py-2.5">
            <span className="rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-foreground ring-1 ring-border/70">
                {caption}
            </span>
            <p
                title={label}
                className={cn(
                    'min-w-0 max-w-full text-sm font-semibold leading-5 text-foreground break-words [overflow-wrap:anywhere]',
                    caption === 'Destination' && 'max-w-sm',
                    wrap === 'break' && 'break-all',
                    valueClassName,
                )}
            >
                {label}
            </p>
        </div>
    );
}

function TourImage({
    image,
    label,
    hasImage,
    landscape = false,
}: {
    image?: string;
    label: string;
    hasImage: boolean;
    landscape?: boolean;
}) {
    const frameClassName = landscape
        ? 'h-40 w-full overflow-hidden bg-muted md:h-full md:min-h-40'
        : 'h-36 overflow-hidden bg-muted md:h-full md:min-h-40';

    const placeholderClassName = landscape
        ? 'flex h-40 w-full items-center justify-center overflow-hidden bg-primary/10 px-3 text-center text-2xl font-bold text-primary md:h-full md:min-h-40'
        : 'flex h-36 items-center justify-center overflow-hidden bg-primary/10 px-3 text-center text-2xl font-bold text-primary md:h-full md:min-h-40';

    if (hasImage && image) {
        return (
            <div className={frameClassName}>
                <img
                    src={image}
                    alt={label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>
        );
    }

    return (
        <div className={placeholderClassName}>
            {label.charAt(0).toUpperCase()}
        </div>
    );
}

function EmptyState({ title, message }: { title: string; message: string }) {
    return (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <p className="text-base font-semibold text-foreground">{title}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {message}
            </p>
        </div>
    );
}
