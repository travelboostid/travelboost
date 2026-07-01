import type { TourResource } from '@/api/model';
import { useStartPrivateChat } from '@/components/chat/state';
import TourBookingModal from '@/components/tours/tour-booking-modal';
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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { activateChatStack } from '@/lib/activate-chat-stack';
import { extractDocumentUrl } from '@/lib/utils';
import { useChatUiStore } from '@/stores/chat/chat-ui-store';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import AgentMyTourCard from './AgentMyTourCard';
import AgentVendorTourCard from './AgentVendorTourCard';
import PublicTourCard from './PublicTourCard';
import VendorTourCard from './VendorTourCard';

type TourCardResource = TourResource & {
    earlybird?: number | string | null;
    earlybird_note?: string | null;
    is_liked?: boolean;
    promote_note?: string | null;
    promote_price?: number | string | null;
    promote_title?: string | null;
    promoprice?: number | string | null;
    showprice?: number | string | null;
    user?: { phone?: string | null } | null;
    agent_document?: any;
    agentDocument?: any;
    agent_document_url?: string | null;
    vendor_document_url?: string | null;
    itinerary_document_url?: string | null;
    itinerary_document_source?: 'agent' | 'vendor' | null;
    agent_status?: string | { value: string };
    has_copied?: boolean;
    show_vendor_name?: boolean | number | string;
    pivot?: {
        status?: string | { value: string };
        show_vendor_name?: boolean | number | string;
        [key: string]: any;
    };
    agents?: any[];
};

const getDashboardCompanyUsernameFromPath = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const match = window.location.pathname.match(
        /^\/companies\/([^/]+)\/dashboard(?:\/|$)/,
    );

    return match?.[1] ? decodeURIComponent(match[1]) : null;
};

export default function TourCard({
    tour,
    type = 'agent',
    partnership,
    isOwnCatalog = false,
    fromLogin = true,
    autoOpenBookingModal = false,
    imagePriority = false,
}: {
    tour: TourCardResource;
    type?: string;
    partnership?: any;
    isOwnCatalog?: boolean;
    fromLogin?: boolean;
    autoOpenBookingModal?: boolean;
    imagePriority?: boolean;
}) {
    const { company, auth } = usePageSharedDataProps();
    const startPrivateChat = useStartPrivateChat();
    const setAttachment = useChatUiStore((state) => state.setAttachment);

    const [startingChat, setStartingChat] = useState(false);
    const [liked, setLiked] = useState(Boolean(tour.is_liked));
    const [pendingAction, setPendingAction] = useState<'like' | 'book' | null>(
        null,
    );
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedBookingTour, setSelectedBookingTour] =
        useState<TourCardResource | null>(null);

    const isLandingPage = !fromLogin;
    const isAgentDashboard = fromLogin && type === 'agent';
    const isVendorDashboard = fromLogin && type === 'vendor';

    const parseStatus = (statusObj: any): string | undefined => {
        if (statusObj === undefined || statusObj === null) return undefined;
        if (typeof statusObj === 'object') {
            return String(
                statusObj.value || statusObj.name || '',
            ).toLowerCase();
        }
        return String(statusObj).toLowerCase();
    };

    const vendorStatusStr = parseStatus(tour.status);
    const isVendorActive = vendorStatusStr === 'active';
    const isVendorInactive = !isVendorActive;

    let agentStatusStr: string | undefined = undefined;

    if (tour.agent_status !== undefined && tour.agent_status !== null) {
        agentStatusStr = parseStatus(tour.agent_status);
    } else if (
        tour.pivot?.status !== undefined &&
        tour.pivot?.status !== null
    ) {
        agentStatusStr = parseStatus(tour.pivot.status);
    } else if (Array.isArray(tour.agents) && company?.id) {
        const currentAgent = tour.agents.find(
            (a: any) => Number(a.id) === Number(company.id),
        );
        if (
            currentAgent?.pivot?.status !== undefined &&
            currentAgent?.pivot?.status !== null
        ) {
            agentStatusStr = parseStatus(currentAgent.pivot.status);
        }
    }

    let isAgentActive = false;
    if (agentStatusStr !== undefined) {
        isAgentActive = agentStatusStr === 'active';
    } else if (isLandingPage && company?.type === 'agent') {
        isAgentActive = vendorStatusStr === 'active';
    } else {
        isAgentActive = true;
    }

    const shouldHideLandingTour =
        isLandingPage &&
        ((company?.type === 'agent' && !isAgentActive) ||
            (company?.type === 'vendor' && !isVendorActive));

    const handleLike = useCallback(async () => {
        try {
            const response = await axios.post(`/me/tours/${tour.id}/like`);
            setLiked(Boolean(response.data.liked));
        } catch {
            return;
        }
    }, [tour.id]);

    useEffect(() => {
        if (autoOpenBookingModal && isLandingPage && !shouldHideLandingTour) {
            setIsBookingOpen(true);
        }
    }, [autoOpenBookingModal, isLandingPage, shouldHideLandingTour]);

    useEffect(() => {
        if (auth?.user && !shouldHideLandingTour) {
            const pendingStr = sessionStorage.getItem('pendingTourAction');
            if (pendingStr) {
                try {
                    const stored = JSON.parse(pendingStr);
                    if (
                        stored.tourId === tour.id &&
                        window.location.pathname + window.location.search ===
                            stored.returnUrl
                    ) {
                        sessionStorage.removeItem('pendingTourAction');
                        if (stored.action === 'like') handleLike();
                        else if (stored.action === 'book')
                            setIsBookingOpen(true);
                    }
                } catch {
                    sessionStorage.removeItem('pendingTourAction');
                }
            }
        }
    }, [auth?.user, tour.id, handleLike, shouldHideLandingTour]);

    if (shouldHideLandingTour) return null;

    const handleLikeClick = () => {
        if (!auth?.user) setPendingAction('like');
        else handleLike();
    };

    const handleCopy = () => {
        router.post(
            `/companies/${company.username}/dashboard/vendors/${tour.company?.username || ''}/tours/${tour.id}/copy`,
            {},
            { preserveScroll: true },
        );
    };

    const handleChat = async (targetId: number) => {
        try {
            setStartingChat(true);
            activateChatStack();
            setAttachment({
                type: 'tour',
                data: tour.id.toString(),
            });
            await startPrivateChat({
                type: 'company',
                id: targetId,
            });
        } finally {
            setStartingChat(false);
        }
    };

    const agentDocument = tour.agent_document || tour.agentDocument;
    const vendorDocumentUrl =
        tour.vendor_document_url ||
        (tour.document ? extractDocumentUrl(tour.document) : '');
    const agentDocumentUrl =
        tour.agent_document_url ||
        (agentDocument ? extractDocumentUrl(agentDocument) : '');
    const preferredItineraryDocumentUrl =
        tour.itinerary_document_url ||
        (tour.itinerary_document_source === 'agent'
            ? agentDocumentUrl
            : vendorDocumentUrl || agentDocumentUrl);
    const hasTourItinerary = Boolean(preferredItineraryDocumentUrl);

    const handleViewBrochure = (isPublic: boolean) => {
        if (!hasTourItinerary) return;
        if (preferredItineraryDocumentUrl) {
            window.open(
                preferredItineraryDocumentUrl,
                '_blank',
                'noopener,noreferrer',
            );
            return;
        }

        const url = isPublic
            ? `/brochure/${tour.company?.username}/${tour.id}`
            : `/companies/${company.username}/dashboard/vendors/${tour.company?.username || ''}/tours/${tour.id}/brochure`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleViewAgentCatalogBrochure = () => {
        if (!hasTourItinerary) return;

        window.open(
            `/companies/${company.username}/dashboard/vendors/${tour.company?.username || ''}/tours/${tour.id}/brochure`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    const handleShareFacebook = () => {
        if (!hasTourItinerary) return;
        const pdfUrl =
            preferredItineraryDocumentUrl ||
            `/companies/${company.username}/dashboard/vendors/${tour.company?.username || ''}/tours/${tour.id}/brochure`;
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pdfUrl)}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    let isVendorNameVisible = true;
    const isFalseLike = (val: any) =>
        val === false || val === '0' || val === 0 || val === 'false';

    if (
        isFalseLike(tour.show_vendor_name) ||
        isFalseLike(tour.pivot?.show_vendor_name) ||
        isFalseLike(partnership?.show_vendor_name)
    ) {
        isVendorNameVisible = false;
    }

    if (Array.isArray(tour.agents) && company?.id) {
        const currentAgent = tour.agents.find(
            (a: any) => Number(a.id) === Number(company.id),
        );
        if (
            currentAgent?.pivot &&
            isFalseLike(currentAgent.pivot.show_vendor_name)
        ) {
            isVendorNameVisible = false;
        }
    }

    const canCopy = partnership?.status === 'active';
    const hasCopied = Boolean(tour.has_copied);
    const bookingTour = selectedBookingTour ?? tour;
    const dashboardCompanyUsername = fromLogin
        ? (company?.username ?? getDashboardCompanyUsernameFromPath())
        : null;

    return (
        <>
            {isLandingPage ? (
                <PublicTourCard
                    tour={tour}
                    isVendorNameVisible={isVendorNameVisible}
                    isVendorInactive={
                        company?.type === 'agent' ? false : isVendorInactive
                    }
                    liked={liked}
                    onLike={handleLikeClick}
                    onViewBrochure={() => handleViewBrochure(true)}
                    onChat={() => handleChat(company?.id || tour.company_id)}
                    onBook={(nextTour: TourCardResource) => {
                        setSelectedBookingTour(nextTour);
                        setIsBookingOpen(true);
                    }}
                    startingChat={startingChat}
                    imagePriority={imagePriority}
                />
            ) : isVendorDashboard ? (
                <VendorTourCard
                    tour={tour}
                    isVendorNameVisible={isVendorNameVisible}
                    isVendorInactive={isVendorInactive}
                    imagePriority={imagePriority}
                    onViewBrochure={() => handleViewBrochure(false)}
                    onBook={(nextTour: TourCardResource) => {
                        setSelectedBookingTour(nextTour);
                        setIsBookingOpen(true);
                    }}
                />
            ) : isAgentDashboard && isOwnCatalog ? (
                <AgentMyTourCard
                    tour={tour}
                    isVendorNameVisible={isVendorNameVisible}
                    isVendorInactive={isVendorInactive}
                    imagePriority={imagePriority}
                    onViewBrochure={handleViewAgentCatalogBrochure}
                    onChat={() => handleChat(tour.company_id)}
                    onShareFB={handleShareFacebook}
                    onBook={(nextTour: TourCardResource) => {
                        setSelectedBookingTour(nextTour);
                        setIsBookingOpen(true);
                    }}
                    startingChat={startingChat}
                />
            ) : (
                <AgentVendorTourCard
                    tour={tour}
                    partnership={partnership}
                    isVendorNameVisible={isVendorNameVisible}
                    isVendorInactive={isVendorInactive}
                    imagePriority={imagePriority}
                    canCopy={canCopy}
                    hasCopied={hasCopied}
                    onCopy={handleCopy}
                    onViewBrochure={() => handleViewBrochure(false)}
                    onChat={() => handleChat(tour.company_id)}
                    startingChat={startingChat}
                />
            )}

            <AlertDialog
                open={!!pendingAction}
                onOpenChange={(open) => !open && setPendingAction(null)}
            >
                <AlertDialogContent className="rounded-3xl border-none dark:bg-slate-900">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold dark:text-white">
                            <FormattedMessage defaultMessage="Login Required" />
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            <FormattedMessage defaultMessage="Please login or register first to continue this action." />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold dark:bg-slate-800 dark:text-white">
                            <FormattedMessage defaultMessage="Cancel" />
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-xl font-bold px-6"
                            onClick={() => {
                                sessionStorage.setItem(
                                    'pendingTourAction',
                                    JSON.stringify({
                                        tourId: tour.id,
                                        action: pendingAction,
                                        returnUrl:
                                            window.location.pathname +
                                            window.location.search,
                                    }),
                                );
                                router.visit('/customers/login');
                            }}
                        >
                            <FormattedMessage defaultMessage="Login" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TourBookingModal
                isOpen={isBookingOpen}
                onClose={() => {
                    setIsBookingOpen(false);
                    setSelectedBookingTour(null);
                }}
                tour={bookingTour}
                bookingUrlResolver={(_, schedule) =>
                    dashboardCompanyUsername
                        ? `/companies/${encodeURIComponent(dashboardCompanyUsername)}/dashboard/bookings/create/${bookingTour.id}?date=${encodeURIComponent(schedule.departure_date)}`
                        : `/bookings/${bookingTour.id}/create?date=${encodeURIComponent(schedule.departure_date)}`
                }
                onRequireLogin={
                    !auth?.user ? () => setPendingAction('book') : undefined
                }
            />
        </>
    );
}
