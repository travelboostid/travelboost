import {
  copy,
  viewBrochure,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/VendorTourCatalogController';
import type { TourResource } from '@/api/model';
import { useFloatingChatWidgetContext } from '@/components/chat/state';
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
import { Spinner } from '@/components/ui/spinner';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { IconBrandFacebook, IconPdf } from '@tabler/icons-react';
import { Building2, MessageSquareIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../../components/ui/tooltip';

export default function TourCard({
  tour,
  type = 'agent',
  partnership,
  isOwnCatalog = false,
}: {
  tour: TourResource;
  type?: string;
  partnership?: any;
  isOwnCatalog?: boolean;
}) {
  const { company } = usePageSharedDataProps();
  const floatingChat = useFloatingChatWidgetContext();
  const [startingPrivateChat, setStartingPrivateChat] = useState(false);
  const hasDocument = Boolean(tour.document);
  const canCopy = isOwnCatalog || partnership?.status === 'active';
  const isVendorInactive = tour.status === 'inactive';
  const hasBeenCopied = (tour as any).has_copied;

  const { src, srcSet } = extractImageSrc(tour.image as any);

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
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2">
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
        <CardTitle className="text-sm font-black text-slate-800 line-clamp-1 leading-tight">
          {tour.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 py-2 flex-1">
        <div className="flex flex-col">
          {discountPrice ? (
            <>
              <span className="text-[10px] text-muted-foreground line-through decoration-red-400/60 font-medium">
                {mainPrice}
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
          )}
        </div>
      </CardContent>

      <div className="px-4 py-2 border-t border-slate-50 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-400 uppercase">
            Vendor Status
          </span>
          <span
            className={`text-[9px] font-black uppercase ${tour.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {tour.status}
          </span>
        </div>
        {hasBeenCopied && (
          <div className="flex items-center justify-between border-t border-slate-50 pt-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              My Catalog Status
            </span>
            <span
              className={`text-[9px] font-black uppercase ${(tour as any).agent_status === 'active' ? 'text-blue-600' : 'text-red-600'}`}
            >
              {(tour as any).agent_status}
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
          </TooltipTrigger>
          <TooltipContent>
            <p>View Brochure</p>
          </TooltipContent>
        </Tooltip>

        {!isOwnCatalog && (
          <>
            <AlertDialog>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="flex-1 flex">
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className={`w-full rounded-xl h-9 shadow-sm transition-all ${hasBeenCopied || isVendorInactive ? 'opacity-40 grayscale' : 'hover:scale-105 active:scale-95'}`}
                        disabled={hasBeenCopied || isVendorInactive || !canCopy}
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
              <AlertDialogContent className="rounded-3xl border-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">
                    Add to Catalog
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Copy this product to your personal catalog?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCopy}
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
  );
}
