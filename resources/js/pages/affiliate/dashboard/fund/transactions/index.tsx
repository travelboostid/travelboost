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
import { formatIDR } from '@/lib/utils';
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
    if (transactionTypeFilter === 'in') return transaction.type === 'income';
    if (transactionTypeFilter === 'out') return transaction.type === 'expense';
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
    >
      <Head title="Wallet Transactions" />

      <div className="max-w-5xl grid gap-8 mx-auto">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-xs border-slate-200">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {transaction_count.toString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/50 shadow-xs border-emerald-100">
              <CardContent className="pt-6">
                <p className="text-sm text-emerald-800/70 mb-2">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600">
                  +{formatIDR(income_amount)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-rose-50/50 shadow-xs border-rose-100">
              <CardContent className="pt-6">
                <p className="text-sm text-rose-800/70 mb-2">Total Expenses</p>
                <p className="text-2xl font-bold text-rose-600">
                  -{formatIDR(expense_amount)}
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
                className="gap-2 font-normal border-slate-200 shadow-sm bg-white"
              >
                <CalendarIcon className="w-4 h-4" />
                {getDateRangeDisplayText(dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            {transactionTypeFilters.map((filter) => (
              <Button
                key={filter.id}
                onClick={() => setTransactionTypeFilter(filter.id)}
                variant={
                  transactionTypeFilter === filter.id ? 'default' : 'outline'
                }
                className={
                  transactionTypeFilter === filter.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200'
                }
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
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
              <TransactionsList transactions={filteredTransactions} />
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
            You have not made any wallet transactions in the current period.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {transactions.map((transaction: any) => {
        const isIncome = transaction.type === 'income';
        const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {transaction.meta?.description || 'Wallet Transaction'}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {dayjs(transaction.created_at).format('MMM DD, YYYY - HH:mm')}
                </p>
              </div>
            </div>
            <div
              className={`font-semibold text-base ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {isIncome ? '+' : '-'}
              {formatIDR(Math.abs(transaction.amount))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
