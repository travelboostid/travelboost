import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { index as paymentsIndex } from '@/routes/companies/dashboard/payments';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { CalendarIcon, CoinsIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { FormattedMessage } from 'react-intl';
import EmptyPayments from './components/empty-payments';
import PaymentCard from './components/payment-card';
import PaymentsSummary from './components/payments-summary';

export type PaymentTypeFilter =
    | 'all'
    | 'wallet-topup-payment'
    | 'agent-subscription-payment'
    | 'ai-credit-topup-payment';

export type PaymentsPageProps = {
    payments: Array<Record<string, unknown>>;
    filters: {
        from: string;
        to: string;
        status: string | null;
        type: PaymentTypeFilter;
        sort: '-created_at' | 'created_at';
    };
    stats: {
        total_count: number;
        total_amount: number;
        paid_count: number;
        pending_count: number;
    };
};

const TYPE_FILTERS: Array<{
    id: PaymentTypeFilter;
    label: React.ReactNode;
}> = [
    { id: 'all', label: <FormattedMessage defaultMessage="All" /> },
    {
        id: 'wallet-topup-payment',
        label: <FormattedMessage defaultMessage="Wallet top-up" />,
    },
    {
        id: 'agent-subscription-payment',
        label: <FormattedMessage defaultMessage="Subscription" />,
    },
    {
        id: 'ai-credit-topup-payment',
        label: <FormattedMessage defaultMessage="AI credits" />,
    },
];

function buildFilterParams(
    filters: PaymentsPageProps['filters'],
    overrides: Partial<PaymentsPageProps['filters']> = {},
): Record<string, string> {
    const next = { ...filters, ...overrides };
    const params: Record<string, string> = {
        from: next.from,
        to: next.to,
        sort: next.sort,
    };

    if (next.status) {
        params.status = next.status;
    }

    if (next.type !== 'all') {
        params.type = next.type;
    }

    return params;
}

export default function PaymentsPage({
    payments,
    filters,
    stats,
}: PaymentsPageProps) {
    const { company } = usePageSharedDataProps();
    const [calendarMonths, setCalendarMonths] = useState(1);

    const dateRange = useMemo<DateRange>(
        () => ({
            from: dayjs(filters.from).toDate(),
            to: dayjs(filters.to).toDate(),
        }),
        [filters.from, filters.to],
    );

    const periodLabel = `${dayjs(filters.from).format('DD MMM YYYY')} – ${dayjs(filters.to).format('DD MMM YYYY')}`;

    const hasActiveFilters = filters.type !== 'all' || Boolean(filters.status);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const updateMonths = () => {
            setCalendarMonths(mediaQuery.matches ? 2 : 1);
        };

        updateMonths();
        mediaQuery.addEventListener('change', updateMonths);

        return () => {
            mediaQuery.removeEventListener('change', updateMonths);
        };
    }, []);

    const visitWithFilters = (
        overrides: Partial<PaymentsPageProps['filters']> = {},
    ) => {
        router.get(
            paymentsIndex({ company: company.username }),
            buildFilterParams(filters, overrides),
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        if (!range?.from) {
            return;
        }

        visitWithFilters({
            from: dayjs(range.from).format('YYYY-MM-DD'),
            to: dayjs(range.to ?? range.from).format('YYYY-MM-DD'),
        });
    };

    const dateLabel =
        dateRange.from && dateRange.to
            ? `${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`
            : format(dateRange.from!, 'MMM d, yyyy');

    return (
        <CompanyDashboardLayout
            breadcrumb={[{ title: 'Funds' }, { title: 'Payments' }]}
            openMenuIds={['funds']}
            activeMenuIds={['funds.payments']}
        >
            <Head title="Payments" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CoinsIcon className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                            <FormattedMessage defaultMessage="Payment history" />
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="Track online payments for top-ups, subscriptions, and credits." />
                        </p>
                    </div>
                </header>

                <PaymentsSummary
                    totalAmount={stats.total_amount}
                    totalCount={stats.total_count}
                    paidCount={stats.paid_count}
                    pendingCount={stats.pending_count}
                    periodLabel={periodLabel}
                />

                <Card className="border shadow-sm">
                    <CardHeader className="gap-4 border-b pb-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <CoinsIcon className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    <FormattedMessage defaultMessage="Activity" />
                                </CardTitle>
                                <CardDescription>
                                    <FormattedMessage
                                        defaultMessage="{count} results in this period"
                                        values={{ count: payments.length }}
                                    />
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-10 w-full justify-start gap-2 font-normal sm:w-auto"
                                        >
                                            <CalendarIcon className="size-4 shrink-0" />
                                            <span className="truncate">
                                                {dateLabel}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="range"
                                            defaultMonth={dateRange.from}
                                            selected={dateRange}
                                            onSelect={handleDateRangeChange}
                                            numberOfMonths={calendarMonths}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Select
                                        value={filters.status ?? 'all'}
                                        onValueChange={(status) =>
                                            visitWithFilters({
                                                status:
                                                    status === 'all'
                                                        ? null
                                                        : status,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-10 w-full sm:w-40">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                <FormattedMessage defaultMessage="Any status" />
                                            </SelectItem>
                                            <SelectItem value="unpaid">
                                                <FormattedMessage defaultMessage="Unpaid" />
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                <FormattedMessage defaultMessage="Pending" />
                                            </SelectItem>
                                            <SelectItem value="paid">
                                                <FormattedMessage defaultMessage="Paid" />
                                            </SelectItem>
                                            <SelectItem value="failed">
                                                <FormattedMessage defaultMessage="Failed" />
                                            </SelectItem>
                                            <SelectItem value="expired">
                                                <FormattedMessage defaultMessage="Expired" />
                                            </SelectItem>
                                            <SelectItem value="cancelled">
                                                <FormattedMessage defaultMessage="Cancelled" />
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filters.sort}
                                        onValueChange={(sort) =>
                                            visitWithFilters({
                                                sort: sort as PaymentsPageProps['filters']['sort'],
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-10 w-full sm:w-40">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="-created_at">
                                                <FormattedMessage defaultMessage="Newest first" />
                                            </SelectItem>
                                            <SelectItem value="created_at">
                                                <FormattedMessage defaultMessage="Oldest first" />
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="inline-flex w-full rounded-lg border bg-muted/30 p-1 sm:w-auto">
                                {TYPE_FILTERS.map((filter) => {
                                    const isActive = filters.type === filter.id;

                                    return (
                                        <Button
                                            key={filter.id}
                                            type="button"
                                            size="sm"
                                            variant={
                                                isActive ? 'default' : 'ghost'
                                            }
                                            className={cn(
                                                'h-8 flex-1 rounded-md px-3 sm:flex-none',
                                                !isActive &&
                                                    'text-muted-foreground hover:text-foreground',
                                            )}
                                            onClick={() =>
                                                visitWithFilters({
                                                    type: filter.id,
                                                })
                                            }
                                        >
                                            {filter.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-5">
                        {payments.length > 0 ? (
                            payments.map((payment) => (
                                <PaymentCard
                                    key={String(payment.id)}
                                    payment={payment as never}
                                />
                            ))
                        ) : (
                            <EmptyPayments
                                showClearFilters={hasActiveFilters}
                                onClearFilters={() =>
                                    visitWithFilters({
                                        type: 'all',
                                        status: null,
                                    })
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
