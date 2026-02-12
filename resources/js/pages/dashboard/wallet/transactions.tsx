import { index } from '@/actions/App/Http/Controllers/DashboardWalletTransactionsController';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { ArrowDownLeft, ArrowUpRight, CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

// Type definitions for better type safety
type TransactionType = 'all' | 'in' | 'out';

interface Transaction {
  id: number;
  description: string;
  date: string;
  amount: number;
  type: 'in' | 'out';
  icon: any; // Replace with actual icon type
}

interface TransactionsPageProps {
  from?: string;
  to?: string;
  transaction_count: number;
  income_amount: number;
  expense_amount: number;
  transactions: Transaction[];
}

export default function TransactionsPage({
  from,
  to,
  transaction_count,
  income_amount,
  expense_amount,
  transactions,
}: TransactionsPageProps) {
  // State for transaction type filter (frontend only)
  const [transactionTypeFilter, setTransactionTypeFilter] =
    useState<TransactionType>('all');

  // State for date range with initial values from props
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!from && !to) return undefined;

    return {
      from: from ? dayjs(from).toDate() : undefined,
      to: to ? dayjs(to).toDate() : undefined,
    };
  });

  // Filter transactions based on selected type (frontend filtering)
  const filteredTransactions = transactions.filter((transaction: any) => {
    if (transactionTypeFilter === 'in') return transaction.type === 'income';
    if (transactionTypeFilter === 'out') return transaction.type === 'expense';
    return true; // all
  });

  // Update URL query parameters when date range changes
  const updateDateRangeQuery = (range: DateRange | undefined) => {
    if (!range?.from && !range?.to) {
      // If no date range is selected, remove the query parameters
      router.get(
        index(),
        {},
        {
          preserveState: true,
          replace: true,
        },
      );
      return;
    }

    const params: Record<string, string> = {};

    if (range?.from) {
      params.from = dayjs(range.from).format('YYYY-MM-DD');
    }

    if (range?.to) {
      params.to = dayjs(range.to).format('YYYY-MM-DD');
    }

    router.get(index(), params, {
      preserveState: true,
      replace: true,
    });
  };

  // Handle date range selection with debouncing
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    updateDateRangeQuery(range);
  };

  // Format date range display text
  const getDateRangeDisplayText = (range: DateRange | undefined): string => {
    if (!range?.from) {
      return 'Select date range';
    }

    if (range.to) {
      return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
    }

    return format(range.from, 'MMM dd, yyyy');
  };

  // Transaction type filter buttons configuration
  const transactionTypeFilters = [
    { id: 'all' as const, label: 'All Transactions' },
    { id: 'in' as const, label: 'Income' },
    { id: 'out' as const, label: 'Expenses' },
  ];

  return (
    <DashboardLayout
      activeMenuIds={['funds.wallet-transactions']}
      openMenuIds={['funds']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Wallet' },
        { title: 'Wallet Transactions' },
      ]}
    >
      <Head title="Wallet Transactions" />

      <div className="max-w-4xl grid gap-8 p-4 mx-auto">
        {/* Summary Statistics Section */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Transactions"
              value={transaction_count.toString()}
              variant="neutral"
            />
            <SummaryCard
              title="Total Income"
              value={`+${formatIDR(income_amount)}`}
              variant="income"
            />
            <SummaryCard
              title="Total Expenses"
              value={`-${formatIDR(expense_amount)}`}
              variant="expense"
            />
          </div>
        </section>

        {/* Filters Section */}
        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 font-normal">
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

            {/* Transaction Type Filters */}
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
                      ? 'bg-primary hover:bg-primary/90'
                      : ''
                  }
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Transactions List Section */}
        <section>
          <Card className="border shadow-md">
            <CardHeader className="pb-4">
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
            <CardContent>
              <TransactionsList transactions={filteredTransactions} />
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}

// Helper Components
interface SummaryCardProps {
  title: string;
  value: string;
  variant: 'income' | 'expense' | 'neutral';
}

function SummaryCard({ title, value, variant }: SummaryCardProps) {
  const variantStyles = {
    income: 'border-l-2 border-l-primary',
    expense: 'border-l-2 border-l-destructive',
    neutral: 'border-l-2 border-l-gray-300',
  };

  const valueColors = {
    income: 'text-primary',
    expense: 'text-destructive',
    neutral: 'text-foreground',
  };

  return (
    <Card className={`border-0 shadow-sm ${variantStyles[variant]}`}>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <p className={`text-2xl font-bold ${valueColors[variant]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function TransactionsList({ transactions }: any) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction: any) => {
        const amountColor =
          transaction.type === 'income' ? 'text-primary' : 'text-destructive';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const Icon =
          transaction.type === 'income' ? ArrowUpRight : ArrowDownLeft;

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  transaction.type === 'income'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-destructive/10 text-destructive'
                } group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {transaction.meta?.description || '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dayjs(transaction.date).format('MMM DD, YYYY')}
                </p>
              </div>
            </div>
            <div className={`font-semibold ${amountColor}`}>
              {amountSign}
              {formatIDR(Math.abs(transaction.amount))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function
export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
