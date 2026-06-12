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
import { FormattedMessage } from 'react-intl';

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
            <Card className="group relative flex h-full min-w-0 flex-col gap-0 overflow-hidden rounded-2xl border-none bg-white py-0 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-950 dark:ring-slate-800">
                {isVendorInactive && (
                    <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
                        <div className="absolute top-[16px] right-[-28px] w-[120px] bg-yellow-400 dark:bg-yellow-500 text-black text-[9px] font-black py-0 text-center rotate-45 shadow-md border-b border-yellow-500 dark:border-yellow-600 tracking-tighter">
                            <FormattedMessage defaultMessage="VENDOR INACTIVE" />
                        </div>
                    </div>
                )}
                <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                        src={src}
                        srcSet={srcSet}
                        alt={tour.name}
                        className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
                        onClick={() => setShowInfo(true)}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    {imageAction}
                </div>

                <CardHeader className="min-w-0 space-y-2 px-4 pt-4 pb-2 sm:px-5">
                    {isVendorNameVisible && (
                        <div className="mb-0 flex min-w-0 items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                            <Building2
                                size={10}
                                className="text-primary shrink-0"
                            />
                            <span className="truncate">
                                {tour.company?.name || 'Vendor'}
                            </span>
                        </div>
                    )}
                    <CardTitle
                        className="mt-0 mb-0 line-clamp-2 min-h-[2.45rem] cursor-pointer pb-0 text-sm leading-snug font-extrabold break-words text-slate-800 transition-colors hover:text-primary dark:text-slate-100"
                        onClick={() => setShowInfo(true)}
                    >
                        {tour.name}
                    </CardTitle>
                </CardHeader>

                <CardContent className="mt-0 flex min-w-0 flex-col px-4 pt-0 pb-0 sm:px-5">
                    <div className="mt-0 flex min-w-0 flex-col gap-1 pt-0">
                        {discountPrice ? (
                            <>
                                <span className="mt-1 mb-0.5 text-[10px] leading-none font-medium text-slate-500 line-through decoration-red-400/60 dark:text-slate-400">
                                    {mainPrice}
                                </span>
                                <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
                                    <span className="min-w-0 max-w-full text-[clamp(0.875rem,1.35vw,1rem)] leading-tight font-black break-words text-primary">
                                        {discountPrice}
                                    </span>
                                    <Badge className="h-3.5 shrink-0 border-none bg-red-500 px-1 text-[8px] leading-none font-black text-white">
                                        <FormattedMessage defaultMessage="PROMO" />
                                    </Badge>
                                </div>
                            </>
                        ) : (
                            <span className="mt-0 min-w-0 pt-0 text-[clamp(0.875rem,1.35vw,1rem)] leading-tight font-black break-words text-primary">
                                {mainPrice}
                            </span>
                        )}
                    </div>
                </CardContent>

                <div className="mt-auto mb-2 pb-1">
                    <CardFooter className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-0 sm:px-5">
                        {footerSection}
                    </CardFooter>
                    {statusSection}
                </div>
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
                                    <FormattedMessage defaultMessage="Tour Overview" />
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
                                            <FormattedMessage defaultMessage="Destination" />
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        {tour.destination || (
                                            <FormattedMessage defaultMessage="Not specified" />
                                        )}
                                    </span>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        <FormattedMessage defaultMessage="Price Starts From" />
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
                                    <FormattedMessage defaultMessage="Detailed Description" />
                                </h3>
                                <div className="text-sm text-slate-600 dark:text-slate-400 leading-loose whitespace-pre-wrap">
                                    {tour.description || (
                                        <span className="italic text-slate-400">
                                            <FormattedMessage defaultMessage="No comprehensive description provided for this tour." />
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
