import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { extractDocumentUrl } from '@/lib/utils';
import {
    IconBrandFacebook,
    IconCalendarEvent,
    IconPdf,
} from '@tabler/icons-react';
import { MessageSquareIcon } from 'lucide-react';
import BaseTourCard from './BaseTourCard';

export default function AgentMyTourCard({
    tour,
    isVendorNameVisible,
    isVendorInactive,
    onViewBrochure,
    onChat,
    onShareFB,
    onBook,
    startingChat,
}: any) {
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
    const agentDocument = tour.agent_document || tour.agentDocument;
    const agentDocumentUrl =
        tour.agent_document_url ||
        (agentDocument ? extractDocumentUrl(agentDocument) : '');
    const vendorDocumentUrl =
        tour.vendor_document_url ||
        (tour.document ? extractDocumentUrl(tour.document) : '');
    const itineraryDocumentUrl =
        tour.itinerary_document_url || agentDocumentUrl || vendorDocumentUrl;
    const hasItinerary = Boolean(itineraryDocumentUrl);
    const handleViewItinerary = () => {
        if (itineraryDocumentUrl) {
            window.open(itineraryDocumentUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        onViewBrochure?.();
    };

    return (
        <BaseTourCard
            tour={tour}
            isVendorNameVisible={isVendorNameVisible}
            isVendorInactive={isVendorInactive}
            statusSection={
                <div className="mx-4 mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/60">
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
                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/60 pt-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            My Catalog Status
                        </span>
                        <span
                            className={`text-[9px] font-black uppercase ${tour.agent_status === 'active' ? 'text-blue-500' : 'text-red-500'}`}
                        >
                            {tour.agent_status}
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
                                className="h-9 flex-1 rounded-xl bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95"
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
                                className="h-9 flex-1 rounded-xl border-none bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                disabled={!hasItinerary}
                                onClick={handleViewItinerary}
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
                                className="h-9 flex-1 rounded-xl border-none bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                    <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-9 flex-1 rounded-xl border-none bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                disabled={!hasItinerary}
                                onClick={onShareFB}
                            >
                                <IconBrandFacebook size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Share to Facebook</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            }
        />
    );
}
