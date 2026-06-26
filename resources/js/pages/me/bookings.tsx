import TenantLayout from '@/components/layouts/tenant-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CustomerWaitingListEditDialog } from '@/components/waiting-list/customer-waiting-list-edit-dialog';
import { formatIDR } from '@/constants/booking';
import { cn, extractImageSrc } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { IconPdf } from '@tabler/icons-react';
import axios from 'axios';
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
    ListOrderedIcon,
    PencilIcon,
    RefreshCwIcon,
    UsersIcon,
    XIcon,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

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

type WaitingListScheduleItem = {
    id: number;
    status: string;
    queue_position: number | null;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    available_seats?: number | null;
    offered_at?: string | null;
    offer_expires_at?: string | null;
    booking_number?: string | null;
    complete_booking_href?: string | null;
    tour_schedule?: {
        id: number;
        departure_date: string;
        return_date: string;
    } | null;
};

type WaitingListItem = {
    id: number;
    status: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    contact_address?: string | null;
    can_edit: boolean;
    can_cancel: boolean;
    created_at?: string | null;
    fulfilled_at?: string | null;
    tour: {
        id: number;
        code?: string | null;
        name: string;
        destination?: string | null;
        image?: unknown;
        company?: {
            id: number;
            username?: string | null;
            name?: string | null;
        };
    } | null;
    vendor: { id: number; name: string } | null;
    schedules: WaitingListScheduleItem[];
};

type Paginated<T> = {
    data: T[];
};

type PageProps = {
    auth: { user: { id: number; name: string } | null };
    bookings: Paginated<BookingItem> | null;
    favorites: Paginated<TourItem> | null;
    waitingLists: Paginated<WaitingListItem> | null;
    activeTab: 'favorites' | 'current' | 'history' | 'waiting_list';
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
    { key: 'waiting_list', label: 'Waiting List', icon: ListOrderedIcon },
    { key: 'history', label: 'History', icon: ClockIcon },
] as const;

const WAITING_LIST_STATUS_STYLES: Record<string, string> = {
    pending:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    contacted: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    offered: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    fulfilled:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    expired:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    queued: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    skipped:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
};

const WAITING_LIST_STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    contacted: 'Contacted',
    offered: 'Seat Offered',
    fulfilled: 'Fulfilled',
    expired: 'Offer Expired',
    cancelled: 'Cancelled',
    queued: 'In Queue',
    skipped: 'Skipped',
};

function formatWaitingListStatus(status: string) {
    const normalized = status.toLowerCase().replaceAll('_', ' ').trim();
    return WAITING_LIST_STATUS_LABELS[normalized] ?? status;
}

function deriveWaitingListCardStatus(waitingList: WaitingListItem): string {
    const scheduleStatuses = waitingList.schedules.map((schedule) =>
        schedule.status.toLowerCase(),
    );

    if (scheduleStatuses.includes('offered')) {
        return 'offered';
    }

    if (
        scheduleStatuses.every((status) => status === 'cancelled') ||
        waitingList.status.toLowerCase() === 'cancelled'
    ) {
        return 'cancelled';
    }

    if (
        scheduleStatuses.includes('fulfilled') ||
        waitingList.status.toLowerCase() === 'fulfilled'
    ) {
        return 'fulfilled';
    }

    if (
        scheduleStatuses.includes('queued') ||
        ['pending', 'contacted'].includes(waitingList.status.toLowerCase())
    ) {
        return 'queued';
    }

    if (scheduleStatuses.includes('expired')) {
        return 'expired';
    }

    return waitingList.status.toLowerCase();
}

function formatWaitingListPax(schedule: WaitingListScheduleItem) {
    const parts = [
        `${schedule.pax_adult} adult${schedule.pax_adult === 1 ? '' : 's'}`,
    ];

    if (schedule.pax_child > 0) {
        parts.push(
            `${schedule.pax_child} child${schedule.pax_child === 1 ? '' : 'ren'}`,
        );
    }

    if (schedule.pax_infant > 0) {
        parts.push(
            `${schedule.pax_infant} infant${schedule.pax_infant === 1 ? '' : 's'}`,
        );
    }

    return parts.join(' · ');
}

function offerCountdownLabel(offerExpiresAt?: string | null) {
    if (!offerExpiresAt) {
        return null;
    }

    const expires = dayjs(offerExpiresAt);
    const now = dayjs();

    if (!expires.isValid()) {
        return null;
    }

    if (expires.isBefore(now)) {
        return null;
    }

    const totalSeconds = expires.diff(now, 'second');
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return `Complete booking within ${formatted}`;
}

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
        return `${label} overdue since ${date}`;
    }

    if (deadline.days_remaining === 0) {
        return `${label} due today (${date})`;
    }

    return `${label} due in ${deadline.days_remaining} day${
        deadline.days_remaining === 1 ? '' : 's'
    } (${date})`;
}

function getBookingAction(
    booking: BookingItem,
    activeTab: PageProps['activeTab'],
): BookingAction | null {
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
        const reviewHref = bookingReviewHref(booking, activeTab);

        if (!reviewHref) {
            return null;
        }

        return {
            label: 'View Detail',
            icon: EyeIcon,
            href: reviewHref,
        };
    }

    return null;
}

export default function Page({
    auth,
    bookings,
    favorites,
    waitingLists,
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

    const [favoriteTours, setFavoriteTours] = useState<TourItem[]>(
        () => favorites?.data ?? [],
    );
    const [pendingUnfavorite, setPendingUnfavorite] = useState<number | null>(
        null,
    );

    useEffect(() => {
        setFavoriteTours(favorites?.data ?? []);
        setPendingUnfavorite(null);
    }, [favorites?.data]);

    const handleUnfavorite = async (tourId: number) => {
        setPendingUnfavorite(tourId);

        const previousTours = favoriteTours;
        setFavoriteTours((current) =>
            current.filter((tour) => tour.id !== tourId),
        );

        try {
            await axios.post(`/me/tours/${tourId}/like`);
        } catch {
            setFavoriteTours(previousTours);
            toast.error('Could not remove this tour from your favorites.');
        } finally {
            setPendingUnfavorite((current) =>
                current === tourId ? null : current,
            );
        }
    };

    const bookingCount = bookings?.data.length ?? 0;
    const waitingListCount = waitingLists?.data.length ?? 0;
    const favoriteCount = favoriteTours.length;
    const visibleCount =
        activeTab === 'favorites'
            ? favoriteCount
            : activeTab === 'waiting_list'
              ? waitingListCount
              : bookingCount;

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
                            {favoriteTours.map((tour) => (
                                <FavoriteCard
                                    key={tour.id}
                                    tour={tour}
                                    isPending={pendingUnfavorite === tour.id}
                                    onViewSchedule={() =>
                                        router.visit(`/tours?tour=${tour.id}`)
                                    }
                                    onUnfavorite={() =>
                                        handleUnfavorite(tour.id)
                                    }
                                />
                            ))}
                            {favoriteTours.length === 0 && (
                                <EmptyState
                                    title="No favorite tours yet"
                                    message="Tours you save from the catalog will appear here."
                                />
                            )}
                        </div>
                    ) : activeTab === 'waiting_list' ? (
                        <div className="mx-auto grid w-full max-w-3xl gap-3">
                            {(waitingLists?.data ?? []).map((waitingList) => (
                                <WaitingListCard
                                    key={waitingList.id}
                                    waitingList={waitingList}
                                />
                            ))}
                            {(waitingLists?.data ?? []).length === 0 && (
                                <EmptyState
                                    title="No waiting list requests yet"
                                    message="When you join a tour waiting list, your queue status and seat offers will appear here."
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
    isPending,
    onViewSchedule,
    onUnfavorite,
}: {
    tour: TourItem;
    isPending: boolean;
    onViewSchedule: () => void;
    onUnfavorite: () => void;
}) {
    const imageMedia = tour.image as any;
    const hasImage = Boolean(imageMedia?.data?.files?.length);
    const { src, srcSet } = extractImageSrc(imageMedia);

    return (
        <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
                <TourImage
                    src={src}
                    srcSet={srcSet}
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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={onUnfavorite}
                                    disabled={isPending}
                                    aria-label="Remove from favorites"
                                    data-test="favorite-remove"
                                    data-tour-id={tour.id}
                                    className={cn(
                                        'inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-500 transition-all hover:scale-105 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:hover:bg-rose-950/50',
                                    )}
                                >
                                    {isPending ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <HeartIcon className="size-5 fill-rose-500 text-rose-500" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Remove from favorites</p>
                            </TooltipContent>
                        </Tooltip>
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
    const { src, srcSet } = extractImageSrc(imageMedia);
    const action = getBookingAction(booking, activeTab);
    const paidProgressStatuses = [
        'waiting payment approval',
        'down payment',
        'full payment',
    ];
    const reviewHref =
        status === 'down payment' || status === 'full payment'
            ? bookingReviewHref(booking, activeTab)
            : null;
    const documentHref =
        booking.needs_travel_documents && paidProgressStatuses.includes(status)
            ? bookingDocumentsHref(booking)
            : null;
    const shouldShowProformaButton = status === 'down payment';
    const paymentDeadline = deadlineText('Payment', booking.payment_deadline);
    const documentDeadline = deadlineText(
        'Documents',
        booking.document_deadline,
    );
    const shouldShowPaymentDeadline =
        status === 'waiting payment approval' || status === 'down payment';
    const shouldShowDocumentStatus = paidProgressStatuses.includes(status);
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
        shouldShowProformaButton,
    ].filter(Boolean).length;
    const secondaryActionCount = [
        reviewHref,
        documentHref,
        booking.document_url,
        shouldShowProformaButton,
    ].filter(Boolean).length;
    const shouldStackPrimaryLastOnMobile = Boolean(action) && actionCount >= 3;
    const actionGridClassName =
        actionCount === 2 && !shouldStackPrimaryLastOnMobile
            ? 'grid-cols-2'
            : 'grid-cols-1';
    const secondaryActionGridClassName =
        secondaryActionCount === 3
            ? 'grid-cols-3'
            : secondaryActionCount >= 2
              ? 'grid-cols-2'
              : 'grid-cols-1';
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
                    src={src}
                    srcSet={srcSet}
                    label={booking.tour?.name ?? 'Tour'}
                    hasImage={hasImage}
                    landscape
                />
                <div className="flex min-w-0 flex-col overflow-hidden p-4 sm:p-5 md:justify-center lg:pr-4">
                    <h2 className="line-clamp-2 min-w-0 text-lg font-bold leading-tight text-foreground break-words [overflow-wrap:anywhere]">
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
                <div className="flex h-full min-h-40 min-w-0 flex-col gap-4 overflow-hidden border-t p-4 sm:p-5 md:col-start-2 lg:col-auto lg:min-h-44 lg:w-80 lg:min-w-80 lg:border-l lg:border-t-0 lg:text-right">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-start gap-2">
                            <Badge
                                variant="secondary"
                                className={cn('capitalize', statusClass)}
                            >
                                {STATUS_LABELS[status] ?? booking.status}
                            </Badge>
                            {booking.booking_window_closed &&
                                booking.action_unavailable_reason && (
                                    <DeadlineBadge
                                        tone="closed"
                                        label={
                                            booking.action_unavailable_reason
                                        }
                                    />
                                )}
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
                        {(shouldShowPaymentDeadline ||
                            shouldShowDocumentStatus) && (
                            <div className="grid max-w-full gap-1.5 justify-items-start lg:justify-items-end">
                                {shouldShowPaymentDeadline &&
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
                    </div>
                    <div
                        className={cn(
                            'grid min-w-0 gap-2 sm:flex sm:flex-nowrap sm:justify-end sm:gap-1.5 sm:pb-1',
                            actionGridClassName,
                            actionCount === 0 && 'hidden',
                        )}
                    >
                        {shouldStackPrimaryLastOnMobile ? (
                            <>
                                <div
                                    className={cn(
                                        'order-1 grid min-w-0 gap-2 sm:order-2 sm:flex sm:gap-1.5',
                                        secondaryActionGridClassName,
                                    )}
                                >
                                    <BookingSecondaryActions
                                        booking={booking}
                                        reviewHref={reviewHref}
                                        documentHref={documentHref}
                                        shouldShowProformaButton={
                                            shouldShowProformaButton
                                        }
                                    />
                                </div>
                                {action && (
                                    <div className="order-2 min-w-0 sm:order-1">
                                        <BookingActionButton action={action} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {action && (
                                    <BookingActionButton action={action} />
                                )}
                                <BookingSecondaryActions
                                    booking={booking}
                                    reviewHref={reviewHref}
                                    documentHref={documentHref}
                                    shouldShowProformaButton={
                                        shouldShowProformaButton
                                    }
                                />
                            </>
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
            <Icon className="hidden size-4 sm:block" />
            <span className="min-w-0 truncate">{action.label}</span>
        </>
    );

    if (action.href) {
        return (
            <Button
                asChild
                className="h-9 w-full min-w-0 gap-1.5 rounded-lg px-2.5 text-[11px] sm:h-8 sm:w-auto sm:min-w-28 sm:flex-none"
            >
                <Link href={action.href}>{content}</Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            className="h-9 w-full min-w-0 gap-1.5 rounded-lg px-2.5 text-[11px] sm:h-8 sm:w-auto sm:min-w-28 sm:flex-none"
            onClick={action.onClick}
        >
            {content}
        </Button>
    );
}

function BookingSecondaryActions({
    booking,
    reviewHref,
    documentHref,
    shouldShowProformaButton,
}: {
    booking: BookingItem;
    reviewHref: string | null;
    documentHref: string | null;
    shouldShowProformaButton: boolean;
}) {
    return (
        <>
            {reviewHref && <BookingReviewButton href={reviewHref} />}
            {documentHref && (
                <BookingSecondaryLinkButton
                    href={documentHref}
                    label="Documents"
                    ariaLabel="Complete Documents"
                    tooltip="Complete missing passport and visa documents"
                    icon={
                        <ClipboardCheckIcon className="hidden size-4 sm:block" />
                    }
                />
            )}
            {booking.document_url && (
                <BookingSecondaryLinkButton
                    href={booking.document_url}
                    label="Itinerary"
                    ariaLabel="View trip PDF"
                    tooltip="View itinerary and other trip information"
                    external
                    icon={<IconPdf className="hidden size-4 sm:block" />}
                />
            )}
            {shouldShowProformaButton && (
                <BookingSecondaryButton
                    label="Proforma Invoice"
                    ariaLabel="Print Proforma Invoice"
                    tooltip="Print Proforma Invoice"
                    icon={<FileTextIcon className="hidden size-4 sm:block" />}
                    onClick={() =>
                        window.open(
                            `/mybookings/${booking.id}/invoice`,
                            '_blank',
                            'noopener,noreferrer',
                        )
                    }
                />
            )}
        </>
    );
}

function BookingSecondaryLinkButton({
    href,
    label,
    ariaLabel,
    tooltip,
    icon,
    external = false,
}: {
    href: string;
    label: string;
    ariaLabel: string;
    tooltip: string;
    icon: ReactNode;
    external?: boolean;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    variant="outline"
                    aria-label={ariaLabel}
                    className="h-9 w-full min-w-0 gap-1.5 rounded-lg px-2 text-[11px] sm:h-8 sm:w-8 sm:flex-none sm:px-0"
                >
                    {external ? (
                        <a href={href} target="_blank" rel="noreferrer">
                            {icon}
                            <span className="min-w-0 truncate font-semibold sm:sr-only">
                                {label}
                            </span>
                        </a>
                    ) : (
                        <Link href={href}>
                            {icon}
                            <span className="min-w-0 truncate font-semibold sm:sr-only">
                                {label}
                            </span>
                        </Link>
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

function BookingSecondaryButton({
    label,
    ariaLabel,
    tooltip,
    icon,
    onClick,
}: {
    label: string;
    ariaLabel: string;
    tooltip: string;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex w-full min-w-0 sm:w-auto">
                    <Button
                        type="button"
                        variant="outline"
                        aria-label={ariaLabel}
                        onClick={onClick}
                        className="h-9 w-full min-w-0 gap-1.5 rounded-lg px-2 text-[11px] sm:h-8 sm:w-8 sm:flex-none sm:px-0"
                    >
                        {icon}
                        <span className="min-w-0 truncate font-semibold sm:sr-only">
                            {label}
                        </span>
                    </Button>
                </span>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

function BookingReviewButton({ href }: { href: string }) {
    return (
        <BookingSecondaryLinkButton
            href={href}
            label="View Booking Detail"
            ariaLabel="View Booking Detail"
            tooltip="View booking detail"
            icon={<EyeIcon className="hidden size-4 sm:block" />}
        />
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
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="min-w-0 shrink-0 text-[11px] font-medium text-muted-foreground">
                {label}
            </p>
            <p
                className={cn(
                    'min-w-0 flex-1 text-right font-bold leading-5 text-foreground break-words [overflow-wrap:anywhere]',
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
                'inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-left text-[11px] font-medium leading-4 break-words [overflow-wrap:anywhere]',
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
                    'mt-0.5 min-w-0 text-xs font-semibold text-foreground/85 break-words [overflow-wrap:anywhere]',
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
        <div className="flex w-full max-w-full min-w-0 flex-col items-start gap-1.5 rounded-xl bg-muted/50 px-3 py-2.5 sm:w-fit">
            <span className="rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-foreground ring-1 ring-border/70">
                {caption}
            </span>
            <p
                title={label}
                className={cn(
                    'min-w-0 max-w-full text-sm font-semibold leading-5 text-foreground break-words [overflow-wrap:anywhere]',
                    caption === 'Destination' && 'sm:max-w-sm',
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
    src,
    srcSet,
    label,
    hasImage,
    landscape = false,
}: {
    src?: string;
    srcSet?: string;
    label: string;
    hasImage: boolean;
    landscape?: boolean;
}) {
    const frameClassName = landscape
        ? 'h-40 w-full overflow-hidden bg-muted md:h-full md:min-h-40'
        : 'h-36 w-full overflow-hidden bg-muted md:h-full md:min-h-40';

    const placeholderClassName = landscape
        ? 'flex h-40 w-full items-center justify-center overflow-hidden bg-primary/10 px-3 text-center text-2xl font-bold text-primary md:h-full md:min-h-40'
        : 'flex h-36 w-full items-center justify-center overflow-hidden bg-primary/10 px-3 text-center text-2xl font-bold text-primary md:h-full md:min-h-40';

    if (hasImage && src) {
        return (
            <div className={frameClassName}>
                <img
                    src={src}
                    srcSet={srcSet || undefined}
                    sizes="(max-width: 767px) 100vw, 160px"
                    alt={label}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
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

function WaitingListCard({ waitingList }: { waitingList: WaitingListItem }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const imageMedia = waitingList.tour?.image as any;
    const hasImage = Boolean(imageMedia?.data?.files?.length);
    const { src, srcSet } = extractImageSrc(imageMedia);
    const cardStatus = deriveWaitingListCardStatus(waitingList);
    const showManageActions = waitingList.can_edit || waitingList.can_cancel;
    const firstQueuedScheduleIndex = waitingList.schedules.findIndex(
        (schedule) => schedule.status.toLowerCase() === 'queued',
    );

    const handleCancel = () => {
        if (
            !window.confirm(
                'Cancel this waiting list request? This cannot be undone.',
            )
        ) {
            return;
        }

        setIsCancelling(true);
        router.patch(
            `/waiting-lists/${waitingList.id}/cancel`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsCancelling(false),
            },
        );
    };

    return (
        <>
            <article
                className={cn(
                    'group overflow-hidden rounded-2xl border bg-card shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-primary/30 hover:shadow-md',
                    cardStatus === 'offered' &&
                        'border-amber-200/90 dark:border-amber-900/50',
                    cardStatus === 'queued' &&
                        'border-violet-200/60 dark:border-violet-900/40',
                    cardStatus === 'cancelled' && 'opacity-75',
                )}
            >
                <div className="grid gap-0 md:grid-cols-[160px_minmax(0,1fr)]">
                    <TourImage
                        src={src}
                        srcSet={srcSet}
                        label={waitingList.tour?.name ?? 'Tour'}
                        hasImage={hasImage}
                        landscape
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="line-clamp-2 text-balance text-base font-bold text-foreground">
                                    {waitingList.tour?.name ??
                                        'Tour waiting list'}
                                </h2>
                                {waitingList.tour?.destination ? (
                                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                        {waitingList.tour.destination}
                                    </p>
                                ) : null}
                            </div>
                            <div className="mr-3.5 inline-block text-right">
                                <Badge
                                    className={cn(
                                        'text-[11px] capitalize',
                                        WAITING_LIST_STATUS_STYLES[
                                            cardStatus
                                        ] ?? 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {formatWaitingListStatus(cardStatus)}
                                </Badge>
                                {waitingList.schedules.length === 1 ? (
                                    <p className="mt-1 pr-2 text-[11px] leading-none text-muted-foreground">
                                        <UsersIcon className="mr-1 inline size-3 shrink-0 align-[-2px] text-primary/70" />
                                        {formatWaitingListPax(
                                            waitingList.schedules[0],
                                        )}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="divide-y overflow-hidden rounded-xl border bg-muted/20">
                            {waitingList.schedules.map((schedule, index) => {
                                const scheduleStatus =
                                    schedule.status.toLowerCase();
                                const countdown =
                                    scheduleStatus === 'offered'
                                        ? offerCountdownLabel(
                                              schedule.offer_expires_at,
                                          )
                                        : null;
                                const departureDate = schedule.tour_schedule
                                    ?.departure_date
                                    ? dayjs(
                                          schedule.tour_schedule.departure_date,
                                      ).format('DD MMM YYYY')
                                    : null;
                                const isOffered = scheduleStatus === 'offered';
                                const showRowActions =
                                    showManageActions &&
                                    index === firstQueuedScheduleIndex;

                                return (
                                    <div
                                        key={schedule.id}
                                        className={cn(
                                            'px-3.5 py-3',
                                            isOffered &&
                                                'bg-amber-50/70 dark:bg-amber-950/25',
                                        )}
                                    >
                                        {waitingList.schedules.length > 1 ? (
                                            <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <UsersIcon className="size-3.5 shrink-0 text-primary/70" />
                                                {formatWaitingListPax(schedule)}
                                            </p>
                                        ) : null}
                                        <div>
                                            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                                Departure date
                                            </p>
                                            <div className="mt-0.5 flex items-center justify-between gap-2">
                                                <p className="min-w-0 text-sm font-semibold text-foreground tabular-nums">
                                                    {departureDate ?? '—'}
                                                </p>

                                                {(schedule.complete_booking_href ||
                                                    showRowActions) && (
                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        {schedule.complete_booking_href ? (
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                className="h-8 rounded-lg px-3 text-xs"
                                                            >
                                                                <Link
                                                                    href={
                                                                        schedule.complete_booking_href
                                                                    }
                                                                >
                                                                    Complete
                                                                    Booking
                                                                </Link>
                                                            </Button>
                                                        ) : null}

                                                        {showRowActions ? (
                                                            <>
                                                                {waitingList.can_edit ? (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 gap-1 rounded-lg px-2.5 text-xs sm:px-3"
                                                                        onClick={() =>
                                                                            setIsEditOpen(
                                                                                true,
                                                                            )
                                                                        }
                                                                    >
                                                                        <PencilIcon className="size-3.5" />
                                                                        <span className="hidden min-[380px]:inline">
                                                                            Edit
                                                                        </span>
                                                                    </Button>
                                                                ) : null}
                                                                {waitingList.can_cancel ? (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 gap-1 rounded-lg px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive sm:px-3"
                                                                        onClick={
                                                                            handleCancel
                                                                        }
                                                                        disabled={
                                                                            isCancelling
                                                                        }
                                                                    >
                                                                        {isCancelling ? (
                                                                            <Spinner className="size-3.5" />
                                                                        ) : (
                                                                            <XIcon className="size-3.5" />
                                                                        )}
                                                                        <span className="hidden min-[380px]:inline">
                                                                            Cancel
                                                                        </span>
                                                                    </Button>
                                                                ) : null}
                                                            </>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {countdown ? (
                                            <p className="mt-1.5 text-xs font-medium text-amber-700 tabular-nums dark:text-amber-300">
                                                {countdown}
                                            </p>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </article>

            <CustomerWaitingListEditDialog
                waitingList={waitingList}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />
        </>
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
