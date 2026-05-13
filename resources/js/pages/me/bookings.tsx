import TenantLayout from '@/components/layouts/tenant-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/constants/booking';
import { cn, extractImageSrc } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  HeartIcon,
  type LucideIcon,
  MapPinIcon,
  RefreshCwIcon,
  SearchCheckIcon,
} from 'lucide-react';
import { useState } from 'react';

type BookingItem = {
  id: number;
  booking_number: string;
  status: string;
  departure_date: string | null;
  grand_total: string | number;
  tour: {
    id: number;
    code?: string | null;
    name: string;
    destination?: string | null;
    duration_days?: number | null;
    image?: unknown;
  } | null;
  vendor: { id: number; name: string } | null;
};

type TourItem = {
  id: number;
  name: string;
  destination?: string | null;
  code?: string | null;
  duration_days?: number | null;
  showprice?: string | number | null;
  image?: unknown;
  company?: { id: number; name: string } | null;
  schedules?: unknown[];
};

type Paginated<T> = {
  data: T[];
};

type PageProps = {
  auth: { user: { id: number; name: string } | null };
  bookings: Paginated<BookingItem> | null;
  favorites: Paginated<TourItem> | null;
  activeTab: 'favorites' | 'current' | 'history';
};

type BookingAction = {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
};

const TABS = [
  { key: 'favorites', label: 'Favorites', icon: HeartIcon },
  { key: 'current', label: 'Current Bookings', icon: CalendarIcon },
  { key: 'history', label: 'History', icon: ClockIcon },
] as const;

const STATUS_STYLES: Record<string, string> = {
  'awaiting payment':
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'waiting payment approval':
    'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'booking reserved':
    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'down payment':
    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'full payment':
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  expired: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  refunded:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'waiting list':
    'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
};

const STATUS_LABELS: Record<string, string> = {
  'awaiting payment': 'Awaiting Payment',
  'waiting payment approval': 'Waiting Payment Approval',
  'booking reserved': 'Booking Reserved',
  'down payment': 'Down Payment',
  'full payment': 'Full Payment',
  expired: 'Expired',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  'waiting list': 'Waiting List',
};

function normalizeStatus(status: string) {
  return status.toLowerCase().replaceAll('_', ' ');
}

function bookingCreateHref(
  booking: BookingItem,
  options: { reuseBookingNumber?: boolean } = {},
) {
  if (!booking.tour || !booking.departure_date) {
    return null;
  }

  const params = new URLSearchParams({
    date: dayjs(booking.departure_date).format('YYYY-MM-DD'),
  });
  if (options.reuseBookingNumber) {
    params.set('booking_number', booking.booking_number);
  }

  return `/bookings/${booking.tour.id}/create?${params.toString()}`;
}

function getBookingAction(
  booking: BookingItem,
  activeTab: PageProps['activeTab'],
): BookingAction | null {
  const status = normalizeStatus(booking.status);
  const href = bookingCreateHref(booking);

  if (status === 'awaiting payment' && href) {
    return {
      label: 'Continue Booking',
      icon: ArrowRightIcon,
      href: bookingCreateHref(booking, { reuseBookingNumber: true }) ?? href,
    };
  }

  if (status === 'booking reserved' && href) {
    return {
      label: 'Continue Booking',
      icon: ArrowRightIcon,
      href: bookingCreateHref(booking, { reuseBookingNumber: true }) ?? href,
    };
  }

  if (status === 'expired' && href) {
    return {
      label: 'Reorder',
      icon: RefreshCwIcon,
      onClick: () =>
        router.post(
          `/bookings/${booking.id}/reorder`,
          {},
          {
            preserveScroll: true,
          },
        ),
    };
  }

  if (status === 'down payment' && href) {
    return { label: 'Pay Remaining Balance', icon: CreditCardIcon, href };
  }

  if (status === 'full payment') {
    return {
      label: 'Invoice',
      icon: FileTextIcon,
      onClick: () => window.print(),
    };
  }

  if (status === 'waiting payment approval') {
    return {
      label: 'Check Payment Status',
      icon: SearchCheckIcon,
      onClick: () =>
        router.get(
          '/mybookings',
          { tab: activeTab },
          { preserveScroll: true, preserveState: true, replace: true },
        ),
    };
  }

  return null;
}

export default function Page({
  auth,
  bookings,
  favorites,
  activeTab: initialActiveTab,
}: PageProps) {
  const params = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(
    (params.get('tab') as PageProps['activeTab'] | null) ??
      initialActiveTab ??
      'current',
  );

  const bookingCount = bookings?.data.length ?? 0;
  const favoriteCount = favorites?.data.length ?? 0;
  const visibleCount = activeTab === 'favorites' ? favoriteCount : bookingCount;

  const switchTab = (tab: PageProps['activeTab']) => {
    setActiveTab(tab);
    router.get('/mybookings', { tab }, { preserveState: true, replace: true });
  };

  if (!auth.user) {
    return (
      <TenantLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <h2 className="text-xl font-semibold">My Bookings</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Please log in or create an account to view your bookings, saved
            favorites, and travel history.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/customers/login">Log In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/customers/register">Register</Link>
            </Button>
          </div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-linear-to-b from-background via-background to-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Travel Desk
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  My Bookings
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Track saved tours, active bookings, payment progress, and
                  completed departures in one place.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                <SummaryTile label="Visible items" value={visibleCount} />
                <SummaryTextTile label="Signed in as" value={auth.user.name} />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-center gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchTab(tab.key)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                    isActive
                      ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'favorites' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {(favorites?.data ?? []).map((tour) => (
                <FavoriteCard
                  key={tour.id}
                  tour={tour}
                  onViewSchedule={() => router.visit(`/tours?tour=${tour.id}`)}
                />
              ))}
              {(favorites?.data ?? []).length === 0 && (
                <EmptyState
                  title="No favorite tours yet"
                  message="Tours you save from the catalog will appear here."
                />
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {(bookings?.data ?? []).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  activeTab={activeTab}
                />
              ))}
              {(bookings?.data ?? []).length === 0 && (
                <EmptyState
                  title={
                    activeTab === 'history'
                      ? 'No completed trips yet'
                      : 'No current bookings yet'
                  }
                  message={
                    activeTab === 'history'
                      ? 'Full-payment bookings move here after the departure date has passed.'
                      : 'Your draft, active, payment, and expired bookings will appear here.'
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    </TenantLayout>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-20 min-w-0 flex-col justify-center rounded-xl border bg-background px-4 py-3 text-right sm:min-w-40">
      <p className="text-[11px] font-medium leading-none text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex min-h-7 items-center justify-end text-2xl font-bold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}

function SummaryTextTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-20 min-w-0 flex-col justify-center rounded-xl border bg-background px-4 py-3 text-right sm:min-w-40">
      <p className="text-[11px] font-medium leading-none text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex min-h-7 items-center justify-end truncate text-sm font-bold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}

function FavoriteCard({
  tour,
  onViewSchedule,
}: {
  tour: TourItem;
  onViewSchedule: () => void;
}) {
  const imageMedia = tour.image as any;
  const hasImage = Boolean(imageMedia?.data?.files?.length);
  const image = extractImageSrc(imageMedia).src;

  return (
    <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
        <TourImage image={image} label={tour.name} hasImage={hasImage} />
        <div className="flex min-w-0 flex-col justify-between gap-5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-base font-bold text-foreground">
                {tour.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tour.company?.name ?? tour.destination ?? 'Saved tour'}
              </p>
            </div>
            <HeartIcon className="size-5 shrink-0 fill-rose-500 text-rose-500" />
          </div>
          <div className="flex items-end justify-between gap-3">
            {tour.showprice !== null && tour.showprice !== undefined ? (
              <p className="text-sm font-bold text-primary">
                {formatIDR(tour.showprice)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Price on request</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 rounded-xl"
              onClick={onViewSchedule}
            >
              View Tour
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  activeTab,
}: {
  booking: BookingItem;
  activeTab: PageProps['activeTab'];
}) {
  const status = normalizeStatus(booking.status);
  const imageMedia = booking.tour?.image as any;
  const hasImage = Boolean(imageMedia?.data?.files?.length);
  const image = extractImageSrc(imageMedia).src;
  const action = getBookingAction(booking, activeTab);
  const statusClass =
    STATUS_STYLES[status] ??
    'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';

  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="grid gap-0 md:grid-cols-[160px_1fr] lg:grid-cols-[180px_1fr_auto]">
        <TourImage
          image={image}
          label={booking.tour?.name ?? 'Tour'}
          hasImage={hasImage}
        />
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {booking.tour?.code && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {booking.tour.code}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={cn('capitalize', statusClass)}
            >
              {STATUS_LABELS[status] ?? booking.status}
            </Badge>
          </div>
          <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-tight text-foreground">
            {booking.tour?.name ?? 'Tour'}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {booking.booking_number}
          </p>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <InfoChip
              icon={CalendarIcon}
              label={
                booking.departure_date
                  ? dayjs(booking.departure_date).format('DD MMM YYYY')
                  : 'Departure pending'
              }
            />
            <InfoChip
              icon={MapPinIcon}
              label={booking.tour?.destination ?? 'Destination pending'}
            />
            <InfoChip
              icon={ClockIcon}
              label={
                booking.tour?.duration_days
                  ? `${booking.tour.duration_days} days`
                  : 'Trip details'
              }
            />
          </div>
        </div>
        <div
          className={cn(
            'flex flex-col gap-4 border-t p-4 sm:p-5 lg:min-w-52 lg:border-l lg:border-t-0 lg:text-right',
            hasImage ? 'lg:justify-between' : 'lg:justify-center',
          )}
        >
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Grand total
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatIDR(booking.grand_total)}
            </p>
          </div>
          {action && <BookingActionButton action={action} />}
        </div>
      </div>
    </article>
  );
}

function BookingActionButton({ action }: { action: BookingAction }) {
  const Icon = action.icon;
  const content = (
    <>
      <Icon className="size-4" />
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Button asChild className="h-10 w-full gap-2 rounded-xl">
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className="h-10 w-full gap-2 rounded-xl"
      onClick={action.onClick}
    >
      {content}
    </Button>
  );
}

function InfoChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function TourImage({
  image,
  label,
  hasImage,
}: {
  image?: string;
  label: string;
  hasImage: boolean;
}) {
  if (hasImage && image) {
    return (
      <div className="h-36 overflow-hidden bg-muted md:h-full md:min-h-40">
        <img
          src={image}
          alt={label}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className="flex h-28 items-center justify-center bg-primary/10 px-3 text-center text-2xl font-bold text-primary md:h-full md:min-h-40">
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
