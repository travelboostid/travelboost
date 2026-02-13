import type { PaymentResource } from '@/api/model';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
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
import { Separator } from '@/components/ui/separator';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import {
  ArrowDown,
  ArrowUp,
  CalendarIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Receipt,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

// Simple status badge with shadcn theme colors
function PaymentStatus({ status }: { status: string }) {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      className:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
  };

  const {
    label,
    icon: Icon,
    className,
  } = config[status as keyof typeof config] || {
    label: status,
    icon: Clock,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge className={`gap-1.5 px-3 py-1 ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Badge>
  );
}

// Simple payment icon with theme colors
function PaymentTypeIcon({ type }: { type: string }) {
  const config = {
    'wallet-topup': { icon: Wallet, className: 'bg-primary/10 text-primary' },
    payment: {
      icon: CreditCard,
      className: 'bg-secondary/10 text-secondary-foreground',
    },
    refund: { icon: Receipt, className: 'bg-muted text-muted-foreground' },
  };

  const { icon: Icon, className } = config[type as keyof typeof config] || {
    icon: CreditCard,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <div className={`p-2.5 rounded-full ${className}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function PaymentCard({ payment }: { payment: PaymentResource }) {
  const paymentType = useMemo(() => {
    const types: Record<string, string> = {
      'wallet-topup': 'Wallet Top-up',
      payment: 'Payment',
      refund: 'Refund',
    };
    return types[payment.payable_type] || 'Unknown Payment';
  }, [payment.payable_type]);

  return (
    <Item variant="outline" className="hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 p-4">
        <PaymentTypeIcon type={payment.payable_type} />
        <ItemContent>
          <div className="flex items-center gap-3">
            <ItemTitle className="font-semibold">
              {formatIDR(payment.amount)}
            </ItemTitle>
            <span className="text-xs text-muted-foreground">
              {dayjs(payment.created_at).format('MMM DD, YYYY')}
            </span>
          </div>
          <ItemDescription className="flex items-center gap-2">
            <span>{paymentType}</span>
            {payment.reference && (
              <>
                <span>•</span>
                <span className="text-xs font-mono">
                  Ref: {payment.reference}
                </span>
              </>
            )}
          </ItemDescription>
        </ItemContent>
      </div>
      <ItemActions className="pr-4">
        <PaymentStatus status={payment.status || 'completed'} />
      </ItemActions>
    </Item>
  );
}

// Simplified summary cards with theme colors
function SummaryStats({ payments }: { payments: PaymentResource[] }) {
  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter((p) => p.status === 'completed').length;
    const pending = payments.filter((p) => p.status === 'pending').length;
    return { total, completed, pending };
  }, [payments]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-primary">
            {formatIDR(stats.total)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {payments.length} transactions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-primary">{stats.completed}</p>
          <p className="text-xs text-muted-foreground mt-1">Payments</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {formatIDR(payments.length ? stats.total / payments.length : 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Simplified filter bar
function FilterBar({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortOrder,
  onSortOrderChange,
}: {
  dateRange?: DateRange;
  onDateRangeChange: (range?: DateRange) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortOrderChange: (value: 'newest' | 'oldest') => void;
}) {
  const getDateRangeText = (range?: DateRange) => {
    if (!range?.from) return 'Date range';
    if (!range.to) return format(range.from, 'MMM dd, yyyy');
    return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-lg border">
      {/* Date filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            {getDateRangeText(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>

      {/* Status filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      {/* Type filter */}
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="wallet-topup">Wallet Top-up</SelectItem>
          <SelectItem value="payment">Payment</SelectItem>
          <SelectItem value="refund">Refund</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Sort order */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() =>
          onSortOrderChange(sortOrder === 'newest' ? 'oldest' : 'newest')
        }
      >
        {sortOrder === 'newest' ? (
          <ArrowDown className="w-4 h-4" />
        ) : (
          <ArrowUp className="w-4 h-4" />
        )}
        {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
      </Button>
    </div>
  );
}

export default function Payments({
  payments,
  filters,
}: {
  payments: PaymentResource[];
  filters?: any;
}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!filters?.from && !filters?.to) return undefined;
    return {
      from: filters.from ? dayjs(filters.from).toDate() : undefined,
      to: filters.to ? dayjs(filters.to).toDate() : undefined,
    };
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    // Filter
    let filtered = payments.filter((payment) => {
      if (statusFilter !== 'all' && payment.status !== statusFilter)
        return false;
      if (typeFilter !== 'all' && payment.payable_type !== typeFilter)
        return false;
      if (dateRange?.from) {
        const paymentDate = dayjs(payment.created_at);
        if (paymentDate.isBefore(dayjs(dateRange.from), 'day')) return false;
        if (dateRange.to && paymentDate.isAfter(dayjs(dateRange.to), 'day'))
          return false;
      }
      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      const dateA = dayjs(a.created_at);
      const dateB = dayjs(b.created_at);
      return sortOrder === 'newest'
        ? dateB.valueOf() - dateA.valueOf()
        : dateA.valueOf() - dateB.valueOf();
    });
  }, [payments, statusFilter, typeFilter, dateRange, sortOrder]);

  const handleDateRangeChange = (range?: DateRange) => {
    setDateRange(range);
    const params: Record<string, string> = {};
    if (range?.from) params.from = dayjs(range.from).format('YYYY-MM-DD');
    if (range?.to) params.to = dayjs(range.to).format('YYYY-MM-DD');
    router.get(window.location.pathname, params, {
      preserveState: true,
      replace: true,
    });
  };

  const totalAmount = useMemo(
    () => filteredAndSortedPayments.reduce((sum, p) => sum + p.amount, 0),
    [filteredAndSortedPayments],
  );

  return (
    <DashboardLayout
      activeMenuIds={['funds.payments']}
      openMenuIds={['funds']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Wallet', url: '/wallet' },
        { title: 'Payments' },
      ]}
    >
      <Head title="Payments" />

      <div className="mx-auto p-4 space-y-6">
        {/* Stats */}
        <SummaryStats payments={payments} />

        {/* Filters */}
        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        <Separator />

        {/* Results info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {filteredAndSortedPayments.length} of {payments.length}{' '}
            payments
          </span>
          {filteredAndSortedPayments.length > 0 && (
            <span className="font-medium">Total: {formatIDR(totalAmount)}</span>
          )}
        </div>

        {/* Payments list */}
        <section className="space-y-2">
          {filteredAndSortedPayments.length > 0 ? (
            filteredAndSortedPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Wallet className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No payments found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {payments.length === 0
                    ? "You haven't made any payments yet"
                    : 'No payments match your current filters'}
                </p>
                {payments.length === 0 && (
                  <Button size="sm" variant="outline" className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    New Payment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
