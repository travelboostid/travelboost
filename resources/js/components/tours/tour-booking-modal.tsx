import type { TourResource } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { extractImageSrc } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
  addDays,
  format,
  isBefore,
  isSameMonth,
  isSameYear,
  max,
  min,
  parseISO,
  startOfToday,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarIcon } from 'lucide-react';

export type TourSchedule = {
  id: number;
  tour_id: number;
  departure_date: string;
  return_date: string | null;
  quota: number;
  price: number;
  agent_price: number;
  cutoff_date: string;
  is_active: boolean;
  note: string | null;
  booking_deadline_days?: number;
  availability?: {
    available: number | string;
    max_pax: number | string;
  };
};

type TourBookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tour: TourResource & { schedules?: TourSchedule[] };
  onRequireLogin?: () => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const getAvailabilityInfo = (quota: number) => {
  if (quota <= 0) {
    return { label: 'Availability: 0', variant: 'destructive' as const };
  }
  return { label: `Availability: ${quota}`, variant: 'secondary' as const };
};

export default function TourBookingModal({
  isOpen,
  onClose,
  tour,
  onRequireLogin,
}: TourBookingModalProps) {
  const schedules = tour.schedules ?? [];
  const tourImage = extractImageSrc(tour.image as any);
  const activeSchedules = schedules
    .filter((s) => {
      if (!s.is_active) return false;
      const departDate = parseISO(s.departure_date);
      const deadlineDate = addDays(
        startOfToday(),
        s.booking_deadline_days ?? 0,
      );
      return !isBefore(departDate, deadlineDate);
    })
    .sort(
      (a, b) =>
        parseISO(a.departure_date).getTime() -
        parseISO(b.departure_date).getTime(),
    );

  let dateRangeText = 'Schedules TBA';
  if (activeSchedules.length > 0) {
    const dates = activeSchedules.map((s) => parseISO(s.departure_date));
    const earliest = min(dates);
    const latest = max(dates);

    if (isSameMonth(earliest, latest) && isSameYear(earliest, latest)) {
      dateRangeText = format(earliest, 'MMM yyyy');
    } else if (isSameYear(earliest, latest)) {
      dateRangeText = `${format(earliest, 'MMM')} - ${format(latest, 'MMM yyyy')}`;
    } else {
      dateRangeText = `${format(earliest, 'MMM yyyy')} - ${format(latest, 'MMM yyyy')}`;
    }
  }

  const handleSelectDate = (schedule: TourSchedule) => {
    const availableCount = schedule.availability
      ? Number(schedule.availability.available)
      : schedule.quota;
    if (availableCount <= 0) return;

    if (onRequireLogin) {
      onClose();
      onRequireLogin();
      return;
    }

    onClose();
    router.visit(`/bookings/${tour.id}/create?date=${schedule.departure_date}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] max-h-[44rem] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl md:max-w-3xl">
        {/* Header Section (Centered) */}
        <div className="relative shrink-0 border-b bg-card px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="mb-2 aspect-[16/9] w-full max-w-[140px] overflow-hidden rounded-lg border bg-muted sm:max-w-[200px] md:max-w-[240px]">
              <img
                src={tourImage.src}
                srcSet={tourImage.srcSet || undefined}
                alt={tour.name}
                className="h-full w-full object-cover"
              />
            </div>
            <DialogTitle className="flex flex-col items-center justify-center text-center text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
              {tour.name}
            </DialogTitle>
            {tour.code && (
              <DialogDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {tour.code}
              </DialogDescription>
            )}
            {tour.destination && (
              <DialogDescription className="text-sm font-bold uppercase tracking-widest text-foreground">
                {tour.destination}
              </DialogDescription>
            )}
            <DialogDescription className="mt-1 text-sm font-medium uppercase tracking-widest text-muted-foreground/80 md:text-base">
              {dateRangeText}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Schedule List Section */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/5 px-4 py-3 sm:px-6">
          <div className="mb-3 text-center">
            <span className="text-sm font-medium tracking-wide text-foreground/70">
              Select Departure Date
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeSchedules.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border">
                  <CalendarIcon className="size-7 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  Departure schedule not available
                </p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-2.5 pb-6">
                {activeSchedules.map((schedule, index) => {
                  const departDate = parseISO(schedule.departure_date);
                  const returnDate = schedule.return_date
                    ? parseISO(schedule.return_date)
                    : addDays(departDate, Math.max(0, tour.duration_days - 1));

                  const dateRangeDisplay = `${format(departDate, 'dd MMM yyyy')} - ${format(returnDate, 'dd MMM yyyy')}`;
                  const availableCount = schedule.availability
                    ? Number(schedule.availability.available)
                    : schedule.quota;
                  const availability = getAvailabilityInfo(availableCount);
                  const isSoldOut = availableCount <= 0;

                  return (
                    <motion.button
                      key={schedule.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: index * 0.05,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => handleSelectDate(schedule)}
                      className={`group relative grid min-h-[4rem] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 text-left transition-all duration-300 sm:min-h-[4.25rem] sm:px-4 sm:py-3 ${
                        isSoldOut
                          ? 'cursor-not-allowed border-muted bg-muted/40 opacity-50 grayscale'
                          : 'cursor-pointer border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md hover:shadow-primary/5 active:scale-[0.99]'
                      }`}
                    >
                      <div className="min-w-0 pr-2 font-semibold leading-snug tracking-tight text-foreground">
                        <span className="block text-[15px] sm:text-base">
                          {dateRangeDisplay}
                        </span>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:min-w-[15rem] sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                        <span className="whitespace-nowrap text-sm font-bold text-primary sm:text-base md:text-lg">
                          {formatCurrency(schedule.price)}
                        </span>
                        <Badge
                          variant={availability.variant}
                          className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:px-3 sm:text-xs ${
                            isSoldOut
                              ? 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/20'
                              : ''
                          }`}
                        >
                          {availability.label}
                        </Badge>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
