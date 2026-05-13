import { Badge } from '@/components/ui/badge';
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
import { extractImageSrc } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { ReactNode, useState } from 'react';

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
            <div className="absolute top-[16px] right-[-28px] w-[120px] bg-yellow-400 dark:bg-yellow-500 text-black text-[9px] font-black py-1.5 text-center rotate-45 shadow-md border-b border-yellow-500 dark:border-yellow-600 tracking-tighter">
              VENDOR INACTIVE
            </div>
          </div>
        )}
        <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={src}
            srcSet={srcSet}
            alt={tour.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
            onClick={() => setShowInfo(true)}
          />
          {imageAction}
          <div className="absolute top-2 left-2 pointer-events-none">
            <Badge className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-slate-800 dark:text-slate-100 border-none text-[9px] font-bold shadow-sm">
              {tour.category?.name || 'Tour'}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 pb-1 space-y-1">
          {isVendorNameVisible && (
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <Building2 size={10} className="text-primary" />
              <span className="truncate">{tour.company?.name || 'Vendor'}</span>
            </div>
          )}
          <CardTitle
            className="text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-1 leading-tight cursor-pointer hover:text-primary transition-colors"
            onClick={() => setShowInfo(true)}
          >
            {tour.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 py-2 flex-1">
          <div className="flex flex-col">
            {discountPrice ? (
              <>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 line-through decoration-red-400/60 font-medium">
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

        {statusSection}
        <CardFooter className="p-3 pt-2 flex items-center gap-1.5">
          {footerSection}
        </CardFooter>
      </Card>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold dark:text-white">
              {tour.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm mt-2">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Destination:{' '}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {tour.destination || '—'}
              </span>
            </div>
            {tour.description && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Description
                </span>
                <p className="mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {tour.description}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
