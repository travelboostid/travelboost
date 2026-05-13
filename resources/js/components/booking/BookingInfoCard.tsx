import type { TourResource } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import {
  BOOKING_STATUS_CONFIG,
  formatCurrency,
  formatDate,
} from '@/constants/booking';
import type {
  BookingPricing,
  BookingStatusCode,
  VendorInfo,
} from '@/types/booking';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ClockIcon, MapPinIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 300, damping: 35 });
  const display = useTransform(spring, (v) => formatCurrency(Math.round(v)));
  const [text, setText] = useState(formatCurrency(0));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setText(v));
    return unsubscribe;
  }, [display]);

  return <motion.span>{text}</motion.span>;
}

type BookingInfoCardProps = {
  tour: TourResource;
  status: BookingStatusCode;
  bookingNumber: string | null;
  invoiceNumber: string | null;
  departureDate: string;
  vendor: VendorInfo;
  agentName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  pricing: BookingPricing;
  timeLeftSeconds: number;
  currentStep?: number;
  totalPaid?: number;
  timerStarted?: boolean;
};

export default function BookingInfoCard({
  tour,
  status,
  bookingNumber,
  invoiceNumber,
  departureDate,
  vendor,
  agentName,
  contactName,
  contactEmail,
  contactPhone,
  pricing,
  timeLeftSeconds,
  currentStep = 1,
  totalPaid = 0,
  timerStarted = false,
}: BookingInfoCardProps) {
  const normalizeStatus = (s: string): BookingStatusCode => {
    const map: Record<string, BookingStatusCode> = {
      'awaiting payment': 'waiting_payment',
      awaiting_payment: 'waiting_payment',
      'waiting payment approval': 'waiting_payment_approval',
      waiting_payment_approval: 'waiting_payment_approval',
      'down payment': 'down_payment',
      'full payment': 'full_payment',
      'waiting list': 'waiting_list',
      waiting_list: 'waiting_list',
      'booking reserved': 'booking_reserved',
      booking_reserved: 'booking_reserved',
      'manual reserved': 'manual_reserved',
      manual_reserved: 'manual_reserved',
      cancelled: 'cancel',
      refunded: 'refund',
    };
    const key = s.toLowerCase();
    return map[key] ?? (key as BookingStatusCode);
  };

  const statusConfig =
    BOOKING_STATUS_CONFIG[normalizeStatus(status)] ??
    BOOKING_STATUS_CONFIG.reserved;

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const timerColor =
    timeLeftSeconds < 300
      ? 'text-destructive animate-pulse'
      : timeLeftSeconds < 600
        ? 'text-primary'
        : 'text-primary';

  return (
    <div className="rounded-xl border bg-card p-3 text-sm shadow-sm ring-1 ring-primary/5">
      {/* Tour Header & Countdown */}
      <div className="mb-3 flex flex-col justify-between gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-lg font-bold leading-tight text-foreground">
            {tour.code || 'N/A'} - {tour.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
              <ClockIcon className="size-3.5 stroke-[2.5]" />
              <span>{tour.duration_days} days</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
              <MapPinIcon className="size-3.5 stroke-[2.5]" />
              <span>{tour.destination}</span>
            </div>
          </div>
        </div>
        {(timerStarted || currentStep >= 2) && (
          <div
            className="flex flex-col text-left sm:items-end sm:text-right"
            role="timer"
            aria-live="polite"
            aria-label={`Time remaining: ${formatTime(timeLeftSeconds)}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Time Left
            </span>
            <div
              className={`mt-1 flex items-center gap-1.5 font-mono text-xl font-bold leading-none ${timerColor}`}
            >
              <ClockIcon className="size-5" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Booking Info */}
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Booking Info
          </p>
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="flex justify-between md:block">
              <span className="text-muted-foreground md:mr-2">
                Booking Number:
              </span>{' '}
              <span className="font-semibold text-foreground">
                {bookingNumber ?? 'TBA (Draft)'}
              </span>
            </p>
            <p className="flex justify-between md:block">
              <span className="text-muted-foreground md:mr-2">
                Booking Time:
              </span>{' '}
              <span className="font-semibold text-foreground">
                {new Date().toLocaleString('id-ID')}
              </span>
            </p>
            <div className="mt-1 flex items-center justify-between md:justify-start">
              <span className="text-muted-foreground md:mr-2">Status:</span>
              <Badge
                variant="secondary"
                className={`px-2 py-0 text-[10px] font-bold uppercase tracking-wider ${statusConfig.bgClass} ${statusConfig.textClass}`}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Service Providers */}
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Service Providers
          </p>
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="flex justify-between md:block">
              <span className="text-muted-foreground md:mr-2">Vendor:</span>{' '}
              <span className="font-semibold text-foreground">
                {vendor.name}
              </span>
            </p>
            <p className="flex justify-between md:block">
              <span className="text-muted-foreground md:mr-2">Agent:</span>{' '}
              <span className="font-semibold text-foreground">{agentName}</span>
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="border-t border-border/50 pt-2 md:col-span-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Schedule Details
          </p>
          <p className="text-xs sm:text-sm">
            <span className="text-muted-foreground md:mr-2">
              Departure Date:
            </span>{' '}
            <span className="font-semibold text-foreground">
              {departureDate ? formatDate(departureDate) : '-'}
            </span>
          </p>
        </div>

        {/* Guest Info */}
        <div className="border-t border-border/50 pt-2 md:col-span-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Guest Information
          </p>
          <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm md:grid-cols-3">
            <p className="truncate">
              <span className="text-muted-foreground md:mr-2">Name:</span>{' '}
              <span className="font-semibold">{contactName || '-'}</span>
            </p>
            <p className="truncate">
              <span className="text-muted-foreground md:mr-2">Email:</span>{' '}
              <span className="font-semibold">{contactEmail || '-'}</span>
            </p>
            <p className="truncate">
              <span className="text-muted-foreground md:mr-2">Phone:</span>{' '}
              <span className="font-semibold">{contactPhone || '-'}</span>
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t border-border/50 pt-2 md:col-span-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm md:grid-cols-2">
            <p>
              <span className="text-muted-foreground md:mr-2">
                Total Price:
              </span>{' '}
              <span className="font-bold text-foreground">
                <AnimatedPrice value={pricing.subtotalGuests} />
              </span>
            </p>
            <p>
              <span className="text-muted-foreground md:mr-2">
                Total Payment:
              </span>{' '}
              <span className="font-bold text-primary">
                <AnimatedPrice value={totalPaid ?? 0} />
              </span>
            </p>
          </div>
        </div>

        {/* Invoice */}
        <div className="border-t border-border/50 pt-2 md:col-span-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Invoice
          </p>
          <p className="text-xs sm:text-sm">
            <span className="text-muted-foreground md:mr-2">
              Invoice Number:
            </span>{' '}
            {invoiceNumber ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="font-bold text-primary"
              >
                {invoiceNumber}
              </motion.span>
            ) : (
              <span className="font-semibold text-muted-foreground/60">-</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
