import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';
import { IconCalendarEvent, IconPdf } from '@tabler/icons-react';
import { BellIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import BaseTourCard from './BaseTourCard';

export default function VendorTourCard({
    tour,
    isVendorNameVisible,
    isVendorInactive,
    imagePriority = false,
    onViewBrochure,
    onBook,
}: any) {
    const { company } = usePageSharedDataProps();
    const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
        useState(false);

    const handleBookClick = () => {
        const normalizedTour = Array.isArray(tour?.schedules)
            ? {
                  ...tour,
                  schedules: tour.schedules.map((schedule: any) => {
                      if (
                          Number.isFinite(Number(schedule?.price)) &&
                          Number(schedule.price) > 0
                      ) {
                          return schedule;
                      }

                      const priceOptions = Array.isArray(schedule?.prices)
                          ? schedule.prices
                                .map((item: any) => {
                                    const basePrice = Number(item?.price ?? 0);
                                    const fixedPromotion = Number(
                                        item?.promotion ?? 0,
                                    );
                                    const ratePromotion = Number(
                                        item?.promotion_rate ?? 0,
                                    );

                                    if (
                                        !Number.isFinite(basePrice) ||
                                        basePrice <= 0
                                    ) {
                                        return null;
                                    }

                                    if (ratePromotion > 0) {
                                        return Math.max(
                                            0,
                                            Math.round(
                                                basePrice -
                                                    (basePrice *
                                                        ratePromotion) /
                                                        100,
                                            ),
                                        );
                                    }

                                    if (fixedPromotion > 0) {
                                        return Math.max(
                                            0,
                                            Math.round(
                                                basePrice - fixedPromotion,
                                            ),
                                        );
                                    }

                                    return basePrice;
                                })
                                .filter(
                                    (value: number | null): value is number =>
                                        value !== null,
                                )
                          : [];

                      return {
                          ...schedule,
                          price:
                              priceOptions.length > 0
                                  ? Math.min(...priceOptions)
                                  : 0,
                      };
                  }),
              }
            : tour;

        onBook?.(normalizedTour);
    };

    const handleSendNotification = () => {
        router.post(
            `/companies/${company.username}/dashboard/tours/${tour.id}/notify-agents`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsNotificationDialogOpen(false),
            },
        );
    };

    return (
        <BaseTourCard
            tour={tour}
            isVendorNameVisible={isVendorNameVisible}
            isVendorInactive={isVendorInactive}
            imagePriority={imagePriority}
            statusSection={
                <div className="mx-4 mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            <FormattedMessage defaultMessage="My Catalog Status" />
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
                    <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                                type="button"
                                className="flex-1 rounded-xl h-9 shadow-sm bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                                onClick={handleBookClick}
                            >
                                <IconCalendarEvent size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                <FormattedMessage defaultMessage="Book Tour" />
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
                    <AlertDialog
                        open={isNotificationDialogOpen}
                        onOpenChange={setIsNotificationDialogOpen}
                    >
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                                    onClick={() =>
                                        setIsNotificationDialogOpen(true)
                                    }
                                >
                                    <BellIcon className="h-[18px] w-[18px]" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    <FormattedMessage defaultMessage="Send notifications to agents" />
                                </p>
                            </TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    <FormattedMessage defaultMessage="Send tour notification?" />
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    <FormattedMessage defaultMessage="Are you sure you want to send information about this tour to all of your agents?" />
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    <FormattedMessage defaultMessage="Cancel" />
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleSendNotification}
                                >
                                    <FormattedMessage defaultMessage="Yes, send notification" />
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            }
        />
    );
}
