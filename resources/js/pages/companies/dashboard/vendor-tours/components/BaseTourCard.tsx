import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { extractImageSrc } from '@/lib/utils';
import { Building2, MapPin } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface BaseTourCardProps {
  tour: any;
  isVendorNameVisible: boolean;
  isVendorInactive?: boolean;
  statusSection?: ReactNode;
  footerSection?: ReactNode;
  imageAction?: ReactNode;
}

export default function BaseTourCard({
  tour,
  isVendorNameVisible,
  isVendorInactive,
  statusSection,
  footerSection,
  imageAction,
}: BaseTourCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { src, srcSet } = extractImageSrc(tour.image as any);

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
      <Card className="group relative flex flex-col h-full border-none shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden bg-white dark:bg-slate-950 ring-1 ring-slate-100 dark:ring-slate-800">
        {isVendorInactive && (
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
            <div className="absolute top-[16px] right-[-28px] w-[120px] bg-yellow-400 dark:bg-yellow-500 text-black text-[9px] font-black py-0 text-center rotate-45 shadow-md border-b border-yellow-500 dark:border-yellow-600 tracking-tighter">
              VENDOR INACTIVE
            </div>
          </div>
        )}
        <div className="relative w-full aspect-[3/2] overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={src}
            srcSet={srcSet}
            alt={tour.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onClick={() => setShowInfo(true)}
          />
          {imageAction}
          <div className="absolute top-3 left-3 pointer-events-none">
            <Badge className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-slate-800 dark:text-slate-100 border-none text-[9px] px-1.5 py-0.5 font-bold shadow-sm">
              {tour.category?.name || 'Tour'}
            </Badge>
          </div>
        </div>

        <CardHeader className="px-3.5 pt-0 pb-0 space-y-0.5">
          {isVendorNameVisible && (
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <Building2 size={10} className="text-primary shrink-0" />
              <span className="truncate">{tour.company?.name || 'Vendor'}</span>
            </div>
          )}
          <CardTitle
            className="text-sm mb-0 pb-0 font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight cursor-pointer hover:text-primary transition-colors"
            onClick={() => setShowInfo(true)}
          >
            {tour.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-3.5 pb-0 py-0 pt-0 mt-0 flex-1 flex flex-col justify-end">
          <div className="flex flex-col mt-0 pt-0">
            {discountPrice ? (
              <>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 line-through decoration-red-400/60 font-medium leading-none mb-0.5">
                  {mainPrice}
                </span>
                <div className="flex items-center gap-0.5">
                  <span className="text-base font-black text-primary leading-none tracking-tight">
                    {discountPrice}
                  </span>
                  <Badge className="bg-red-500 text-white border-none text-[8px] h-3.5 px-1 font-black leading-none">
                    PROMO
                  </Badge>
                </div>
              </>
            ) : (
              <span className="text-base font-black text-primary leading-none tracking-tight mt-0 pt-0">
                {mainPrice}
              </span>
            )}
          </div>
        </CardContent>

        {statusSection}
        <CardFooter className="px-3.5 pb-3 pt-1 flex items-center gap-1.5">
          {footerSection}
        </CardFooter>
      </Card>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl dark:bg-slate-900"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{tour.name}</DialogTitle>
          <div className="flex h-full max-h-[calc(100dvh-2rem)] flex-col sm:max-h-[85vh]">
            <div className="relative h-56 sm:h-64 shrink-0 w-full bg-slate-100 dark:bg-slate-800">
              <img
                src={src}
                srcSet={srcSet}
                alt={tour.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-5 left-6 right-6">
                <Badge className="bg-blue-600 text-white border-none mb-3 px-2 py-0.5 text-xs">
                  Tour Overview
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-white line-clamp-2 leading-snug shadow-black/20">
                  {tour.name}
                </h2>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-1.5 justify-center">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Destination
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {tour.destination || 'Not specified'}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Price Starts From
                  </span>
                  {discountPrice ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 line-through">
                        {mainPrice}
                      </span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                        {discountPrice}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400 leading-none">
                      {mainPrice}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Detailed Description
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-loose whitespace-pre-wrap">
                  {tour.description || (
                    <span className="italic text-slate-400">
                      No comprehensive description provided for this tour.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
