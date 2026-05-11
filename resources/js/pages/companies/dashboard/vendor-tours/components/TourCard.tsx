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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { extractImageSrc } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { IconBrandFacebook, IconPdf } from '@tabler/icons-react';
import axios from 'axios';
import {
  Building2,
  HeartIcon,
  MessageSquareIcon,
  SaveIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
};

export default function TourCard({
  tour,
  type = 'agent',
  partnership,
  isOwnCatalog = false,
  fromLogin = false,
}: {
  tour: TourCardResource;
  type?: string;
  partnership?: any;
  isOwnCatalog?: boolean;
  fromLogin?: boolean;
}) {
  const { company, auth } = usePageSharedDataProps();
  const floatingChat = useFloatingChatWidgetContext();

  const [startingPrivateChat, setStartingPrivateChat] = useState(false);
  const [liked, setLiked] = useState(Boolean(tour.is_liked));
  const [showInfo, setShowInfo] = useState(false);
  const [pendingAction, setPendingAction] = useState<'like' | 'book' | null>(
    null,
  );
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const hasDocument = Boolean(tour.document);
  const canCopy = isOwnCatalog || partnership?.status === 'active';
  const isVendorInactive = tour.status === 'inactive';
  const hasBeenCopied = (tour as any).has_copied;

  const { src, srcSet } = extractImageSrc(tour.image as any);

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
              toggleLike();
            } else if (stored.action === 'book') {
              setIsBookingModalOpen(true);
            }
          }
        } catch (e) {
          console.error('Error parsing pendingTourAction:', e);
        }
      }
    }
  }, [auth?.user, tour.id]);

  const toggleLike = async () => {
    const response = await axios.post(`/me/tours/${tour.id}/like`);
    setLiked(Boolean(response.data.liked));
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

  const handleViewBrochure = () => {
    if (!hasDocument) return;
    window.open(
      viewBrochure({
        company: company.username,
        vendor: tour.company?.username || '',
        tour: tour.id,
      }).url,
      '_blank',
    );
  };

  const handleMessage = async () => {
    try {
      setStartingPrivateChat(true);
      floatingChat?.setAttachment({ type: 'tour', data: tour.id.toString() });
      await floatingChat?.startPrivateChat({
        type: 'company',
        id: tour.company_id,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setStartingPrivateChat(false);
    }
  };

  const handleShareFacebookPdf = () => {
    if (!hasDocument) return;
    const pdfUrl = viewBrochure({
      company: company.username,
      vendor: tour.company?.username || '',
      tour: tour.id,
    }).url;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pdfUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const formatPrice = (price: any) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(price));

  const mainPrice = formatPrice(tour.showprice);
  const discountPrice =
    tour.earlybird && Number(tour.earlybird) > 0
      ? formatPrice(tour.earlybird)
      : tour.promoprice && Number(tour.promoprice) > 0
        ? formatPrice(tour.promoprice)
        : tour.promote_price && Number(tour.promote_price) > 0
          ? formatPrice(tour.promote_price)
          : null;

  return (
    <>
      <Card className="group relative flex flex-col h-full border-none shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
        {isVendorInactive && (
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
            <div className="absolute top-[16px] right-[-28px] w-[120px] bg-yellow-400 text-black text-[9px] font-black py-1.5 text-center rotate-45 shadow-md border-b border-yellow-500 tracking-tighter">
              VENDOR INACTIVE
            </div>
          </div>
        )}

        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <img
            src={src}
            srcSet={srcSet}
            alt={tour.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
            onClick={() => setShowInfo(true)}
          />

          {!fromLogin && (
            <button
              type="button"
              onClick={() => {
                if (!auth?.user) {
                  setPendingAction('like');
                } else {
                  toggleLike();
                }
              }}
              className="absolute top-2 right-2 z-30 rounded-full bg-background/80 p-1.5 shadow transition hover:scale-110"
            >
              <HeartIcon
                size={18}
                className={
                  liked
                    ? 'fill-destructive text-destructive'
                    : 'text-muted-foreground'
                }
              />
            </button>
          )}

          <div className="absolute top-2 left-2 pointer-events-none">
            <Badge className="bg-white/95 backdrop-blur-sm text-slate-800 border-none text-[9px] font-bold shadow-sm">
              {tour.category?.name || 'Tour'}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 pb-1 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Building2 size={10} className="text-primary" />
            <span className="truncate">{tour.company?.name || 'Vendor'}</span>
          </div>
          <CardTitle
            className="text-sm font-black text-slate-800 line-clamp-1 leading-tight cursor-pointer hover:text-primary transition-colors"
            onClick={() => setShowInfo(true)}
          >
            {tour.name}
          </CardTitle>
          <CardDescription className="line-clamp-1 text-xs">
            {tour.destination}
          </CardDescription>
          {!fromLogin && (
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="-mt-0.5 w-fit text-left text-[11px] text-primary hover:underline"
            >
              more info...
            </button>
          )}
        </CardHeader>
        {/* ✅ HARGA */}
        <div className="px-6 pb-2">
          {formattedEarlybird ? (
            <div className="flex flex-col">
              {/* Harga normal dicoret */}
              <span className="text-sm text-muted-foreground">
                {formattedPrice}
              </span>

              {/* Harga earlybird */}
              <span className="w-fit rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                EARLY BIRD
              </span>
              <span className="text-xl font-bold text-primary">
                {formattedEarlybird}
              </span>
              {/* ✅ Earlybird Note */}
              {tour.earlybird_note && (
                <span className="text-sm text-muted-foreground">
                  {tour.earlybird_note}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-primary tracking-tight">
                    {discountPrice}
                  </span>
                  <Badge className="bg-red-500 text-white border-none text-[8px] h-3.5 px-1 font-black">
                    PROMO
                  </Badge>
                </div>
              </>
            ) : (
              <span className="text-base font-black text-primary tracking-tight">
                {mainPrice}
              </span>

              {/* Harga earlybird */}
              <span className="w-fit rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                PROMO
              </span>
              <span className="text-xl font-bold text-destructive">
                {formattedpromoprice}
              </span>
            </div>
          ) : formattedpromoteprice ? (
            <div className="flex flex-col">
              {/* Harga normal dicoret */}
              <span className="text-sm text-muted-foreground line-through">
                {formattedPrice}
              </span>

              {/* Harga earlybird */}
              {/* ✅ Earlybird Note */}
              {tour.promote_title && (
                <span className="w-fit rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                  {tour.promote_title}
                </span>
              )}
              <span className="text-xl font-bold text-primary">
                {formattedpromoteprice}
              </span>
            </div>
          )}
        </div>

        <CardFooter className="p-3 pt-1 flex items-center gap-1.5">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 rounded-xl bg-slate-100 h-9 border-none hover:bg-slate-200"
                disabled={!hasDocument}
                onClick={handleViewBrochure}
              >
                <IconPdf size={18} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-12 px-0 shrink-0"
                onClick={handleMessage}
                disabled={startingPrivateChat}
              >
                {startingPrivateChat ? (
                  <Spinner />
                ) : (
                  <MessageSquareIcon size={18} />
                )}
              </Button>
              <Button
                size="sm"
                className="flex-1 px-0 text-xs"
                onClick={() => setIsBookingModalOpen(true)}
              >
                VIEW SCHEDULE
              </Button>
            </div>
            <div className="flex w-full items-center justify-between mt-1">
              <div className="flex h-5 items-center justify-center rounded bg-muted px-2">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
                  LOGO
                </span>
              </div>
            </div>
          </CardFooter>
        ) : (
          <>
            <CardFooter className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-auto">
              <Button
                variant="secondary"
                disabled={!hasDocument}
                onClick={handleViewBrochure}
              >
                <IconPdf />
              </Button>

              {type === 'agent' && fromLogin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={(tour as any).has_copied}>
                      <SaveIcon />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Copy to Catalog</AlertDialogTitle>

                      <AlertDialogDescription>
                        Do you want copy to your Catalog?
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>

                      <AlertDialogAction onClick={handleCopy}>
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleMessage}
                    disabled={startingPrivateChat}
                    variant="secondary"
                    size="sm"
                    className="flex-1 rounded-xl bg-slate-100 h-9 border-none hover:bg-slate-200"
                  >
                    {startingPrivateChat ? (
                      <Spinner />
                    ) : (
                      <MessageSquareIcon size={18} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send Message</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShareFacebookPdf}
                    disabled={!hasDocument}
                    className="flex-1 rounded-xl bg-slate-100 h-9 border-none hover:bg-slate-200"
                  >
                    <IconBrandFacebook size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share to Facebook</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </CardFooter>
      </Card>

      {!fromLogin && (
        <Dialog open={showInfo} onOpenChange={setShowInfo}>
          <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {tour.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm mt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700">Destination: </span>
                <span className="text-slate-600">
                  {tour.destination || '—'}
                </span>
              </div>
              {tour.description && (
                <div>
                  <span className="font-bold text-slate-700">Description</span>
                  <p className="mt-1.5 text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {tour.description}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Login Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please login or register first to continue this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">
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
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tour={tour}
        onRequireLogin={
          !auth?.user ? () => setPendingAction('book') : undefined
        }
      />
    </>
  );
}
