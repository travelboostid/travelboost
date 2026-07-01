import { MediaPicker } from '@/components/media-picker';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractDocumentUrl } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    IconBrandFacebook,
    IconCalendarEvent,
    IconPdf,
} from '@tabler/icons-react';
import { MessageSquareIcon, Trash2Icon, UploadCloudIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import BaseTourCard from './BaseTourCard';

export default function AgentMyTourCard({
    tour,
    isVendorNameVisible,
    isVendorInactive,
    imagePriority = false,
    onViewBrochure,
    onChat,
    onShareFB,
    onBook,
    startingChat,
}: any) {
    const { company } = usePageSharedDataProps();
    const isBookingBlockedBySubscription = Boolean(
        tour.booking_blocked_by_subscription,
    );

    const handleBookClick = () => {
        if (isBookingBlockedBySubscription) {
            toast.error('Upgrade subscription to book this vendor tour.');
            return;
        }

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
        tour.itinerary_document_url ||
        (tour.itinerary_document_source === 'agent'
            ? agentDocumentUrl
            : vendorDocumentUrl || agentDocumentUrl);
    const hasItinerary = Boolean(itineraryDocumentUrl);
    const isAgentUploadEnabled = tour.agent_itinerary_upload_enabled ?? false;
    const canReplaceAgentDocument = Boolean(
        tour.agent_tour_id && isAgentUploadEnabled,
    );

    const updateDocument = (media: any) => {
        if (!tour.agent_tour_id) {
            return;
        }

        router.put(
            `/companies/${company.username}/dashboard/agent-tours/${tour.agent_tour_id}`,
            { agent_document_id: media?.id ?? null },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () =>
                    toast.success(
                        media
                            ? 'Agent itinerary uploaded successfully'
                            : 'Agent itinerary removed successfully',
                    ),
            },
        );
    };

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
            imagePriority={imagePriority}
            statusSection={
                <div className="mx-4 mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/60">
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
                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/60 pt-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            <FormattedMessage defaultMessage="My Catalog Status" />
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
                    <div className="flex w-full flex-wrap gap-2">
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <span
                                    className="flex-1"
                                    tabIndex={
                                        isBookingBlockedBySubscription
                                            ? 0
                                            : undefined
                                    }
                                >
                                    <Button
                                        variant="default"
                                        size="sm"
                                        type="button"
                                        className="h-9 w-full rounded-xl bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-60"
                                        onClick={handleBookClick}
                                        disabled={
                                            isBookingBlockedBySubscription
                                        }
                                        aria-describedby={
                                            isBookingBlockedBySubscription
                                                ? 'booking-subscription-lock'
                                                : undefined
                                        }
                                    >
                                        <IconCalendarEvent size={18} />
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {isBookingBlockedBySubscription ? (
                                        <FormattedMessage defaultMessage="Subscribe to unlock booking" />
                                    ) : (
                                        <FormattedMessage defaultMessage="Book Tour" />
                                    )}
                                </p>
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
                                <p>
                                    <FormattedMessage defaultMessage="Ask AI" />
                                </p>
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
                                <p>
                                    <FormattedMessage defaultMessage="Share to Facebook" />
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    {isBookingBlockedBySubscription ? (
                        <div
                            id="booking-subscription-lock"
                            className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                        >
                            <FormattedMessage defaultMessage="Booking locked for this vendor. Please subscribe to a paid package first." />
                        </div>
                    ) : null}
                    {agentDocument ? (
                        <div className="flex w-full items-center gap-2">
                            {canReplaceAgentDocument ? (
                                <MediaPicker
                                    type="document"
                                    defaultValue={agentDocument}
                                    onChange={updateDocument}
                                    params={{
                                        owner_type: 'company',
                                        owner_id: company.id,
                                    }}
                                    uploadParams={{
                                        owner_type: 'company',
                                        owner_id: company.id,
                                        subtype: 'agent-itinerary',
                                    }}
                                >
                                    {(_, change) => (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 flex-1 rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                            onClick={change}
                                        >
                                            <UploadCloudIcon
                                                size={14}
                                                className="mr-1.5"
                                            />
                                            <FormattedMessage defaultMessage="Replace Agent PDF" />
                                        </Button>
                                    )}
                                </MediaPicker>
                            ) : (
                                <div className="flex-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    <FormattedMessage defaultMessage="Agent PDF is stored. Vendor PDF is currently used for display." />
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-xl px-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                onClick={() => updateDocument(null)}
                            >
                                <Trash2Icon size={14} className="mr-1.5" />
                                <FormattedMessage defaultMessage="Delete" />
                            </Button>
                        </div>
                    ) : null}
                </>
            }
        />
    );
}
