import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { formatIDR } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    CalendarDays,
    FileSpreadsheet,
    HandCoins,
    TicketCheck,
    UsersRound,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

type BookingReportRow = {
    id: number;
    agent_code: string;
    agent_name: string;
    vendor_name: string;
    tour_code: string;
    tour_name: string;
    departure_date: string | null;
    return_date: string | null;
    booking_code: string;
    booking_status: 'down payment' | 'full payment';
    booking_contact: string;
    booking_customer: string;
    contact_email: string;
    contact_phone: string;
    booking_date: string | null;
    pax: number;
    pax_detail: { adult: number; child: number; infant: number };
    passengers: {
        name: string;
        dob: string | null;
        category: string;
        room_type: string;
        room_number: string;
        price_amount: number;
        note: string | null;
        original_price: number;
        promo_amount: number;
    }[];
    addons: { name: string; price: number }[];
    tour_price: number;
    tour_price_total: number;
    tax_amount: number;
    platform_fee: number;
    addon_cost: number;
    promo_amount: number;
    commission_amount: number;
    grand_total: number;
    payment_mode: string;
    payment_flow: string;
    payments: {
        type: string;
        method: string;
        amount: number;
        paid_at: string | null;
    }[];
    down_payment: {
        method: string;
        amount: number;
        paid_at: string | null;
    } | null;
    full_payment: {
        method: string;
        amount: number;
        paid_at: string | null;
    } | null;
    paid_at: string | null;
};

type BookingReportProps = {
    rows: BookingReportRow[];
    summary: {
        total_bookings: number;
        total_pax: number;
        total_sales: number;
        total_commission: number;
    };
    filters: {
        period_from?: string | null;
        period_to?: string | null;
        agent_id?: string | null;
        vendor_id?: string | null;
        tour_code?: string | null;
        departure_date?: string | null;
    };
    options: {
        agents: { id: number; name: string }[];
        vendors: { id: number; name: string }[];
        tourCodes: { code: string; name: string }[];
        departureDates: string[];
    };
    companyType: 'agent' | 'vendor';
};

const dateLabel = (date?: string | null) =>
    date ? dayjs(date).format('DD MMM YYYY') : '-';

export default function BookingReportPage({
    rows,
    summary,
    filters,
    options,
    companyType,
}: BookingReportProps) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [localFilters, setLocalFilters] = useState({
        period_from: filters.period_from || '',
        period_to: filters.period_to || '',
        agent_id: filters.agent_id || '',
        vendor_id: filters.vendor_id || '',
        tour_code: filters.tour_code || '',
        departure_date: filters.departure_date || '',
    });

    const isVendor = companyType === 'vendor';

    const queryParams = useMemo(() => {
        const params: Record<string, string> = {};

        Object.entries(localFilters).forEach(([key, value]) => {
            if (value) {
                params[key] = value;
            }
        });

        return params;
    }, [localFilters]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(window.location.pathname, queryParams, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [queryParams]);

    const updateFilter = (key: keyof typeof localFilters, value: string) => {
        setLocalFilters((current) => ({
            ...current,
            [key]: value,
            ...(key === 'tour_code' ? { departure_date: '' } : {}),
        }));
    };

    const exportUrl = () => {
        const params = new URLSearchParams(queryParams).toString();
        const path = `/companies/${company.username}/dashboard/reports/bookings/export/excel`;

        return params ? `${path}?${params}` : path;
    };

    const tableRows = useMemo(
        () =>
            rows.flatMap((row, rowIndex) => {
                const passengers =
                    row.passengers.length > 0 ? row.passengers : [null];

                return passengers.map((passenger, passengerIndex) => ({
                    row,
                    rowIndex,
                    passenger,
                    passengerIndex,
                    isFirstPassenger: passengerIndex === 0,
                    passengerCount: passengers.length,
                }));
            }),
        [rows],
    );

    const summaryCards = useMemo(
        () => [
            {
                id: 'bookings',
                label: <FormattedMessage defaultMessage="Bookings" />,
                value: summary.total_bookings.toLocaleString('id-ID'),
                icon: TicketCheck,
            },
            {
                id: 'pax',
                label: <FormattedMessage defaultMessage="Total Pax" />,
                value: summary.total_pax.toLocaleString('id-ID'),
                icon: UsersRound,
            },
            {
                id: 'sales',
                label: <FormattedMessage defaultMessage="Total Sales" />,
                value: formatIDR(Number(summary.total_sales || 0)),
                icon: Wallet,
            },
            {
                id: 'commission',
                label: isVendor ? (
                    <FormattedMessage defaultMessage="Commission Paid" />
                ) : (
                    <FormattedMessage defaultMessage="Commission Earned" />
                ),
                value: formatIDR(Number(summary.total_commission || 0)),
                icon: HandCoins,
            },
        ],
        [
            isVendor,
            summary.total_bookings,
            summary.total_commission,
            summary.total_pax,
            summary.total_sales,
        ],
    );

    return (
        <CompanyDashboardLayout
            activeMenuIds={['reports.bookings']}
            openMenuIds={['reports']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Reports',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Booking List',
                    }),
                },
            ]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Booking List',
                })}
            />

            <div className="mx-auto max-w-[1600px] space-y-5 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                            <FormattedMessage defaultMessage="Booking List" />
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <FormattedMessage defaultMessage="Down payment and full payment booking report with guest pricing, add-ons, payments, and commission details." />
                        </p>
                    </div>
                    <Button
                        type="button"
                        className="w-full gap-2 sm:w-auto"
                        onClick={() => window.open(exportUrl())}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        <FormattedMessage defaultMessage="Export Excel" />
                    </Button>
                </div>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Card
                                key={item.id}
                                className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <CardContent className="flex items-center justify-between gap-4 p-5">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                                            {item.label}
                                        </p>
                                        <p className="mt-2 break-words text-xl leading-tight font-semibold text-slate-950 dark:text-slate-100">
                                            {item.value}
                                        </p>
                                    </div>
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
                        <Input
                            type="date"
                            value={localFilters.period_from}
                            onChange={(event) =>
                                updateFilter('period_from', event.target.value)
                            }
                            className="h-11"
                        />
                        <Input
                            type="date"
                            value={localFilters.period_to}
                            onChange={(event) =>
                                updateFilter('period_to', event.target.value)
                            }
                            className="h-11"
                        />
                        {isVendor ? (
                            <select
                                value={localFilters.agent_id}
                                onChange={(event) =>
                                    updateFilter('agent_id', event.target.value)
                                }
                                className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">
                                    <FormattedMessage defaultMessage="All Agents" />
                                </option>
                                {options.agents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={localFilters.vendor_id}
                                onChange={(event) =>
                                    updateFilter(
                                        'vendor_id',
                                        event.target.value,
                                    )
                                }
                                className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">
                                    <FormattedMessage defaultMessage="All Vendors" />
                                </option>
                                {options.vendors.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            value={localFilters.tour_code}
                            onChange={(event) =>
                                updateFilter('tour_code', event.target.value)
                            }
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="">
                                <FormattedMessage defaultMessage="All Tour Codes" />
                            </option>
                            {options.tourCodes.map((tour) => (
                                <option key={tour.code} value={tour.code}>
                                    {tour.code} - {tour.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={localFilters.departure_date}
                            disabled={!localFilters.tour_code}
                            onChange={(event) =>
                                updateFilter(
                                    'departure_date',
                                    event.target.value,
                                )
                            }
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="">
                                <FormattedMessage defaultMessage="All Departure Dates" />
                            </option>
                            {options.departureDates.map((date) => (
                                <option key={date} value={date}>
                                    {dateLabel(date)}
                                </option>
                            ))}
                        </select>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            <FormattedMessage defaultMessage="Booking List" />
                        </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[2120px]">
                            <TableHeader className="bg-slate-50 dark:bg-slate-950/40">
                                <TableRow className="text-xs uppercase tracking-wide">
                                    <TableHead className="w-14 px-5">
                                        <FormattedMessage defaultMessage="No" />
                                    </TableHead>
                                    <TableHead className="min-w-32">
                                        {isVendor ? (
                                            <FormattedMessage defaultMessage="Agent Code" />
                                        ) : (
                                            <FormattedMessage defaultMessage="Vendor" />
                                        )}
                                    </TableHead>
                                    <TableHead className="min-w-56">
                                        {isVendor ? (
                                            <FormattedMessage defaultMessage="Agent Name" />
                                        ) : (
                                            <FormattedMessage defaultMessage="Vendor Name" />
                                        )}
                                    </TableHead>
                                    <TableHead className="min-w-32">
                                        <FormattedMessage defaultMessage="Tour Code" />
                                    </TableHead>
                                    <TableHead className="min-w-64">
                                        <FormattedMessage defaultMessage="Tour Name" />
                                    </TableHead>
                                    <TableHead className="min-w-52">
                                        <FormattedMessage defaultMessage="Departure Date" />
                                    </TableHead>
                                    <TableHead className="min-w-40">
                                        <FormattedMessage defaultMessage="Booking Number" />
                                    </TableHead>
                                    <TableHead className="min-w-36 text-center">
                                        <FormattedMessage defaultMessage="Payment Status" />
                                    </TableHead>
                                    <TableHead className="min-w-52">
                                        <FormattedMessage defaultMessage="Customer" />
                                    </TableHead>
                                    <TableHead className="min-w-56">
                                        <FormattedMessage defaultMessage="Passenger" />
                                    </TableHead>
                                    <TableHead className="min-w-44">
                                        <FormattedMessage defaultMessage="Price Category" />
                                    </TableHead>
                                    <TableHead className="min-w-36 text-right">
                                        <FormattedMessage defaultMessage="Tour Price" />
                                    </TableHead>
                                    <TableHead className="min-w-20 text-center">
                                        <FormattedMessage defaultMessage="Pax" />
                                    </TableHead>
                                    <TableHead className="min-w-40 text-right">
                                        <FormattedMessage defaultMessage="Tour Price x Pax" />
                                    </TableHead>
                                    <TableHead className="min-w-32 text-right">
                                        <FormattedMessage defaultMessage="VAT" />
                                    </TableHead>
                                    <TableHead className="min-w-32 text-right">
                                        <FormattedMessage defaultMessage="Add On" />
                                    </TableHead>
                                    <TableHead className="min-w-36 text-right">
                                        <FormattedMessage defaultMessage="Platform Fee" />
                                    </TableHead>
                                    <TableHead className="min-w-32 text-right">
                                        <FormattedMessage defaultMessage="Promo" />
                                    </TableHead>
                                    <TableHead className="min-w-40 text-right">
                                        <FormattedMessage defaultMessage="Total" />
                                    </TableHead>
                                    <TableHead className="min-w-44 pr-5 text-right">
                                        {isVendor ? (
                                            <FormattedMessage defaultMessage="Commission Paid" />
                                        ) : (
                                            <FormattedMessage defaultMessage="Commission Earned" />
                                        )}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={20}
                                            className="h-40 text-center text-slate-500"
                                        >
                                            <FormattedMessage defaultMessage="No booking list data found." />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tableRows.map(
                                        ({
                                            row,
                                            rowIndex,
                                            passenger,
                                            passengerIndex,
                                            isFirstPassenger,
                                            passengerCount,
                                        }) => (
                                            <TableRow
                                                key={`${row.id}-${passengerIndex}`}
                                                className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                                            >
                                                {isFirstPassenger && (
                                                    <>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="px-5 text-slate-500"
                                                        >
                                                            {rowIndex + 1}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300"
                                                        >
                                                            {isVendor
                                                                ? row.agent_code
                                                                : row.vendor_name}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="font-medium text-slate-950 dark:text-slate-100"
                                                        >
                                                            {isVendor
                                                                ? row.agent_name
                                                                : row.vendor_name}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap font-mono text-xs"
                                                        >
                                                            {row.tour_code}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="font-medium text-slate-950 dark:text-slate-100"
                                                        >
                                                            {row.tour_name}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap text-slate-600 dark:text-slate-300"
                                                        >
                                                            {dateLabel(
                                                                row.departure_date,
                                                            )}{' '}
                                                            -{' '}
                                                            {dateLabel(
                                                                row.return_date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap font-mono text-xs"
                                                        >
                                                            {row.booking_code}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="text-center align-middle"
                                                        >
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    row.booking_status ===
                                                                    'full payment'
                                                                        ? 'whitespace-nowrap border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                        : 'whitespace-nowrap border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                                }
                                                            >
                                                                {row.booking_status ===
                                                                'full payment' ? (
                                                                    <FormattedMessage defaultMessage="Full Payment" />
                                                                ) : (
                                                                    <FormattedMessage defaultMessage="Down Payment" />
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                        >
                                                            <div className="font-medium text-slate-950 dark:text-slate-100">
                                                                {
                                                                    row.booking_customer
                                                                }
                                                            </div>
                                                            <div className="mt-1 text-xs text-slate-500">
                                                                {row.contact_email ||
                                                                    '-'}
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell>
                                                    <div className="font-medium text-slate-950 dark:text-slate-100">
                                                        {passenger?.name ?? '-'}
                                                    </div>
                                                    <div className="mt-1 whitespace-nowrap text-xs text-slate-500">
                                                        <FormattedMessage
                                                            defaultMessage="DOB: {date}"
                                                            values={{
                                                                date: dateLabel(
                                                                    passenger?.dob,
                                                                ),
                                                            }}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-950 dark:text-slate-100">
                                                        {passenger?.category ??
                                                            '-'}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {passenger?.room_type ? (
                                                            <FormattedMessage
                                                                defaultMessage="{roomType} - Room {roomNumber}"
                                                                values={{
                                                                    roomType:
                                                                        passenger.room_type,
                                                                    roomNumber:
                                                                        passenger.room_number,
                                                                }}
                                                            />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right font-medium">
                                                    {formatIDR(
                                                        passenger?.price_amount ??
                                                            row.tour_price,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center font-medium text-slate-950 dark:text-slate-100">
                                                    {passenger ? 1 : row.pax}
                                                </TableCell>
                                                {isFirstPassenger && (
                                                    <>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap text-right font-medium"
                                                        >
                                                            {formatIDR(
                                                                row.tour_price_total,
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap text-right"
                                                        >
                                                            {formatIDR(
                                                                row.tax_amount,
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap text-right"
                                                        >
                                                            {formatIDR(
                                                                row.addon_cost,
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap text-right"
                                                        >
                                                            {formatIDR(
                                                                row.platform_fee,
                                                            )}
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell className="whitespace-nowrap text-right">
                                                    {passenger
                                                        ? formatIDR(
                                                              passenger.promo_amount,
                                                          )
                                                        : formatIDR(
                                                              row.promo_amount,
                                                          )}
                                                </TableCell>
                                                {isFirstPassenger && (
                                                    <>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap text-right font-semibold text-slate-950 dark:text-slate-100"
                                                        >
                                                            {formatIDR(
                                                                row.grand_total,
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            rowSpan={
                                                                passengerCount
                                                            }
                                                            className="whitespace-nowrap pr-5 text-right font-semibold text-emerald-600 dark:text-emerald-300"
                                                        >
                                                            {formatIDR(
                                                                row.commission_amount,
                                                            )}
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ),
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
