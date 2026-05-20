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
import { Button } from '@/components/ui/button';
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
import { IconPdf } from '@tabler/icons-react';
import { InfoIcon, MessageSquareIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';
import BaseTourCard from './BaseTourCard';

const formatCurrency = (value: any, currency = 'IDR') =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value: any) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
};

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getPriceCategoryName = (price: any) =>
  price.price_category?.name ||
  price.priceCategory?.name ||
  price.category?.name ||
  price.room_type?.name ||
  (price.price_category_id
    ? `Category #${price.price_category_id}`
    : 'Category');

const getCommissionLabel = (price: any, currency = 'IDR') => {
  if (Number(price.commission_rate || 0) > 0) {
    const commissionRate = Number(price.commission_rate);
    const commissionValue = (Number(price.price || 0) * commissionRate) / 100;

    return `${formatCurrency(commissionValue, currency)} (${commissionRate}%)`;
  }

  if (Number(price.commission || 0) > 0) {
    return formatCurrency(price.commission, currency);
  }

  return '-';
};

export default function AgentVendorTourCard({
  tour,
  isVendorNameVisible,
  canCopy,
  hasCopied,
  onCopy,
  onViewBrochure,
  onChat,
  startingChat,
}: any) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const isVendorInactive = String(tour.status).toLowerCase() !== 'active';
  const bookingDeadlineDays = Number(
    tour.company?.company_setting?.booking_deadline ??
      tour.company?.companySetting?.booking_deadline ??
      0,
  );
  const cutoffDate = toDateString(addDays(new Date(), bookingDeadlineDays));
  const schedules = Array.isArray(tour.schedules)
    ? tour.schedules.filter(
        (schedule: any) =>
          schedule.departure_date && schedule.departure_date >= cutoffDate,
      )
    : [];
  const currency = tour.currency || 'IDR';

  return (
    <>
      <BaseTourCard
        tour={tour}
        isVendorNameVisible={isVendorNameVisible}
        isVendorInactive={isVendorInactive}
        statusSection={
          <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800/60">
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
          </div>
        }
        footerSection={
          <>
            <AlertDialog>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="flex-1 flex">
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className={`w-full rounded-xl h-9 shadow-sm transition-all ${isVendorInactive ? 'bg-red-500 text-white hover:bg-red-600' : hasCopied ? 'bg-primary text-primary-foreground opacity-40 grayscale' : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'}`}
                        disabled={hasCopied || isVendorInactive || !canCopy}
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
              <AlertDialogContent className="rounded-3xl border-none dark:bg-slate-900">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold dark:text-white">
                    Add to Catalog
                  </AlertDialogTitle>
                  <AlertDialogDescription className="dark:text-slate-400">
                    Copy this product to your personal catalog?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold dark:bg-slate-800 dark:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onCopy}
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
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                  onClick={() => setIsInfoOpen(true)}
                >
                  <InfoIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Information</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                  disabled={!tour.document}
                  onClick={onViewBrochure}
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
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                  disabled={startingChat}
                  onClick={onChat}
                >
                  {startingChat ? <Spinner /> : <MessageSquareIcon size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send Message to Vendor</p>
              </TooltipContent>
            </Tooltip>
          </>
        }
      />

      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-[64rem] overflow-hidden rounded-3xl border-none p-0 dark:bg-slate-900 lg:max-w-[68rem]"
          aria-describedby={undefined}
        >
          <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left dark:border-slate-800 sm:px-6">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Tour Information
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto p-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {tour.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {tour.code || 'No tour code'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Destination
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {tour.destination || '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Duration
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {tour.duration_days ? `${tour.duration_days} days` : '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Normal Price in Catalog
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(tour.showprice, currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                    Schedule & Pricing
                  </h4>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {schedules.length} Schedule
                    {schedules.length === 1 ? '' : 's'}
                  </span>
                </div>

                {schedules.length > 0 ? (
                  <div className="space-y-3">
                    {schedules.map((schedule: any, scheduleIndex: number) => {
                      const prices = Array.isArray(schedule.prices)
                        ? schedule.prices
                        : [];
                      const availability = schedule.availability || {};

                      return (
                        <div
                          key={schedule.id || scheduleIndex}
                          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatDate(schedule.departure_date)} -{' '}
                                {formatDate(schedule.return_date)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Departure schedule
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                                <p className="text-[10px] font-semibold uppercase text-slate-400">
                                  Max Pax
                                </p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  {Number(availability.max_pax || 0)}
                                </p>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                                <p className="text-[10px] font-semibold uppercase text-slate-400">
                                  Availability
                                </p>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  {Number(availability.available || 0)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(130px,0.65fr)_minmax(180px,0.75fr)] bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:bg-slate-900 sm:grid">
                              <span>Category</span>
                              <span>Price</span>
                              <span>Commission</span>
                            </div>
                            {prices.length > 0 ? (
                              prices.map((price: any, priceIndex: number) => (
                                <div
                                  key={price.id || priceIndex}
                                  className="grid gap-2 border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(130px,0.65fr)_minmax(180px,0.75fr)] sm:items-center"
                                >
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                      Category
                                    </p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                      {getPriceCategoryName(price)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                      Price
                                    </p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                      {formatCurrency(price.price, currency)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase text-slate-400 sm:hidden">
                                      Commission
                                    </p>
                                    <p className="font-semibold text-primary">
                                      {getCommissionLabel(price, currency)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="border-t border-slate-100 px-4 py-4 text-sm font-medium text-slate-400 dark:border-slate-800">
                                No pricing category available.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-medium text-slate-400 dark:border-slate-800">
                    No schedule available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
