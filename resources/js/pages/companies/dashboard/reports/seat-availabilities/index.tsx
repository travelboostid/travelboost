import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Head, router } from '@inertiajs/react';
import { ChevronDownIcon, InfoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

type Schedule = {
  id: number;
  schedule_id: number;

  departure_date: string;
  return_date: string;

  max_pax: number;

  RS: number;
  WP: number;
  DP: number;
  FP: number;
  WA: number;
  WPA: number;
  BRS: number;
  CA: number;
  RF: number;
  EX: number;
  WL: number;

  available: number;
};

type TourAvailability = {
  tour: {
    id: number;
    name: string;
  };

  schedules: Schedule[];
};

interface Props {
  availabilities: {
    data: TourAvailability[];

    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
  };

  filters: {
    search?: string;
    departure_date?: string;
  };
}

export default function SeatAvailabilityIndex({
  availabilities,
  filters,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const today = new Date().toISOString().split('T')[0];

  const [departureDate, setDepartureDate] = useState(
    filters.departure_date || today,
  );

  useEffect(() => {
    if (!filters.departure_date) {
      router.get(
        window.location.pathname,
        {
          search,
          departure_date: today,
        },
        {
          preserveState: true,
          replace: true,
        },
      );
    }
  }, []);

  const [openTours, setOpenTours] = useState<number[]>([]);
  const [visibleSchedules, setVisibleSchedules] = useState<
    Record<number, number>
  >({});

  const handleSearch = (value: string) => {
    setSearch(value);

    router.get(
      window.location.pathname,
      {
        search: value,
        departure_date: departureDate,
      },
      {
        preserveState: true,
        replace: true,
      },
    );
  };

  const handleDepartureDate = (value: string) => {
    setDepartureDate(value);

    router.get(
      window.location.pathname,
      {
        search,
        departure_date: value,
      },
      {
        preserveState: true,
        replace: true,
      },
    );
  };

  const toggleTour = (tourId: number) => {
    setOpenTours((prev) =>
      prev.includes(tourId)
        ? prev.filter((id) => id !== tourId)
        : [...prev, tourId],
    );
  };

  const getVisibleCount = (tourId: number) => {
    return visibleSchedules[tourId] || 10;
  };

  const loadMoreSchedules = (tourId: number) => {
    setVisibleSchedules((prev) => ({
      ...prev,
      [tourId]: (prev[tourId] || 10) + 10,
    }));
  };

  const getStatus = (available: number) => {
    if (available <= 0) {
      return {
        label: 'FULL',
        className: 'bg-red-100 text-red-700 border-red-200',
      };
    }

    if (available <= 5) {
      return {
        label: 'LOW',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      };
    }

    return {
      label: 'AVAILABLE',
      className: 'bg-green-100 text-green-700 border-green-200',
    };
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <CompanyDashboardLayout
      openMenuIds={['reports']}
      activeMenuIds={['reports.seat-availabilities']}
      breadcrumb={[{ title: 'Reports' }, { title: 'Seat Availabilities' }]}
    >
      <Head title="Seat Availability" />

      <div className="space-y-6 p-4 md:p-6">
        {/* SEARCH */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Search Tour
            </label>

            <input
              type="text"
              placeholder="Search by tour name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Departure Date
            </label>

            <input
              type="date"
              value={departureDate}
              onChange={(e) => handleDepartureDate(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* TOUR LIST */}
        <div className="space-y-4">
          {availabilities.data.map((item) => {
            const isOpen = openTours.includes(item.tour.id);

            return (
              <div
                key={item.tour.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                {/* TOUR HEADER */}
                <button
                  onClick={() => toggleTour(item.tour.id)}
                  className="flex w-full items-center justify-between bg-slate-50 px-6 py-4 transition hover:bg-slate-100"
                >
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">{item.tour.name}</h2>

                    <p className="text-sm text-muted-foreground">
                      Showing{' '}
                      {Math.min(
                        getVisibleCount(item.tour.id),
                        item.schedules.length,
                      )}{' '}
                      of {item.schedules.length} schedules
                    </p>
                  </div>

                  <ChevronDownIcon
                    className={`h-5 w-5 transition ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* CONTENT */}
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr>
                          <th className="border px-3 py-3 text-left">
                            Departure
                          </th>

                          <th className="border px-3 py-3 text-left">Return</th>

                          <th className="border px-3 py-3 text-center">
                            Max Pax
                          </th>

                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>RS</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Manual Reserved</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>WP</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Waiting Payment</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>WA</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>
                                Waiting Payment Approval
                              </TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>DP</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Down Payment</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>FP</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Full Payment</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>BR</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Booking Reserved</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>CA</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Cancel</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>RF</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Refund</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>EX</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Expired</TooltipContent>
                            </Tooltip>
                          </th>
                          <th className="border px-3 py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 cursor-help">
                                  <span>WL</span>

                                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>Waiting List</TooltipContent>
                            </Tooltip>
                          </th>

                          <th className="border px-3 py-3 text-center">
                            Available
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {[...item.schedules]
                          .sort(
                            (a, b) =>
                              new Date(a.departure_date).getTime() -
                              new Date(b.departure_date).getTime(),
                          )
                          .slice(0, getVisibleCount(item.tour.id))
                          .map((schedule) => {
                            const used =
                              schedule.RS +
                              schedule.WP +
                              schedule.DP +
                              schedule.FP +
                              schedule.WPA +
                              schedule.BRS +
                              schedule.CA +
                              schedule.RF +
                              schedule.EX;

                            const percent =
                              schedule.max_pax > 0
                                ? Math.round((used / schedule.max_pax) * 100)
                                : 0;

                            const status = getStatus(schedule.available);

                            return (
                              <tr
                                key={schedule.id}
                                className="hover:bg-slate-50"
                              >
                                <td className="border px-3 py-3 whitespace-nowrap min-w-[120px]">
                                  {formatDate(schedule.departure_date)}
                                </td>

                                <td className="border px-3 py-3 whitespace-nowrap min-w-[120px]">
                                  {formatDate(schedule.return_date)}
                                </td>

                                <td className="border px-3 py-3 text-center font-medium">
                                  {schedule.max_pax}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.RS}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.WP}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.WPA}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.DP}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.FP}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.BRS}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.CA}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.RF}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.EX}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  {schedule.WL}
                                </td>

                                <td className="border px-3 py-3 text-center">
                                  <span
                                    className={`inline-flex min-w-[70px] justify-center rounded-full px-3 py-1 text-xs font-bold ${
                                      schedule.available <= 0
                                        ? 'bg-red-100 text-red-700'
                                        : schedule.available <= 5
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {schedule.available}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                        {item.schedules.length === 0 && (
                          <tr>
                            <td
                              colSpan={16}
                              className="py-8 text-center text-muted-foreground"
                            >
                              No schedules found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {item.schedules.length > getVisibleCount(item.tour.id) && (
                      <div className="flex justify-center border-t bg-slate-50 p-4">
                        <button
                          onClick={() => loadMoreSchedules(item.tour.id)}
                          className="rounded-xl border bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
                        >
                          Load More Schedules
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {availabilities.data.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
              No availability data found
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-4">
          {availabilities.links.map((link, index) => (
            <button
              key={index}
              disabled={!link.url}
              onClick={() => {
                if (link.url) {
                  router.visit(link.url, {
                    preserveState: true,
                    preserveScroll: true,
                  });
                }
              }}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                link.active
                  ? 'bg-primary text-white'
                  : 'bg-white hover:bg-slate-50'
              } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
              dangerouslySetInnerHTML={{
                __html: link.label,
              }}
            />
          ))}
        </div>
      </div>
    </CompanyDashboardLayout>
  );
}
