import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { formatIDRFull } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { IconFolderCode } from '@tabler/icons-react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { ArrowDownLeft, ArrowUpRight, CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

type TransactionType = 'all' | 'in' | 'out';

export default function TransactionsPage({
    from,
    to,
    transaction_count,
    income_amount,
    expense_amount,
    transactions,
}: any) {
    const [transactionTypeFilter, setTransactionTypeFilter] =
        useState<TransactionType>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (!from && !to) return undefined;
        return {
            from: from ? dayjs(from).toDate() : undefined,
            to: to ? dayjs(to).toDate() : undefined,
        };
    });

    const filteredTransactions = transactions.filter((transaction: any) => {
        if (transactionTypeFilter === 'in')
            return transaction.type === 'income';
        if (transactionTypeFilter === 'out')
            return transaction.type === 'expense';
        return true;
    });

    const updateDateRangeQuery = (range: DateRange | undefined) => {
        if (!range?.from && !range?.to) {
            router.get(
                '/affiliate/dashboard/fund/transactions',
                {},
                { preserveState: true, replace: true },
            );
            return;
        }

        const params: Record<string, string> = {};
        if (range?.from) params.from = dayjs(range.from).format('YYYY-MM-DD');
        if (range?.to) params.to = dayjs(range.to).format('YYYY-MM-DD');

        router.get('/affiliate/dashboard/fund/transactions', params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        updateDateRangeQuery(range);
    };

    const getDateRangeDisplayText = (range: DateRange | undefined): string => {
        if (!range?.from) return 'Select date range';
        if (range.to)
            return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
        return format(range.from, 'MMM dd, yyyy');
    };

    const transactionTypeFilters = [
        { id: 'all' as const, label: 'All Transactions' },
        { id: 'in' as const, label: 'Income' },
        { id: 'out' as const, label: 'Expenses' },
    ];

    return (
        <AffiliateDashboardLayout
            activeMenuIds={['fund.transaction']}
            openMenuIds={['fund']}
            breadcrumb={[
                { title: 'Fund', url: '#' },
                {
                    title: 'Wallet Transactions',
                    url: '/affiliate/dashboard/fund/transactions',
                },
            ]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head title="Wallet Transactions" />

            <div className="max-w-5xl grid gap-8 mx-auto">
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Total Transactions
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {transaction_count.toString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-emerald-50/50 shadow-xs border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                            <CardContent className="pt-6">
                                <p className="text-sm text-emerald-800/70 mb-2 dark:text-emerald-300/80">
                                    Total Income
                                </p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                                    +{formatIDRFull(income_amount)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-rose-50/50 shadow-xs border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20">
                            <CardContent className="pt-6">
                                <p className="text-sm text-rose-800/70 mb-2 dark:text-rose-300/80">
                                    Total Expenses
                                </p>
                                <p className="text-2xl font-bold text-rose-600 dark:text-rose-300">
                                    -{formatIDRFull(expense_amount)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="flex flex-wrap items-center gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="gap-2 bg-white font-normal border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                            >
                                <CalendarIcon className="w-4 h-4" />
                                {getDateRangeDisplayText(dateRange)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0 dark:border-slate-800 dark:bg-slate-900"
                            align="start"
                        >
                            <Calendar
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={handleDateRangeChange}
                                numberOfMonths={2}
                                className="rounded-md border dark:border-slate-800"
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="flex gap-2">
                        {transactionTypeFilters.map((filter) => (
                            <Button
                                key={filter.id}
                                onClick={() =>
                                    setTransactionTypeFilter(filter.id)
                                }
                                variant={
                                    transactionTypeFilter === filter.id
                                        ? 'default'
                                        : 'outline'
                                }
                                className={
                                    transactionTypeFilter === filter.id
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                        : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100'
                                }
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
                </section>

                <section>
                    <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 bg-slate-50 pb-4 dark:border-slate-800 dark:bg-slate-950/60">
                            <CardTitle className="flex items-center gap-2 text-lg dark:text-slate-100">
                                {
                                    transactionTypeFilters.find(
                                        (f) => f.id === transactionTypeFilter,
                                    )?.label
                                }
                                <span className="text-sm font-normal text-muted-foreground">
                                    ({filteredTransactions.length} transactions)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <TransactionsList
                                transactions={filteredTransactions}
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AffiliateDashboardLayout>
    );
}

function TransactionsList({ transactions }: { transactions: any[] }) {
    if (transactions.length === 0) {
        return (
            <Empty className="p-10 border-none">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <IconFolderCode />
                    </EmptyMedia>
                    <EmptyTitle>No Wallet Transactions</EmptyTitle>
                    <EmptyDescription>
                        You have not made any wallet transactions in the current
                        period.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((transaction: any) => {
                const isIncome = transaction.type === 'income';
                const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

                return (
                    <div
                        key={transaction.id}
                        className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`rounded-full p-3 ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'}`}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                    {transaction.meta?.description ||
                                        'Wallet Transaction'}
                                </p>
                                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                    {dayjs(transaction.created_at).format(
                                        'MMM DD, YYYY - HH:mm',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div
                            className={`text-base font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}
                        >
                            {isIncome ? '+' : '-'}
                            {formatIDRFull(Math.abs(transaction.amount))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
