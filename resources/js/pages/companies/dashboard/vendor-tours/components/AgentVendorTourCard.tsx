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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { IconPdf } from '@tabler/icons-react';
import axios from 'axios';
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
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
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

const formatPercentage = (value: any) =>
    `${Number(toNumber(value).toFixed(2)).toString()}%`;

const getCommissionComponent = (
    basePrice: number,
    type: any,
    value: any,
    currency = 'IDR',
) => {
    const commissionValue = toNumber(value);

    if (commissionValue <= 0) {
        return null;
    }

    if (type === 'percent') {
        const amount = (basePrice * commissionValue) / 100;

        return {
            amount,
            label: `${formatCurrency(amount, currency)} (${formatPercentage(commissionValue)})`,
            shortLabel: formatPercentage(commissionValue),
        };
    }

    return {
        amount: commissionValue,
        label: formatCurrency(commissionValue, currency),
        shortLabel: formatCurrency(commissionValue, currency),
    };
};

const getApplicableCommissionRule = (tour: any, partnership: any) => {
    const tierId = Number(
        partnership?.agent_tier_id ??
            partnership?.agentTier?.id ??
            partnership?.agent_tier?.id ??
            0,
    );
    const categoryId = Number(
        tour.product_commission_category_id ??
            tour.productCommissionCategory?.id ??
            tour.product_commission_category?.id ??
            0,
    );
    const rules = Array.isArray(tour.commission_rules)
        ? tour.commission_rules
        : Array.isArray(tour.commissionRules)
          ? tour.commissionRules
          : [];

    return rules.find((rule: any) => {
        const isActive = rule.is_active ?? rule.isActive ?? true;
        const isRuleActive =
            isActive === true ||
            isActive === 1 ||
            isActive === '1' ||
            isActive === 'true';

        return (
            isRuleActive &&
            Number(rule.agent_tier_id ?? rule.agentTier?.id ?? 0) === tierId &&
            Number(
                rule.product_commission_category_id ??
                    rule.productCommissionCategory?.id ??
                    0,
            ) === categoryId
        );
    });
};

const getScheduleAdjustment = (rule: any, schedule: any) => {
    const adjustments = Array.isArray(rule?.schedule_adjustments)
        ? rule.schedule_adjustments
        : Array.isArray(rule?.scheduleAdjustments)
          ? rule.scheduleAdjustments
          : [];

    return adjustments.find(
        (adjustment: any) =>
            Number(
                adjustment.tour_schedule_id ?? adjustment.tourSchedule?.id ?? 0,
            ) === Number(schedule?.id ?? 0),
    );
};

const toComparableDate = (value: any) =>
    value ? String(value).slice(0, 10) : '';

const getAdditionalCommissionRules = (
    tour: any,
    schedule: any,
    partnership: any,
) => {
    const tierId = Number(
        partnership?.agent_tier_id ??
            partnership?.agentTier?.id ??
            partnership?.agent_tier?.id ??
            0,
    );
    const categoryId = Number(
        tour.product_commission_category_id ??
            tour.productCommissionCategory?.id ??
            tour.product_commission_category?.id ??
            0,
    );
    const scheduleId = Number(schedule?.id ?? 0);
    const departureDate = toComparableDate(schedule?.departure_date);
    const rules = Array.isArray(tour.additional_commission_rules)
        ? tour.additional_commission_rules
        : Array.isArray(tour.additionalCommissionRules)
          ? tour.additionalCommissionRules
          : [];

    return rules.filter((rule: any) => {
        const isActive = rule.is_active ?? rule.isActive ?? true;
        const isRuleActive =
            isActive === true ||
            isActive === 1 ||
            isActive === '1' ||
            isActive === 'true';

        if (
            !isRuleActive ||
            Number(rule.agent_tier_id ?? rule.agentTier?.id ?? 0) !== tierId
        ) {
            return false;
        }

        if (rule.scope_type === 'category_departure') {
            return (
                Number(
                    rule.product_commission_category_id ??
                        rule.productCommissionCategory?.id ??
                        0,
                ) === categoryId &&
                toComparableDate(rule.departure_date) === departureDate
            );
        }

        if (rule.scope_type === 'tour_schedule') {
            return (
                Number(rule.tour_schedule_id ?? rule.tourSchedule?.id ?? 0) ===
                scheduleId
            );
        }

        return false;
    });
};

const getFallbackCommission = (price: any, currency = 'IDR') => {
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

        return {
            label: `${formatCurrency(commissionValue, currency)} (${formatPercentage(commissionRate)})`,
            detail: 'Based on price after promotion.',
        };
    }

    if (commissionAmount > 0) {
        return {
            label: formatCurrency(commissionAmount, currency),
            detail: 'Fixed commission per pax.',
        };
    }

    return {
        label: '-',
        detail: null,
    };
};

const getCommissionDetails = (
    price: any,
    schedule: any,
    tour: any,
    partnership: any,
    currency = 'IDR',
) => {
    const rule = getApplicableCommissionRule(tour, partnership);

    if (!rule) {
        return getFallbackCommission(price, currency);
    }

    const basePrice = getPromotionalPrice(price);
    const main = getCommissionComponent(
        basePrice,
        rule.commission_type ?? rule.commissionType,
        rule.commission_value ?? rule.commissionValue,
        currency,
    );
    const adjustment = getScheduleAdjustment(rule, schedule);
    const legacyAdditional = adjustment
        ? [
              getCommissionComponent(
                  basePrice,
                  adjustment.commission_type ?? adjustment.commissionType,
                  adjustment.commission_value ?? adjustment.commissionValue,
                  currency,
              ),
          ]
        : [];
    const additionalRules = getAdditionalCommissionRules(
        tour,
        schedule,
        partnership,
    );
    const additionalComponents = [
        ...legacyAdditional,
        ...additionalRules.map((additionalRule: any) =>
            getCommissionComponent(
                basePrice,
                additionalRule.commission_type ?? additionalRule.commissionType,
                additionalRule.commission_value ??
                    additionalRule.commissionValue,
                currency,
            ),
        ),
    ].filter(Boolean);

    if (!main && additionalComponents.length === 0) {
        return {
            label: '-',
            detail: 'Commission matrix has no value for this tier and category.',
        };
    }

    const totalAdditionalAmount = additionalComponents.reduce(
        (total: number, component: any) => total + toNumber(component?.amount),
        0,
    );
    const totalAmount = (main?.amount ?? 0) + totalAdditionalAmount;
    const additionalLabels = additionalComponents
        .map((component: any) => component?.label)
        .filter(Boolean);
    const detail = [
        main ? `Base ${main.label}` : null,
        additionalLabels.length
            ? `Additional ${additionalLabels.join(' + ')}`
            : null,
    ]
        .filter(Boolean)
        .join(' + ');

    return {
        label:
            additionalComponents.length > 0 && totalAmount > 0
                ? `${formatCurrency(totalAmount, currency)} (${[
                      main?.shortLabel,
                      ...additionalComponents.map(
                          (component: any) => component?.shortLabel,
                      ),
                  ]
                      .filter(Boolean)
                      .join(' + ')})`
                : main?.label || additionalComponents[0]?.label || '-',
        detail: detail ? `Per pax: ${detail}` : null,
    };
};

export default function AgentVendorTourCard({
    tour,
    partnership,
    isVendorNameVisible,
    canCopy,
    hasCopied,
    imagePriority = false,
    onCopy,
    onViewBrochure,
    onChat,
    startingChat,
}: any) {
    const { company } = usePageSharedDataProps();
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [detailPayload, setDetailPayload] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(false);

    const vendorUsername =
        tour.company?.username ?? tour.company?.data?.username ?? null;

    const loadTourDetails = useCallback(async () => {
        if (
            !company?.username ||
            !vendorUsername ||
            !tour?.id ||
            detailPayload
        ) {
            return;
        }

        setDetailLoading(true);
        setDetailError(false);

        try {
            const response = await axios.get(
                `/companies/${company.username}/dashboard/vendors/${vendorUsername}/tours/${tour.id}/details`,
            );
            setDetailPayload(response.data);
        } catch {
            setDetailError(true);
        } finally {
            setDetailLoading(false);
        }
    }, [company?.username, detailPayload, tour?.id, vendorUsername]);

    const handleOpenInfo = () => {
        setIsInfoOpen(true);
        void loadTourDetails();
    };

    const displayTour = useMemo(() => {
        if (!detailPayload) {
            return tour;
        }

        return {
            ...tour,
            product_commission_category_id:
                detailPayload.product_commission_category_id ??
                tour.product_commission_category_id,
            schedules: detailPayload.schedules ?? tour.schedules,
            commission_rules:
                detailPayload.commission_rules ??
                detailPayload.commissionRules ??
                tour.commission_rules,
            commissionRules:
                detailPayload.commission_rules ??
                detailPayload.commissionRules ??
                tour.commissionRules,
            additional_commission_rules:
                detailPayload.additional_commission_rules ??
                detailPayload.additionalCommissionRules ??
                tour.additional_commission_rules,
            additionalCommissionRules:
                detailPayload.additional_commission_rules ??
                detailPayload.additionalCommissionRules ??
                tour.additionalCommissionRules,
        };
    }, [detailPayload, tour]);

    const isVendorInactive = String(tour.status).toLowerCase() !== 'active';
    const bookingDeadlineDays = Number(
        tour.company?.company_setting?.booking_deadline ??
            tour.company?.companySetting?.booking_deadline ??
            0,
    );
    const cutoffDate = toDateString(addDays(new Date(), bookingDeadlineDays));
    const schedules = Array.isArray(displayTour.schedules)
        ? displayTour.schedules.filter(
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
                imagePriority={imagePriority}
                statusSection={
                    <div className="mx-4 mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/60">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                <FormattedMessage defaultMessage="Vendor Tour Status" />
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
                                    <p>
                                        <FormattedMessage defaultMessage="Add to Catalog" />
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent className="rounded-3xl border-none dark:bg-slate-900">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold dark:text-white">
                                        <FormattedMessage defaultMessage="Add to Catalog" />
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="dark:text-slate-400">
                                        <FormattedMessage defaultMessage="Copy this product to your personal catalog?" />
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl font-bold dark:bg-slate-800 dark:text-white">
                                        <FormattedMessage defaultMessage="Cancel" />
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onCopy}
                                        className="rounded-xl font-bold px-6"
                                    >
                                        <FormattedMessage defaultMessage="Yes, Copy Now" />
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
                                    onClick={handleOpenInfo}
                                >
                                    <InfoIcon size={18} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    <FormattedMessage defaultMessage="Detail Information" />
                                </p>
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
                                <p>
                                    <FormattedMessage defaultMessage="Itinerary" />
                                </p>
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
                                <p>
                                    <FormattedMessage defaultMessage="Ask AI" />
                                </p>
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
                                    <FormattedMessage defaultMessage="Detail Information" />
                                </div>
                                <DialogTitle className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                                    {tour.name}
                                </DialogTitle>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/70">
                                    <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs">
                                        {tour.code || (
                                            <FormattedMessage defaultMessage="No tour code" />
                                        )}
                                    </span>
                                    <span>{tour.destination || '-'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur sm:min-w-[21rem]">
                                <div className="rounded-xl bg-white/10 px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                                        <FormattedMessage defaultMessage="Schedules" />
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">
                                        {schedules.length}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/10 px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                                        <FormattedMessage defaultMessage="Available" />
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-emerald-200">
                                        {totalAvailability}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/10 px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                                        <FormattedMessage defaultMessage="Max Pax" />
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
                                        <FormattedMessage defaultMessage="Destination" />
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
                                        <FormattedMessage defaultMessage="Duration" />
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                        {tour.duration_days ? (
                                            <FormattedMessage
                                                defaultMessage="{count} days"
                                                values={{
                                                    count: tour.duration_days,
                                                }}
                                            />
                                        ) : (
                                            '-'
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-300">
                                        <CircleDollarSignIcon className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        <FormattedMessage defaultMessage="Normal Price in Catalog" />
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
                                        <FormattedMessage defaultMessage="Total Availability" />
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                        <FormattedMessage
                                            defaultMessage="{count} seats"
                                            values={{
                                                count: totalAvailability,
                                            }}
                                        />
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                                            <FormattedMessage defaultMessage="Schedule & Pricing" />
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            <FormattedMessage defaultMessage="Available departures based on the booking deadline parameter." />
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                        <FormattedMessage
                                            defaultMessage="{count, plural, one {# Schedule} other {# Schedules}}"
                                            values={{ count: schedules.length }}
                                        />
                                    </span>
                                </div>

                                {schedules.length > 0 ? (
                                    <div className="space-y-3">
                                        {detailLoading && (
                                            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                                <Spinner />
                                                <FormattedMessage defaultMessage="Loading pricing and commission details..." />
                                            </div>
                                        )}
                                        {detailError && !detailLoading && (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                                <FormattedMessage defaultMessage="Unable to load pricing details. Please try again." />
                                            </div>
                                        )}
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
                                                                            <FormattedMessage defaultMessage="Departure schedule" />
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                                                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                                                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                                                                        <FormattedMessage defaultMessage="Max Pax" />
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
                                                                        <FormattedMessage defaultMessage="Availability" />
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
                                                                    <FormattedMessage defaultMessage="Category" />
                                                                </span>
                                                                <span>
                                                                    <FormattedMessage defaultMessage="Price" />
                                                                </span>
                                                                <span>
                                                                    <FormattedMessage defaultMessage="Commission" />
                                                                </span>
                                                            </div>
                                                            {prices.length >
                                                            0 ? (
                                                                prices.map(
                                                                    (
                                                                        price: any,
                                                                        priceIndex: number,
                                                                    ) => {
                                                                        const promotionLabel =
                                                                            getPromotionLabel(
                                                                                price,
                                                                                currency,
                                                                            );
                                                                        const promotionalPrice =
                                                                            getPromotionalPrice(
                                                                                price,
                                                                            );
                                                                        const commission =
                                                                            getCommissionDetails(
                                                                                price,
                                                                                schedule,
                                                                                displayTour,
                                                                                partnership,
                                                                                currency,
                                                                            );

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    price.id ||
                                                                                    priceIndex
                                                                                }
                                                                                className="grid gap-2 border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.65fr)_minmax(210px,0.75fr)] sm:items-center"
                                                                            >
                                                                                <div>
                                                                                    <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                                                                        <FormattedMessage defaultMessage="Category" />
                                                                                    </p>
                                                                                    <p className="font-medium text-slate-800 dark:text-slate-100">
                                                                                        {getPriceCategoryName(
                                                                                            price,
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                                                                        <FormattedMessage defaultMessage="Price" />
                                                                                    </p>
                                                                                    <div className="space-y-1">
                                                                                        {promotionLabel ? (
                                                                                            <>
                                                                                                <p className="text-xs font-medium text-slate-400 line-through dark:text-slate-500">
                                                                                                    {formatCurrency(
                                                                                                        price.price,
                                                                                                        currency,
                                                                                                    )}
                                                                                                </p>
                                                                                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                                                                    {formatCurrency(
                                                                                                        promotionalPrice,
                                                                                                        currency,
                                                                                                    )}
                                                                                                </p>
                                                                                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                                                                                                    <FormattedMessage
                                                                                                        defaultMessage="Promotion {amount}"
                                                                                                        values={{
                                                                                                            amount: promotionLabel,
                                                                                                        }}
                                                                                                    />
                                                                                                </p>
                                                                                            </>
                                                                                        ) : (
                                                                                            <p className="font-medium text-slate-800 dark:text-slate-100">
                                                                                                {formatCurrency(
                                                                                                    price.price,
                                                                                                    currency,
                                                                                                )}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                                                                        <FormattedMessage defaultMessage="Commission" />
                                                                                    </p>
                                                                                    <p className="font-semibold text-pink-600 dark:text-pink-300">
                                                                                        {
                                                                                            commission.label
                                                                                        }
                                                                                    </p>
                                                                                    {commission.detail && (
                                                                                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                                                            {
                                                                                                commission.detail
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )
                                                            ) : Number(
                                                                  schedule.price,
                                                              ) > 0 ? (
                                                                <div className="grid gap-2 border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.65fr)_minmax(210px,0.75fr)] sm:items-center">
                                                                    <div>
                                                                        <p className="font-medium text-slate-800 dark:text-slate-100">
                                                                            <FormattedMessage defaultMessage="Starting price" />
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                                            {formatCurrency(
                                                                                schedule.price,
                                                                                currency,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {detailLoading ? (
                                                                            <FormattedMessage defaultMessage="Loading commission..." />
                                                                        ) : (
                                                                            <FormattedMessage defaultMessage="Open tour edit for full category pricing." />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="border-t border-slate-100 px-5 py-5 text-sm font-medium text-slate-400 dark:border-slate-800">
                                                                    <FormattedMessage defaultMessage="No pricing category available." />
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
                                        <FormattedMessage defaultMessage="No schedule available." />
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
