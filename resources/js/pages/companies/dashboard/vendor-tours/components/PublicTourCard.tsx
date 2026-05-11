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
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';
import { IconCalendarEvent, IconPdf } from '@tabler/icons-react';
import axios from 'axios';
import { HeartIcon, MessageSquareIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import BaseTourCard from './BaseTourCard';

export default function PublicTourCard({
  tour,
  catalogOwner,
  isVendorNameVisible,
  isVendorInactive,
  liked: passedLiked,
  onLike,
  onViewBrochure,
  onChat,
  onBook,
  startingChat: passedStartingChat,
}: any) {
  const { auth, company } = usePageSharedDataProps();
  const floatingChat = useFloatingChatWidgetContext();
  const activeOwner = catalogOwner || company;

  const [internalStartingChat, setInternalStartingChat] = useState(false);
  const [internalLiked, setInternalLiked] = useState(Boolean(tour.is_liked));
  const [pendingAction, setPendingAction] = useState<'like' | 'book' | null>(
    null,
  );
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const isControlled = isVendorNameVisible !== undefined;
  const startingChat =
    passedStartingChat !== undefined
      ? passedStartingChat
      : internalStartingChat;
  const liked = passedLiked !== undefined ? passedLiked : internalLiked;
  const vendorNameVisible =
    isVendorNameVisible !== undefined ? isVendorNameVisible : true;

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
            if (stored.action === 'like') {
              if (onLike) onLike();
              else handleLike();
            } else if (stored.action === 'book') {
              if (onBook) onBook();
              else setIsBookingOpen(true);
            }
          }
        } catch (e) {}
      }
    }
  }, [auth?.user, tour.id, onLike, onBook]);

  const handleLike = async () => {
    try {
      const response = await axios.post(`/me/tours/${tour.id}/like`);
      setInternalLiked(Boolean(response.data.liked));
    } catch (e) {}
  };

  const handleLikeClick = () => {
    if (onLike) {
      onLike();
      return;
    }
    if (!auth?.user) setPendingAction('like');
    else handleLike();
  };

  const handleChatInternal = async (targetId: number) => {
    try {
      setInternalStartingChat(true);
      floatingChat?.setAttachment({ type: 'tour', data: tour.id.toString() });
      await floatingChat?.startPrivateChat({ type: 'company', id: targetId });
    } finally {
      setInternalStartingChat(false);
    }
  };

  const handleChatClick = () => {
    if (onChat) {
      onChat();
      return;
    }
    handleChatInternal(activeOwner?.id || tour.company_id);
  };

  const handleViewBrochureInternal = () => {
    if (!tour.document) return;
    const url = `/brochure/${tour.company?.username}/${tour.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewBrochureClick = () => {
    if (onViewBrochure) onViewBrochure();
    else handleViewBrochureInternal();
  };

  const handleBookClick = () => {
    if (onBook) onBook();
    else setIsBookingOpen(true);
  };

  return (
    <>
      <BaseTourCard
        tour={tour}
        isVendorNameVisible={vendorNameVisible}
        isVendorInactive={isVendorInactive}
        imageAction={
          <button
            type="button"
            onClick={handleLikeClick}
            className="absolute top-2 right-2 z-30 rounded-full bg-white/80 dark:bg-slate-800/80 p-1.5 shadow transition hover:scale-110"
          >
            <HeartIcon
              size={18}
              className={
                liked
                  ? 'fill-red-500 text-red-500'
                  : 'text-slate-400 dark:text-slate-300'
              }
            />
          </button>
        }
        footerSection={
          <>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                  disabled={!tour.document}
                  onClick={handleViewBrochureClick}
                >
                  <IconPdf size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Brochure</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                  disabled={startingChat}
                  onClick={handleChatClick}
                >
                  {startingChat ? <Spinner /> : <MessageSquareIcon size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send Message to Agent</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="default"
              size="sm"
              className="flex-1 rounded-xl h-9 bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-transform"
              onClick={handleBookClick}
            >
              <IconCalendarEvent size={18} />
              <span className="hidden sm:inline">VIEW SCHEDULE</span>
            </Button>
          </>
        }
      />

      {!isControlled && (
        <>
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
      )}
    </>
  );
}
