import TenantLayout from '@/components/layouts/tenant-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/constants/booking';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, ClockIcon, HeartIcon } from 'lucide-react';
import { useState } from 'react';

type BookingItem = {
  id: number;
  booking_number: string;
  status: string;
  departure_date: string | null;
  grand_total: string | number;
  tour: { id: number; name: string } | null;
  vendor: { id: number; name: string } | null;
};

type TourItem = {
  id: number;
  name: string;
  destination?: string | null;
  showprice?: string | number | null;
  company?: { id: number; name: string } | null;
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

const TABS = [
  { key: 'favorites', label: 'Favorites', icon: HeartIcon },
  { key: 'current', label: 'Current Bookings', icon: CalendarIcon },
  { key: 'history', label: 'History', icon: ClockIcon },
] as const;

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8">
        <div className="flex flex-wrap justify-center gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'favorites' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(favorites?.data ?? []).map((tour) => (
              <div key={tour.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{tour.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {tour.company?.name ?? tour.destination ?? 'Saved tour'}
                    </p>
                  </div>
                  <HeartIcon className="size-5 fill-rose-500 text-rose-500" />
                </div>
                {tour.showprice !== null && tour.showprice !== undefined && (
                  <p className="mt-3 text-sm font-semibold text-primary">
                    {formatIDR(tour.showprice)}
                  </p>
                )}
              </div>
            ))}
            {(favorites?.data ?? []).length === 0 && (
              <EmptyState message="No favorite tours yet." />
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {(bookings?.data ?? []).map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      {booking.tour?.name ?? 'Tour'}
                    </h2>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {booking.booking_number}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.departure_date
                        ? dayjs(booking.departure_date).format('DD MMM YYYY')
                        : 'Departure date pending'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <Badge variant="secondary" className="capitalize">
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {formatIDR(booking.grand_total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(bookings?.data ?? []).length === 0 && (
              <EmptyState
                message={
                  activeTab === 'history'
                    ? 'No booking history yet.'
                    : 'No current bookings yet.'
                }
              />
            )}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
