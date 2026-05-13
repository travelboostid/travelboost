import {
  copy,
  viewBrochure,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/VendorTourCatalogController';
import type { TourResource } from '@/api/model';
import { useFloatingChatWidgetContext } from '@/components/chat/state';
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
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
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

export default function TourCard({
  tour,
  type = 'agent',
  partnership,
  isOwnCatalog = false,
  fromLogin = true,
}: {
  tour: TourCardResource;
  type?: string;
  partnership?: any;
  isOwnCatalog?: boolean;
  fromLogin?: boolean;
}) {
  const { company, auth } = usePageSharedDataProps();
  const floatingChat = useFloatingChatWidgetContext();

  const [startingChat, setStartingChat] = useState(false);
  const [liked, setLiked] = useState(Boolean(tour.is_liked));
  const [pendingAction, setPendingAction] = useState<'like' | 'book' | null>(
    null,
  );
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const isLandingPage = !fromLogin;
  const isAgentDashboard = fromLogin && type === 'agent';
  const isVendorDashboard = fromLogin && type === 'vendor';

  const parseStatus = (statusObj: any): string | undefined => {
    if (statusObj === undefined || statusObj === null) return undefined;
    if (typeof statusObj === 'object') {
      return String(statusObj.value || statusObj.name || '').toLowerCase();
    }
    return String(statusObj).toLowerCase();
  };

  const vendorStatusStr = parseStatus(tour.status);
  const isVendorActive = vendorStatusStr === 'active';
  const isVendorInactive = !isVendorActive;

  let agentStatusStr: string | undefined = undefined;

  if (tour.agent_status !== undefined && tour.agent_status !== null) {
    agentStatusStr = parseStatus(tour.agent_status);
  } else if (tour.pivot?.status !== undefined && tour.pivot?.status !== null) {
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

  if (isLandingPage) {
    if (company?.type === 'agent' && !isAgentActive) return null;
    if (company?.type === 'vendor' && !isVendorActive) return null;
  }

  useEffect(() => {
    if (auth?.user) {
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
            else if (stored.action === 'book') setIsBookingOpen(true);
          }
        } catch (e) {}
      }
    }
  }, [auth?.user, tour.id]);

  const handleLike = async () => {
    try {
      const response = await axios.post(`/me/tours/${tour.id}/like`);
      setLiked(Boolean(response.data.liked));
    } catch (e) {}
  };

  const handleLikeClick = () => {
    if (!auth?.user) setPendingAction('like');
    else handleLike();
  };

  const handleCopy = () => {
    router.post(
      copy({
        company: company.username,
        vendor: tour.company?.username || '',
        tour: tour.id,
      }),
      {},
      { preserveScroll: true },
    );
  };

  const handleChat = async (targetId: number) => {
    try {
      setStartingChat(true);
      floatingChat?.setAttachment({ type: 'tour', data: tour.id.toString() });
      await floatingChat?.startPrivateChat({ type: 'company', id: targetId });
    } finally {
      setStartingChat(false);
    }
  };

  const handleViewBrochure = (isPublic: boolean) => {
    if (!tour.document) return;
    const url = isPublic
      ? `/brochure/${tour.company?.username}/${tour.id}`
      : viewBrochure({
          company: company.username,
          vendor: tour.company?.username || '',
          tour: tour.id,
        }).url;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    if (!tour.document) return;
    const pdfUrl = viewBrochure({
      company: company.username,
      vendor: tour.company?.username || '',
      tour: tour.id,
    }).url;
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
          onBook={() => setIsBookingOpen(true)}
          startingChat={startingChat}
        />
      ) : isVendorDashboard ? (
        <VendorTourCard
          tour={tour}
          isVendorNameVisible={isVendorNameVisible}
          isVendorInactive={isVendorInactive}
          onViewBrochure={() => handleViewBrochure(false)}
        />
      ) : isAgentDashboard && isOwnCatalog ? (
        <AgentMyTourCard
          tour={tour}
          isVendorNameVisible={isVendorNameVisible}
          isVendorInactive={isVendorInactive}
          onViewBrochure={() => handleViewBrochure(false)}
          onChat={() => handleChat(tour.company_id)}
          onShareFB={handleShareFacebook}
          startingChat={startingChat}
        />
      ) : (
        <AgentVendorTourCard
          tour={tour}
          isVendorNameVisible={isVendorNameVisible}
          isVendorInactive={isVendorInactive}
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
              Login Required
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Please login or register first to continue this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold dark:bg-slate-800 dark:text-white">
              Cancel
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
                      window.location.pathname + window.location.search,
                  }),
                );
                router.visit('/customers/login');
              }}
            >
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TourBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        tour={tour}
        onRequireLogin={
          !auth?.user ? () => setPendingAction('book') : undefined
        }
      />
    </>
  );
}
