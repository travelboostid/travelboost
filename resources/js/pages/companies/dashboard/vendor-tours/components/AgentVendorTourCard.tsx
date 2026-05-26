import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconPdf } from '@tabler/icons-react';
import {
    CalendarDaysIcon,
    CircleDollarSignIcon,
    ClockIcon,
    InfoIcon,
    MapPinIcon,
    MessageSquareIcon,
    SaveIcon,
    UsersRoundIcon,
} from 'lucide-react';
import { useState } from 'react';
import BaseTourCard from './BaseTourCard';

const formatCurrency = (value: any, currency = 'IDR') =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDate = (value: any) => {
    if (!value) return '-';

    return new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    return result;
};

const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getPriceCategoryName = (price: any) =>
    price.price_category?.name ||
    price.priceCategory?.name ||
    price.category?.name ||
    price.room_type?.name ||
    (price.price_category_id
        ? `Category #${price.price_category_id}`
        : 'Category');

const toNumber = (value: any) => {
    const numericValue = Number(value || 0);

    return Number.isFinite(numericValue) ? numericValue : 0;
};

const getPromotionalPrice = (price: any) => {
    const basePrice = toNumber(price.price);
    const promotionConfig =
        typeof price.promotion === 'object' && price.promotion !== null
            ? price.promotion
            : null;
    const promotionRate = toNumber(
        price.promotion_rate ??
            price.promotionRate ??
            price.discount_rate ??
            price.discountRate ??
            (promotionConfig?.type === 'percent' ? promotionConfig.value : 0),
    );
    const promotionAmount = toNumber(
        (promotionConfig && promotionConfig.type !== 'percent'
            ? promotionConfig.value
            : price.promotion) ??
            price.promotion_amount ??
            price.promotionAmount ??
            price.discount ??
            price.discount_amount ??
            price.discountAmount,
    );

    if (promotionRate > 0) {
        return Math.max(0, basePrice - (basePrice * promotionRate) / 100);
    }

    if (promotionAmount > 0) {
        return Math.max(0, basePrice - promotionAmount);
    }

    return basePrice;
};

const getPromotionLabel = (price: any, currency = 'IDR') => {
    const basePrice = toNumber(price.price);
    const promotionalPrice = getPromotionalPrice(price);
    const promotionAmount = Math.max(0, basePrice - promotionalPrice);

    if (promotionAmount <= 0) {
        return null;
    }

    const promotionConfig =
        typeof price.promotion === 'object' && price.promotion !== null
            ? price.promotion
            : null;
    const promotionRate = toNumber(
        price.promotion_rate ??
            price.promotionRate ??
            price.discount_rate ??
            price.discountRate ??
            (promotionConfig?.type === 'percent' ? promotionConfig.value : 0),
    );

    if (promotionRate > 0) {
        return `${formatCurrency(promotionAmount, currency)} (${promotionRate}%)`;
    }

    return formatCurrency(promotionAmount, currency);
};

const getCommissionLabel = (price: any, currency = 'IDR') => {
    const commissionConfig =
        typeof price.commission === 'object' && price.commission !== null
            ? price.commission
            : null;
    const commissionRate = toNumber(
        price.commission_rate ??
            price.commissionRate ??
            (commissionConfig?.type === 'percent' ? commissionConfig.value : 0),
    );
    const commissionAmount = toNumber(
        (commissionConfig && commissionConfig.type !== 'percent'
            ? commissionConfig.value
            : price.commission) ??
            price.commission_amount ??
            price.commissionAmount,
    );

    if (commissionRate > 0) {
        const commissionValue =
            (getPromotionalPrice(price) * commissionRate) / 100;

        return `${formatCurrency(commissionValue, currency)} (${commissionRate}%)`;
    }

    if (commissionAmount > 0) {
        return formatCurrency(commissionAmount, currency);
    }

    return '-';
};

export default function AgentVendorTourCard({
    tour,
    isVendorNameVisible,
    canCopy,
    hasCopied,
    onCopy,
    onViewBrochure,
    onChat,
    startingChat,
}: any) {
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const isVendorInactive = String(tour.status).toLowerCase() !== 'active';
    const bookingDeadlineDays = Number(
        tour.company?.company_setting?.booking_deadline ??
            tour.company?.companySetting?.booking_deadline ??
            0,
    );
    const cutoffDate = toDateString(addDays(new Date(), bookingDeadlineDays));
    const schedules = Array.isArray(tour.schedules)
        ? tour.schedules.filter(
              (schedule: any) =>
                  schedule.departure_date &&
                  schedule.departure_date >= cutoffDate,
          )
        : [];
    const currency = tour.currency || 'IDR';
    const totalAvailability = schedules.reduce(
        (total: number, schedule: any) =>
            total + Number(schedule.availability?.available || 0),
        0,
    );
    const totalMaxPax = schedules.reduce(
        (total: number, schedule: any) =>
            total + Number(schedule.availability?.max_pax || 0),
        0,
    );

    return (
        <>
            <BaseTourCard
                tour={tour}
                isVendorNameVisible={isVendorNameVisible}
                isVendorInactive={isVendorInactive}
                statusSection={
                    <div className="mx-4 mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/60">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                Vendor Tour Status
                            </span>
                            <span
                                className={`text-[9px] font-black uppercase ${tour.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}
                            >
                                {tour.status}
                            </span>
                        </div>
                    </div>
                }
                footerSection={
                    <>
                        <AlertDialog>
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <div className="flex-1 flex">
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className={`w-full rounded-xl h-9 shadow-sm transition-all ${isVendorInactive ? 'bg-red-500 text-white hover:bg-red-600' : hasCopied ? 'bg-primary text-primary-foreground opacity-40 grayscale' : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'}`}
                                                disabled={
                                                    hasCopied ||
                                                    isVendorInactive ||
                                                    !canCopy
                                                }
                                            >
                                                <SaveIcon size={18} />
                                            </Button>
                                        </AlertDialogTrigger>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add to Catalog</p>
                                </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent className="rounded-3xl border-none dark:bg-slate-900">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold dark:text-white">
                                        Add to Catalog
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="dark:text-slate-400">
                                        Copy this product to your personal
                                        catalog?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl font-bold dark:bg-slate-800 dark:text-white">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onCopy}
                                        className="rounded-xl font-bold px-6"
                                    >
                                        Yes, Copy Now
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                                    onClick={() => setIsInfoOpen(true)}
                                >
                                    <InfoIcon size={18} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Detail Information</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                                    disabled={!tour.document}
                                    onClick={onViewBrochure}
                                >
                                    <IconPdf size={18} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Itinerary</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                                    disabled={startingChat}
                                    onClick={onChat}
                                >
                                    {startingChat ? (
                                        <Spinner />
                                    ) : (
                                        <MessageSquareIcon size={18} />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ask AI</p>
                            </TooltipContent>
                        </Tooltip>
                    </>
                }
            />

            <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <DialogContent
                    className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-[58rem] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-950 sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-3rem)] lg:max-w-[60rem] [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:z-30 [&_[data-slot=dialog-close]]:flex [&_[data-slot=dialog-close]]:h-10 [&_[data-slot=dialog-close]]:w-10 [&_[data-slot=dialog-close]]:items-center [&_[data-slot=dialog-close]]:justify-center [&_[data-slot=dialog-close]]:rounded-2xl [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-white/25 [&_[data-slot=dialog-close]]:bg-white/15 [&_[data-slot=dialog-close]]:p-0 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:shadow-lg [&_[data-slot=dialog-close]]:shadow-black/10 [&_[data-slot=dialog-close]]:backdrop-blur-md [&_[data-slot=dialog-close]]:hover:bg-white/25 [&_[data-slot=dialog-close]]:focus:ring-white/40 [&_[data-slot=dialog-close]_svg]:h-5 [&_[data-slot=dialog-close]_svg]:w-5"
                    aria-describedby={undefined}
                >
                    <DialogHeader className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-5 py-6 text-left text-white dark:border-slate-800 sm:px-6">
                        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.35),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.28),transparent_45%)]" />
                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                                    <InfoIcon className="h-3.5 w-3.5 text-sky-200" />
                                    Detail Information
                                </div>
                                <DialogTitle className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                                    {tour.name}
                                </DialogTitle>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/70">
                                    <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs">
                                        {tour.code || 'No tour code'}
                                    </span>
                                    <span>{tour.destination || '-'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur sm:min-w-[21rem]">
                                <div className="rounded-xl bg-white/10 px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                                        Schedules
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">
                                        {schedules.length}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/10 px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                                        Available
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-emerald-200">
                                        {totalAvailability}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/10 px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                                        Max Pax
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">
                                        {totalMaxPax}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto bg-slate-50/80 p-5 dark:bg-slate-950 sm:max-h-[calc(100dvh-15rem)] sm:p-6">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                                        <MapPinIcon className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Destination
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                        {tour.destination || '-'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                                        <ClockIcon className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Duration
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                        {tour.duration_days
                                            ? `${tour.duration_days} days`
                                            : '-'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-300">
                                        <CircleDollarSignIcon className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Normal Price in Catalog
                                    </p>
                                    <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                        {formatCurrency(
                                            tour.showprice,
                                            currency,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                                        <UsersRoundIcon className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Total Availability
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                        {totalAvailability} seats
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                                            Schedule & Pricing
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Available departures based on the
                                            booking deadline parameter.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                        {schedules.length} Schedule
                                        {schedules.length === 1 ? '' : 's'}
                                    </span>
                                </div>

                                {schedules.length > 0 ? (
                                    <div className="space-y-3">
                                        {schedules.map(
                                            (
                                                schedule: any,
                                                scheduleIndex: number,
                                            ) => {
                                                const prices = Array.isArray(
                                                    schedule.prices,
                                                )
                                                    ? schedule.prices
                                                    : [];
                                                const availability =
                                                    schedule.availability || {};

                                                return (
                                                    <div
                                                        key={
                                                            schedule.id ||
                                                            scheduleIndex
                                                        }
                                                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                                    >
                                                        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                        <CalendarDaysIcon className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                            {formatDate(
                                                                                schedule.departure_date,
                                                                            )}{' '}
                                                                            -{' '}
                                                                            {formatDate(
                                                                                schedule.return_date,
                                                                            )}
                                                                        </p>
                                                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                            Departure
                                                                            schedule
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                                                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                                                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                                                                        Max Pax
                                                                    </p>
                                                                    <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">
                                                                        {Number(
                                                                            availability.max_pax ||
                                                                                0,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                                                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                                                                        Availability
                                                                    </p>
                                                                    <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        {Number(
                                                                            availability.available ||
                                                                                0,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-hidden">
                                                            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(150px,0.65fr)_minmax(210px,0.75fr)] bg-slate-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:bg-slate-950 sm:grid">
                                                                <span>
                                                                    Category
                                                                </span>
                                                                <span>
                                                                    Price
                                                                </span>
                                                                <span>
                                                                    Commission
                                                                </span>
                                                            </div>
                                                            {prices.length >
                                                            0 ? (
                                                                prices.map(
                                                                    (
                                                                        price: any,
                                                                        priceIndex: number,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                price.id ||
                                                                                priceIndex
                                                                            }
                                                                            className="grid gap-2 border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.65fr)_minmax(210px,0.75fr)] sm:items-center"
                                                                        >
                                                                            <div>
                                                                                <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                                                                    Category
                                                                                </p>
                                                                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                                                                    {getPriceCategoryName(
                                                                                        price,
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                                                                    Price
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    <p className="font-medium text-slate-800 dark:text-slate-100">
                                                                                        {formatCurrency(
                                                                                            price.price,
                                                                                            currency,
                                                                                        )}
                                                                                    </p>
                                                                                    {getPromotionLabel(
                                                                                        price,
                                                                                        currency,
                                                                                    ) && (
                                                                                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                                                                                            Promo{' '}
                                                                                            {getPromotionLabel(
                                                                                                price,
                                                                                                currency,
                                                                                            )}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                                                                    Commission
                                                                                </p>
                                                                                <p className="font-semibold text-pink-600 dark:text-pink-300">
                                                                                    {getCommissionLabel(
                                                                                        price,
                                                                                        currency,
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <div className="border-t border-slate-100 px-5 py-5 text-sm font-medium text-slate-400 dark:border-slate-800">
                                                                    No pricing
                                                                    category
                                                                    available.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-medium text-slate-400 dark:border-slate-800">
                                        No schedule available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
