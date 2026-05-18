import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconCalendarEvent, IconPdf } from '@tabler/icons-react';
import BaseTourCard from './BaseTourCard';

export default function VendorTourCard({
  tour,
  isVendorNameVisible,
  isVendorInactive,
  onViewBrochure,
  onBook,
}: any) {
  const handleBookClick = () => {
    const normalizedTour = Array.isArray(tour?.schedules)
      ? {
          ...tour,
          schedules: tour.schedules.map((schedule: any) => {
            if (Number.isFinite(Number(schedule?.price))) {
              return schedule;
            }

            const priceOptions = Array.isArray(schedule?.prices)
              ? schedule.prices
                  .map((item: any) => {
                    const basePrice = Number(item?.price ?? 0);
                    const fixedPromotion = Number(item?.promotion ?? 0);
                    const ratePromotion = Number(item?.promotion_rate ?? 0);

                    if (!Number.isFinite(basePrice) || basePrice <= 0) {
                      return null;
                    }

                    if (ratePromotion > 0) {
                      return Math.max(
                        0,
                        Math.round(
                          basePrice - (basePrice * ratePromotion) / 100,
                        ),
                      );
                    }

                    if (fixedPromotion > 0) {
                      return Math.max(
                        0,
                        Math.round(basePrice - fixedPromotion),
                      );
                    }

                    return basePrice;
                  })
                  .filter(
                    (value: number | null): value is number => value !== null,
                  )
              : [];

            return {
              ...schedule,
              price: priceOptions.length > 0 ? Math.min(...priceOptions) : 0,
            };
          }),
        }
      : tour;

    onBook?.(normalizedTour);
  };

  return (
    <BaseTourCard
      tour={tour}
      isVendorNameVisible={isVendorNameVisible}
      isVendorInactive={isVendorInactive}
      statusSection={
        <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              My Catalog Status
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
              <p>Book Tour</p>
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
              <p>View Brochure</p>
            </TooltipContent>
          </Tooltip>
        </>
      }
    />
  );
}
