import type { TourResource } from '@/api/model';
import TourWaitingListDialog, {
    type WaitingListScheduleOption,
} from '@/components/tours/tour-waiting-list-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    addDays,
    format,
    isBefore,
    isSameMonth,
    isSameYear,
    max,
    min,
    parseISO,
    startOfToday,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarIcon, ListPlusIcon } from 'lucide-react';
import { useState } from 'react';

export type TourSchedule = {
    id: number;
    tour_id: number;
    departure_date: string;
    return_date: string | null;
    quota: number;
    price: number | string | null;
    agent_price: number | string | null;
    cutoff_date: string;
    is_active: boolean;
    note: string | null;
    booking_deadline_days?: number;
    availability?: {
        available: number | string;
        max_pax: number | string;
    };
    prices?: Array<{
        price?: number | string | null;
        promotion?: number | string | null;
        promotion_rate?: number | string | null;
        price_category?: {
            name?: string | null;
        } | null;
        priceCategory?: {
            name?: string | null;
        } | null;
    }>;
};

type BookableTour = TourResource & {
    schedules?: TourSchedule[];
    showprice?: number | string | null;
};

type TourBookingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    tour: BookableTour;
    onRequireLogin?: () => void;
    bookingUrlResolver?: (tour: TourResource, schedule: TourSchedule) => string;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const getAvailabilityInfo = (quota: number) => {
    if (quota <= 0) {
        return { label: 'Availability: 0', variant: 'destructive' as const };
    }
    return { label: `Availability: ${quota}`, variant: 'secondary' as const };
};

const getDashboardCompanyUsernameFromPath = (pathname: string) => {
    const match = pathname.match(/^\/companies\/([^/]+)\/dashboard(?:\/|$)/);

    return match?.[1] ? decodeURIComponent(match[1]) : null;
};

const positiveNumberOrNull = (value: unknown) => {
    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getDiscountedPrice = (
    price: NonNullable<TourSchedule['prices']>[number],
) => {
    const basePrice = positiveNumberOrNull(price.price);

    if (basePrice === null) {
        return null;
    }

    const promotionRate = positiveNumberOrNull(price.promotion_rate);
    const promotion = positiveNumberOrNull(price.promotion);

    if (promotionRate !== null) {
        return Math.max(
            0,
            Math.round(basePrice - (basePrice * promotionRate) / 100),
        );
    }

    if (promotion !== null) {
        return Math.max(0, Math.round(basePrice - promotion));
    }

    return basePrice;
};

const DISPLAY_PRICE_CATEGORY_PRIORITY = [
    'adult double',
    'adult twin',
    'adult extra bed',
    'adult single',
] as const;

const normalizeCategoryName = (value: unknown) =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const getScheduleDisplayPrice = (
    schedule: TourSchedule,
    masterPrice: unknown,
) => {
    const prices = Array.isArray(schedule.prices) ? schedule.prices : [];

    for (const categoryName of DISPLAY_PRICE_CATEGORY_PRIORITY) {
        const matchingPrice = prices.find((price) => {
            const priceCategory =
                price.price_category ?? price.priceCategory ?? null;

            return normalizeCategoryName(priceCategory?.name) === categoryName;
        });
        const discountedPrice = matchingPrice
            ? getDiscountedPrice(matchingPrice)
            : null;

        if (discountedPrice !== null && discountedPrice > 0) {
            return discountedPrice;
        }
    }

    return (
        positiveNumberOrNull(masterPrice) ??
        positiveNumberOrNull(schedule.price) ??
        0
    );
};

const bookingUrlFor = (path: string, departureDate: string) =>
    `${path}?date=${encodeURIComponent(departureDate)}`;

export default function TourBookingModal({
    isOpen,
    onClose,
    tour,
    onRequireLogin,
    bookingUrlResolver,
}: TourBookingModalProps) {
    const { company } = usePageSharedDataProps();
    const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);
    const schedules = tour.schedules ?? [];
    const tourImage = extractImageSrc(tour.image as any);
    const isDashboardRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.includes('/dashboard');
    const activeSchedules = schedules
        .filter((s) => {
            if (!s.is_active) return false;
            const departDate = parseISO(s.departure_date);
            const deadlineDate = addDays(
                startOfToday(),
                s.booking_deadline_days ?? 0,
            );
            return !isBefore(departDate, deadlineDate);
        })
        .sort(
            (a, b) =>
                parseISO(a.departure_date).getTime() -
                parseISO(b.departure_date).getTime(),
        );

    let dateRangeText = 'Schedules TBA';
    if (activeSchedules.length > 0) {
        const dates = activeSchedules.map((s) => parseISO(s.departure_date));
        const earliest = min(dates);
        const latest = max(dates);

        if (isSameMonth(earliest, latest) && isSameYear(earliest, latest)) {
            dateRangeText = format(earliest, 'MMM yyyy');
        } else if (isSameYear(earliest, latest)) {
            dateRangeText = `${format(earliest, 'MMM')} - ${format(latest, 'MMM yyyy')}`;
        } else {
            dateRangeText = `${format(earliest, 'MMM yyyy')} - ${format(latest, 'MMM yyyy')}`;
        }
    }

    const waitingListSchedules: WaitingListScheduleOption[] =
        activeSchedules.map((schedule) => {
            const departureDate = parseISO(schedule.departure_date);
            const returnDate = schedule.return_date
                ? parseISO(schedule.return_date)
                : addDays(departureDate, Math.max(0, tour.duration_days - 1));

            return {
                id: schedule.id,
                departureDate: schedule.departure_date,
                returnDate: format(returnDate, 'yyyy-MM-dd'),
                available: schedule.availability
                    ? Number(schedule.availability.available)
                    : Number(schedule.quota),
                displayPrice: getScheduleDisplayPrice(schedule, tour.showprice),
            };
        });

    const openWaitingList = () => {
        if (onRequireLogin) {
            onClose();
            onRequireLogin();
            return;
        }

        setIsWaitingListOpen(true);
    };

    const closeWaitingList = () => {
        setIsWaitingListOpen(false);
        onClose();
    };

    const handleSelectDate = (schedule: TourSchedule) => {
        const availableCount = schedule.availability
            ? Number(schedule.availability.available)
            : schedule.quota;
        if (availableCount <= 0) return;

        if (onRequireLogin) {
            onClose();
            onRequireLogin();
            return;
        }

        onClose();
        const dashboardCompanyUsername =
            company?.username ??
            (typeof window !== 'undefined'
                ? getDashboardCompanyUsernameFromPath(window.location.pathname)
                : null);
        const fallbackUrl =
            isDashboardRoute && dashboardCompanyUsername
                ? bookingUrlFor(
                      `/companies/${encodeURIComponent(dashboardCompanyUsername)}/dashboard/bookings/create/${tour.id}`,
                      schedule.departure_date,
                  )
                : bookingUrlFor(
                      `/bookings/${tour.id}/create`,
                      schedule.departure_date,
                  );

        router.visit(
            bookingUrlResolver
                ? bookingUrlResolver(tour, schedule)
                : fallbackUrl,
        );
    };

    return (
        <>
            <Dialog
                open={isOpen && !isWaitingListOpen}
                onOpenChange={(open) => !open && onClose()}
            >
                <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl md:max-w-4xl">
                    {/* Header Section — stacked on mobile, image left on desktop */}
                    <div className="relative shrink-0 border-b bg-card px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
                        <DialogHeader className="space-y-0 text-left">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5 md:gap-6">
                                <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl border bg-muted sm:w-[clamp(18rem,56%,26rem)] md:w-[clamp(22rem,58%,28rem)]">
                                    <img
                                        src={tourImage.src}
                                        srcSet={tourImage.srcSet || undefined}
                                        alt={tour.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col justify-start gap-1.5 sm:gap-2">
                                    <DialogTitle className="line-clamp-2 text-left text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
                                        {tour.name}
                                    </DialogTitle>
                                    {tour.code && (
                                        <DialogDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            {tour.code}
                                        </DialogDescription>
                                    )}
                                    {tour.destination && (
                                        <DialogDescription className="text-sm font-bold uppercase tracking-widest text-foreground">
                                            {tour.destination}
                                        </DialogDescription>
                                    )}
                                    <DialogDescription className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-widest text-muted-foreground/80">
                                        <CalendarIcon className="size-4 shrink-0" />
                                        <span>{dateRangeText}</span>
                                    </DialogDescription>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 w-full gap-2 self-start sm:mt-auto sm:w-auto"
                                        onClick={openWaitingList}
                                        disabled={
                                            waitingListSchedules.length === 0
                                        }
                                    >
                                        <ListPlusIcon className="size-4 shrink-0" />
                                        Join Waiting List
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Schedule List Section */}
                    <div className="max-h-[min(55vh,24rem)] overflow-y-auto bg-muted/5 px-4 py-4 sm:px-6">
                        <div className="mb-3 text-center">
                            <span className="text-sm font-medium tracking-wide text-foreground/70">
                                Select Departure Date
                            </span>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeSchedules.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-8 text-center"
                                >
                                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border">
                                        <CalendarIcon className="size-7 text-muted-foreground" />
                                    </div>
                                    <p className="text-base font-semibold text-foreground">
                                        Departure schedule not available
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col gap-2.5 pb-3">
                                    {activeSchedules.map((schedule, index) => {
                                        const departDate = parseISO(
                                            schedule.departure_date,
                                        );
                                        const returnDate = schedule.return_date
                                            ? parseISO(schedule.return_date)
                                            : addDays(
                                                  departDate,
                                                  Math.max(
                                                      0,
                                                      tour.duration_days - 1,
                                                  ),
                                              );

                                        const dateRangeDisplay = `${format(departDate, 'dd MMM yyyy')} - ${format(returnDate, 'dd MMM yyyy')}`;
                                        const availableCount =
                                            schedule.availability
                                                ? Number(
                                                      schedule.availability
                                                          .available,
                                                  )
                                                : schedule.quota;
                                        const availability =
                                            getAvailabilityInfo(availableCount);
                                        const isSoldOut = availableCount <= 0;
                                        const displayPrice =
                                            getScheduleDisplayPrice(
                                                schedule,
                                                tour.showprice,
                                            );

                                        return (
                                            <motion.button
                                                key={schedule.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.35,
                                                    delay: index * 0.05,
                                                    ease: [
                                                        0.25, 0.46, 0.45, 0.94,
                                                    ],
                                                }}
                                                type="button"
                                                disabled={isSoldOut}
                                                onClick={() =>
                                                    handleSelectDate(schedule)
                                                }
                                                className={`group relative grid min-h-[4rem] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 text-left transition-all duration-300 sm:min-h-[4.25rem] sm:px-4 sm:py-3 ${
                                                    isSoldOut
                                                        ? 'cursor-not-allowed border-muted bg-muted/40 opacity-50 grayscale'
                                                        : 'cursor-pointer border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md hover:shadow-primary/5 active:scale-[0.99]'
                                                }`}
                                            >
                                                <div className="min-w-0 pr-2 font-semibold leading-snug tracking-tight text-foreground">
                                                    <span className="block text-[15px] sm:text-base">
                                                        {dateRangeDisplay}
                                                    </span>
                                                </div>

                                                <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:min-w-[15rem] sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                                                    <span className="whitespace-nowrap text-sm font-bold text-primary sm:text-base md:text-lg">
                                                        {formatCurrency(
                                                            displayPrice,
                                                        )}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            availability.variant
                                                        }
                                                        className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:px-3 sm:text-xs ${
                                                            isSoldOut
                                                                ? 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/20'
                                                                : ''
                                                        }`}
                                                    >
                                                        {availability.label}
                                                    </Badge>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>
            <TourWaitingListDialog
                isOpen={isOpen && isWaitingListOpen}
                onClose={closeWaitingList}
                tour={tour}
                schedules={waitingListSchedules}
            />
        </>
    );
}
