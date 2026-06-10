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
import { index as withdrawalsIndex } from '@/routes/companies/dashboard/withdrawals';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { ArrowDownRightIcon, CalendarIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { FormattedMessage } from 'react-intl';
import { CreateWithdrawalButton } from './components/create-withdrawal-button';
import EmptyWithdrawals from './components/empty-withdrawals';
import WithdrawalCard from './components/withdrawal-card';
import WithdrawalsSummary from './components/withdrawals-summary';

export type WithdrawalsPageProps = {
    wallets: Array<Record<string, unknown>>;
    withdrawals: Array<Record<string, unknown>>;
    filters: {
        from: string;
        to: string;
        status?: string | null;
        sort?: string | null;
    };
    stats: {
        total_withdrawals: number;
        total_amount: number;
        pending_amount: number;
        completed_amount: number;
    };
};

function buildFilterParams(
    filters: WithdrawalsPageProps['filters'],
    overrides: Partial<WithdrawalsPageProps['filters']> = {},
): Record<string, string> {
    const next = { ...filters, ...overrides };
    const params: Record<string, string> = {
        from: next.from,
        to: next.to,
    };

    if (next.status) {
        params.status = next.status;
    }

    if (next.sort) {
        params.sort = next.sort;
    }

    return params;
}

export default function WithdrawalsPage({
    withdrawals,
    filters,
    stats,
}: WithdrawalsPageProps) {
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

    const hasActiveFilters = Boolean(filters.status);

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
        overrides: Partial<WithdrawalsPageProps['filters']> = {},
    ) => {
        router.get(
            withdrawalsIndex({ company: company.username }),
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
            activeMenuIds={['funds.withdrawals']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Withdrawals' }]}
        >
            <Head title="Withdrawals" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                            <ArrowDownRightIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Withdrawals" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Transfer wallet balance to your bank accounts." />
                            </p>
                        </div>
                    </div>

                    <CreateWithdrawalButton />
                </header>

                <WithdrawalsSummary
                    totalAmount={stats.total_amount}
                    totalCount={stats.total_withdrawals}
                    pendingAmount={stats.pending_amount}
                    completedAmount={stats.completed_amount}
                    periodLabel={periodLabel}
                />

                <Card className="border shadow-sm">
                    <CardHeader className="gap-4 border-b pb-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <ArrowDownRightIcon className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    <FormattedMessage defaultMessage="Activity" />
                                </CardTitle>
                                <CardDescription>
                                    <FormattedMessage
                                        defaultMessage="{count} results in this period"
                                        values={{ count: withdrawals.length }}
                                    />
                                </CardDescription>
                            </div>
                        </div>

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
                                                    ? undefined
                                                    : status,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-10 w-full sm:w-44">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <FormattedMessage defaultMessage="Any status" />
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            <FormattedMessage defaultMessage="Pending" />
                                        </SelectItem>
                                        <SelectItem value="processing">
                                            <FormattedMessage defaultMessage="Processing" />
                                        </SelectItem>
                                        <SelectItem value="paid">
                                            <FormattedMessage defaultMessage="Paid" />
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                            <FormattedMessage defaultMessage="Rejected" />
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            <FormattedMessage defaultMessage="Cancelled" />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filters.sort ?? '-created_at'}
                                    onValueChange={(sort) =>
                                        visitWithFilters({ sort })
                                    }
                                >
                                    <SelectTrigger className="h-10 w-full sm:w-44">
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
                    </CardHeader>

                    <CardContent className="space-y-3 pt-5">
                        {withdrawals.length > 0 ? (
                            withdrawals.map((withdrawal) => (
                                <WithdrawalCard
                                    key={String(withdrawal.id)}
                                    withdrawal={withdrawal as never}
                                />
                            ))
                        ) : (
                            <EmptyWithdrawals
                                showClearFilters={hasActiveFilters}
                                onClearFilters={() =>
                                    visitWithFilters({ status: undefined })
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
