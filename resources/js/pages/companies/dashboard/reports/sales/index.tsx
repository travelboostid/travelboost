import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
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

type BreakdownItem = {
    label: string;
    quantity: number;
    unit_price: number;
    amount: number;
};

type SalesReportRow = {
    id: number;
    agent_code: string;
    agent_name: string;
    vendor_name: string;
    tour_code: string;
    tour_name: string;
    departure_date: string | null;
    return_date: string | null;
    booking_code: string;
    booking_contact: string;
    booking_date: string | null;
    pax: number;
    base_tour_total: number;
    base_tour_average: number;
    taxable_visa_total: number;
    taxable_addon_total: number;
    vat_amount: number;
    promo_amount: number;
    non_taxable_visa_total: number;
    non_taxable_addon_total: number;
    platform_fee: number;
    grand_total: number;
    commission_amount: number;
    paid_at: string | null;
    taxable_visa_items: BreakdownItem[];
    taxable_addon_items: BreakdownItem[];
    non_taxable_visa_items: BreakdownItem[];
    non_taxable_addon_items: BreakdownItem[];
};

type SalesReportProps = {
    rows: SalesReportRow[];
    summary: {
        total_bookings: number;
        total_pax: number;
        total_sales: number;
        total_commission: number;
        base_tour_total: number;
        taxable_visa_total: number;
        taxable_addon_total: number;
        vat_total: number;
        promo_total: number;
        non_taxable_visa_total: number;
        non_taxable_addon_total: number;
        platform_fee_total: number;
    };
    filters: {
        period_from?: string | null;
        period_to?: string | null;
        agent_id?: string | null;
        tour_code?: string | null;
        departure_date?: string | null;
    };
    options: {
        agents: { id: number; name: string }[];
        tourCodes: { code: string; name: string }[];
        departureDates: string[];
    };
    companyType: 'agent' | 'vendor';
};

const dateLabel = (date?: string | null) =>
    date ? dayjs(date).format('DD MMM YYYY') : '-';

const dateTimeLabel = (date?: string | null) =>
    date ? dayjs(date).format('DD MMM YYYY HH:mm') : '-';

const formatFullIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

function BreakdownCell({
    items,
    total,
    emptyLabel = '-',
}: {
    items: BreakdownItem[];
    total: number;
    emptyLabel?: string;
}) {
    if (items.length === 0) {
        return <span className="text-xs text-slate-400">{emptyLabel}</span>;
    }

    return (
        <div className="space-y-1">
            {items.map((item, index) => (
                <div
                    key={`${item.label}-${item.unit_price}-${index}`}
                    className="flex items-start justify-between gap-3 text-xs leading-5"
                >
                    <span className="min-w-0 break-words text-slate-600 dark:text-slate-300">
                        {item.label} x{item.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-slate-950 dark:text-slate-100">
                        {formatFullIDR(item.amount)}
                    </span>
                </div>
            ))}
            <div className="border-t border-dashed border-slate-200 pt-1 text-right text-xs font-semibold text-slate-950 dark:border-slate-700 dark:text-slate-100">
                {formatFullIDR(total)}
            </div>
        </div>
    );
}

function CombinedNonTaxableCell({
    visaItems,
    addonItems,
    total,
}: {
    visaItems: BreakdownItem[];
    addonItems: BreakdownItem[];
    total: number;
}) {
    const items = [
        ...visaItems.map((item) => ({ ...item, prefix: 'Visa' })),
        ...addonItems.map((item) => ({ ...item, prefix: 'Add-on' })),
    ];

    if (items.length === 0) {
        return <span className="text-xs text-slate-400">-</span>;
    }

    return (
        <div className="space-y-1">
            {items.map((item, index) => (
                <div
                    key={`${item.prefix}-${item.label}-${item.unit_price}-${index}`}
                    className="flex items-start justify-between gap-3 text-xs leading-5"
                >
                    <span className="min-w-0 break-words text-slate-600 dark:text-slate-300">
                        {item.prefix}: {item.label} x{item.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-slate-950 dark:text-slate-100">
                        {formatFullIDR(item.amount)}
                    </span>
                </div>
            ))}
            <div className="border-t border-dashed border-slate-200 pt-1 text-right text-xs font-semibold text-slate-950 dark:border-slate-700 dark:text-slate-100">
                {formatFullIDR(total)}
            </div>
        </div>
    );
}

export default function SalesReportPage({
    rows,
    summary,
    filters,
    options,
    companyType,
}: SalesReportProps) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [localFilters, setLocalFilters] = useState({
        period_from: filters.period_from || '',
        period_to: filters.period_to || '',
        agent_id: filters.agent_id || '',
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
        const path = `/companies/${company.username}/dashboard/reports/sales/export/excel`;

        return params ? `${path}?${params}` : path;
    };

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
                value: formatFullIDR(Number(summary.total_sales || 0)),
                icon: Wallet,
            },
            {
                id: 'commission',
                label: isVendor ? (
                    <FormattedMessage defaultMessage="Commission Paid" />
                ) : (
                    <FormattedMessage defaultMessage="Commission Earned" />
                ),
                value: formatFullIDR(Number(summary.total_commission || 0)),
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
            activeMenuIds={['reports.sales']}
            openMenuIds={['reports']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Reports',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Sales Report',
                    }),
                },
            ]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Sales Report',
                })}
            />

            <div className="mx-auto max-w-[1800px] space-y-5 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                            <FormattedMessage defaultMessage="Sales Report" />
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <FormattedMessage defaultMessage="Completed sales are grouped by final full payment date, with tax-ready booking breakdowns." />
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
                        {isVendor && (
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
                        )}
                        <select
                            value={localFilters.tour_code}
                            onChange={(event) =>
                                updateFilter('tour_code', event.target.value)
                            }
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="">
                                <FormattedMessage defaultMessage="All Tours" />
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
                            <FormattedMessage defaultMessage="Sales Recap" />
                        </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[2260px]">
                            <TableHeader className="bg-slate-50 dark:bg-slate-950/40">
                                <TableRow className="text-xs uppercase tracking-wide">
                                    <TableHead className="w-14 px-5">
                                        <FormattedMessage defaultMessage="No" />
                                    </TableHead>
                                    <TableHead className="min-w-36">
                                        <FormattedMessage defaultMessage="Payment Date" />
                                    </TableHead>
                                    <TableHead className="min-w-32">
                                        {isVendor ? (
                                            <FormattedMessage defaultMessage="Agent Code" />
                                        ) : (
                                            <FormattedMessage defaultMessage="Vendor" />
                                        )}
                                    </TableHead>
                                    <TableHead className="min-w-48">
                                        {isVendor ? (
                                            <FormattedMessage defaultMessage="Agent Name" />
                                        ) : (
                                            <FormattedMessage defaultMessage="Vendor Name" />
                                        )}
                                    </TableHead>
                                    <TableHead className="min-w-28">
                                        <FormattedMessage defaultMessage="Tour Code" />
                                    </TableHead>
                                    <TableHead className="min-w-64">
                                        <FormattedMessage defaultMessage="Tour Name" />
                                    </TableHead>
                                    <TableHead className="min-w-44">
                                        <FormattedMessage defaultMessage="Departure" />
                                    </TableHead>
                                    <TableHead className="min-w-36">
                                        <FormattedMessage defaultMessage="Booking Number" />
                                    </TableHead>
                                    <TableHead className="min-w-44">
                                        <FormattedMessage defaultMessage="Customer" />
                                    </TableHead>
                                    <TableHead className="min-w-20 text-center">
                                        <FormattedMessage defaultMessage="Pax" />
                                    </TableHead>
                                    <TableHead className="min-w-36 text-right">
                                        <FormattedMessage defaultMessage="Base Tour" />
                                    </TableHead>
                                    <TableHead className="min-w-64">
                                        <FormattedMessage defaultMessage="Taxable Visa" />
                                    </TableHead>
                                    <TableHead className="min-w-64">
                                        <FormattedMessage defaultMessage="Taxable Add-ons" />
                                    </TableHead>
                                    <TableHead className="min-w-32 text-right">
                                        <FormattedMessage defaultMessage="VAT" />
                                    </TableHead>
                                    <TableHead className="min-w-32 text-right">
                                        <FormattedMessage defaultMessage="Promo" />
                                    </TableHead>
                                    <TableHead className="min-w-72">
                                        <FormattedMessage defaultMessage="Non-taxable Items" />
                                    </TableHead>
                                    <TableHead className="min-w-32 text-right">
                                        <FormattedMessage defaultMessage="Platform Fee" />
                                    </TableHead>
                                    <TableHead className="min-w-36 pr-5 text-right">
                                        <FormattedMessage defaultMessage="Grand Total" />
                                    </TableHead>
                                    <TableHead className="min-w-36 pr-5 text-right">
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
                                            colSpan={19}
                                            className="h-40 text-center text-slate-500"
                                        >
                                            <FormattedMessage defaultMessage="No full payment sales found." />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {rows.map((row, index) => (
                                            <TableRow
                                                key={row.id}
                                                className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                                            >
                                                <TableCell className="px-5 text-slate-500">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="font-medium text-slate-950 dark:text-slate-100">
                                                        {dateLabel(row.paid_at)}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {dateTimeLabel(
                                                            row.paid_at,
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                                                    {isVendor
                                                        ? row.agent_code
                                                        : row.vendor_name}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-950 dark:text-slate-100">
                                                    {isVendor
                                                        ? row.agent_name
                                                        : row.vendor_name}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap font-mono text-xs">
                                                    {row.tour_code}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-950 dark:text-slate-100">
                                                    {row.tour_name}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                    {dateLabel(
                                                        row.departure_date,
                                                    )}{' '}
                                                    -{' '}
                                                    {dateLabel(row.return_date)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap font-mono text-xs">
                                                    {row.booking_code}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-950 dark:text-slate-100">
                                                        {row.booking_contact}
                                                    </div>
                                                    <div className="mt-1 whitespace-nowrap text-xs text-slate-500">
                                                        {dateTimeLabel(
                                                            row.booking_date,
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-medium text-slate-950 dark:text-slate-100">
                                                    {row.pax}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="font-semibold text-slate-950 dark:text-slate-100">
                                                        {formatFullIDR(
                                                            row.base_tour_total,
                                                        )}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        Avg{' '}
                                                        {formatFullIDR(
                                                            row.base_tour_average,
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <BreakdownCell
                                                        items={
                                                            row.taxable_visa_items
                                                        }
                                                        total={
                                                            row.taxable_visa_total
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <BreakdownCell
                                                        items={
                                                            row.taxable_addon_items
                                                        }
                                                        total={
                                                            row.taxable_addon_total
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right font-medium">
                                                    {formatFullIDR(
                                                        row.vat_amount,
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right font-medium text-rose-600 dark:text-rose-300">
                                                    {row.promo_amount > 0
                                                        ? `- ${formatFullIDR(row.promo_amount)}`
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <CombinedNonTaxableCell
                                                        visaItems={
                                                            row.non_taxable_visa_items
                                                        }
                                                        addonItems={
                                                            row.non_taxable_addon_items
                                                        }
                                                        total={
                                                            row.non_taxable_visa_total +
                                                            row.non_taxable_addon_total
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right font-medium">
                                                    {formatFullIDR(
                                                        row.platform_fee,
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap pr-5 text-right font-semibold text-slate-950 dark:text-slate-100">
                                                    {formatFullIDR(
                                                        row.grand_total,
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap pr-5 text-right font-semibold text-emerald-600 dark:text-emerald-300">
                                                    {formatFullIDR(
                                                        row.commission_amount,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-100/80 font-semibold dark:bg-slate-800/70">
                                            <TableCell
                                                colSpan={9}
                                                className="px-5 text-slate-950 dark:text-slate-100"
                                            >
                                                <FormattedMessage defaultMessage="Total" />
                                            </TableCell>
                                            <TableCell className="text-center text-slate-950 dark:text-slate-100">
                                                {summary.total_pax}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-950 dark:text-slate-100">
                                                {formatFullIDR(
                                                    summary.base_tour_total,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-950 dark:text-slate-100">
                                                {formatFullIDR(
                                                    summary.taxable_visa_total,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-950 dark:text-slate-100">
                                                {formatFullIDR(
                                                    summary.taxable_addon_total,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-950 dark:text-slate-100">
                                                {formatFullIDR(
                                                    summary.vat_total,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-rose-600 dark:text-rose-300">
                                                {summary.promo_total > 0
                                                    ? `- ${formatFullIDR(summary.promo_total)}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-950 dark:text-slate-100">
                                                {formatFullIDR(
                                                    summary.non_taxable_visa_total +
                                                        summary.non_taxable_addon_total,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-950 dark:text-slate-100">
                                                {formatFullIDR(
                                                    summary.platform_fee_total,
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-5 text-right text-slate-950 dark:text-slate-100">
                                                {formatFullIDR(
                                                    summary.total_sales,
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-5 text-right text-emerald-600 dark:text-emerald-300">
                                                {formatFullIDR(
                                                    summary.total_commission,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
