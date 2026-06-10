import { index as walletTransactionsIndex } from '@/actions/App/Http/Controllers/Companies/Dashboard/WalletTransactionsController';
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
import WalletSelectorApplet, {
    buildWalletQueryParams,
    type WalletOption,
} from '@/components/wallet/wallet-selector-applet';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { index as walletsIndex } from '@/routes/companies/dashboard/wallets';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CalendarIcon,
    ReceiptTextIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { FormattedMessage } from 'react-intl';
import PeriodSummary from './components/period-summary';
import TransactionList, {
    type WalletTransaction,
} from './components/transaction-list';

export type TransactionTypeFilter = 'all' | 'income' | 'expense';

type TransactionsPageProps = {
    filters: {
        wallet: string;
        from: string;
        to: string;
        type: TransactionTypeFilter;
    };
    wallet: WalletOption;
    wallets: WalletOption[];
    transaction_count: number;
    income_amount: number;
    expense_amount: number;
    transactions: WalletTransaction[];
};

const TYPE_FILTERS: Array<{
    id: TransactionTypeFilter;
    label: React.ReactNode;
}> = [
    { id: 'all', label: <FormattedMessage defaultMessage="All" /> },
    { id: 'income', label: <FormattedMessage defaultMessage="Income" /> },
    { id: 'expense', label: <FormattedMessage defaultMessage="Expenses" /> },
];

function buildFilterParams(
    filters: TransactionsPageProps['filters'],
    overrides: Partial<TransactionsPageProps['filters']> = {},
): Record<string, string> {
    const next = { ...filters, ...overrides };
    const params: Record<string, string> = {
        from: next.from,
        to: next.to,
    };

    if (next.type !== 'all') {
        params.type = next.type;
    }

    return buildWalletQueryParams(next.wallet, params);
}

export default function TransactionsPage({
    filters,
    wallet,
    wallets,
    transaction_count,
    income_amount,
    expense_amount,
    transactions,
}: TransactionsPageProps) {
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

    const hasNonDefaultType = filters.type !== 'all';

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
        overrides: Partial<TransactionsPageProps['filters']> = {},
    ) => {
        router.get(
            walletTransactionsIndex({ company: company.username }),
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
            activeMenuIds={['funds.wallet-transactions']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Wallet Transactions' }]}
            applet={
                <WalletSelectorApplet
                    wallets={wallets}
                    selectedSlug={wallet.slug}
                    href={walletTransactionsIndex({
                        company: company.username,
                    })}
                    queryParams={buildFilterParams(filters)}
                />
            }
        >
            <Head title="Wallet Transactions" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="-ml-2 mb-1 h-8 gap-1.5 px-2 text-muted-foreground"
                        >
                            <Link
                                href={walletsIndex({
                                    company: company.username,
                                    query: buildWalletQueryParams(wallet.slug),
                                })}
                            >
                                <ArrowLeftIcon className="size-4" />
                                <FormattedMessage defaultMessage="Back to wallet" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ReceiptTextIcon className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    <FormattedMessage defaultMessage="Wallet transactions" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage defaultMessage="Review income, expenses, and activity for the selected period." />
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <PeriodSummary
                    incomeAmount={income_amount}
                    expenseAmount={expense_amount}
                    transactionCount={transaction_count}
                    periodLabel={periodLabel}
                />

                <Card className="border shadow-sm">
                    <CardHeader className="gap-4 border-b pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <ReceiptTextIcon className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        <FormattedMessage defaultMessage="Activity" />
                                    </CardTitle>
                                    <CardDescription>
                                        <FormattedMessage
                                            defaultMessage="{count} results · latest 50 shown"
                                            values={{
                                                count: transactions.length,
                                            }}
                                        />
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="hidden shrink-0 sm:inline-flex"
                            >
                                <Link
                                    href={walletsIndex({
                                        company: company.username,
                                        query: buildWalletQueryParams(
                                            wallet.slug,
                                        ),
                                    })}
                                >
                                    <FormattedMessage defaultMessage="Wallet overview" />
                                    <ArrowRightIcon className="size-4" />
                                </Link>
                            </Button>
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
                                                'h-8 flex-1 rounded-md px-4 sm:flex-none',
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

                    <CardContent className="pt-5">
                        <TransactionList
                            transactions={transactions}
                            showClearFilters={hasNonDefaultType}
                            onClearFilters={() =>
                                visitWithFilters({ type: 'all' })
                            }
                        />
                    </CardContent>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
