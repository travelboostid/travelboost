import { index } from '@/actions/App/Http/Controllers/Companies/Dashboard/WithdrawalController';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
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
  Banknote,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Landmark,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

// Types
interface Withdrawal {
  id: number;
  amount: number;
  status:
    | 'requested'
    | 'approved'
    | 'processing'
    | 'paid'
    | 'rejected'
    | 'failed';
  created_at: string;
  note?: string;
  approved_at?: string;
  processed_at?: string;
  paid_at?: string;
  bankAccount?: {
    id: number;
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
}

interface WithdrawalsPageProps {
  withdrawals: Withdrawal[];
  filters: {
    from?: string;
    to?: string;
  };
  stats: {
    total_withdrawals: number;
    total_amount: number;
    pending_amount: number;
    completed_amount: number;
  };
}

// Status badge component
function WithdrawalStatus({ status }: { status: string }) {
  const config = {
    requested: {
      label: 'Requested',
      icon: Clock,
      className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle2,
      className: 'bg-primary/20 text-primary hover:bg-primary/30',
    },
    processing: {
      label: 'Processing',
      icon: Clock,
      className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    paid: {
      label: 'Paid',
      icon: CheckCircle2,
      className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      className:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90',
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

// Bank icon component
function BankAccountIcon({
  bankAccount,
}: {
  bankAccount?: Withdrawal['bankAccount'];
}) {
  return (
    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
      <Landmark className="w-4 h-4" />
    </div>
  );
}

// Withdrawal card
function WithdrawalCard({ withdrawal }: { withdrawal: Withdrawal }) {
  const bankDisplay = useMemo(() => {
    if (!withdrawal.bankAccount) return 'Bank Transfer';
    return `${withdrawal.bankAccount.bank_name} • ${withdrawal.bankAccount.account_number.slice(-4)}`;
  }, [withdrawal.bankAccount]);

  return (
    <Item variant="outline" className="hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 p-4">
        <BankAccountIcon bankAccount={withdrawal.bankAccount} />
        <ItemContent>
          <div className="flex items-center gap-3">
            <ItemTitle className="font-semibold text-destructive">
              - {formatIDR(withdrawal.amount)}
            </ItemTitle>
            <span className="text-xs text-muted-foreground">
              {dayjs(withdrawal.created_at).format('MMM DD, YYYY')}
            </span>
          </div>
          <ItemDescription className="flex items-center gap-2">
            <span>{bankDisplay}</span>
            {withdrawal.note && (
              <>
                <span>•</span>
                <span className="text-xs text-muted-foreground">
                  {withdrawal.note}
                </span>
              </>
            )}
          </ItemDescription>
        </ItemContent>
      </div>
      <ItemActions className="pr-4">
        <WithdrawalStatus status={withdrawal.status} />
      </ItemActions>
    </Item>
  );
}

// Summary stats cards
function SummaryStats({ stats }: { stats: WithdrawalsPageProps['stats'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Withdrawals</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.total_withdrawals}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Transactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold text-destructive">
            {formatIDR(stats.total_amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Withdrawn</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-primary">
            {formatIDR(stats.completed_amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Paid</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatIDR(stats.pending_amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Filter bar - EXACTLY like payments
function FilterBar({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: {
  dateRange?: DateRange;
  onDateRangeChange: (range?: DateRange) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortOrderChange: (value: 'newest' | 'oldest') => void;
}) {
  const getDateRangeDisplayText = (range: DateRange | undefined): string => {
    if (!range?.from) return 'Select date range';
    if (range.to)
      return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
    return format(range.from, 'MMM dd, yyyy');
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-lg border shadow-sm">
      {/* Date Range Picker - EXACT same as payments */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <CalendarIcon className="w-4 h-4" />
            {getDateRangeDisplayText(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="requested">Requested</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Sort Button - EXACT same as payments */}
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
        <span className="hidden sm:inline">
          {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
        </span>
      </Button>
    </div>
  );
}

// Main component
export default function WithdrawalsPage({
  withdrawals,
  filters,
  stats,
}: WithdrawalsPageProps) {
  // Initialize date range from server filters - EXACT same as payments
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!filters.from && !filters.to) return undefined;
    return {
      from: filters.from ? dayjs(filters.from).toDate() : undefined,
      to: filters.to ? dayjs(filters.to).toDate() : undefined,
    };
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filter withdrawals based on status only (date is handled by server)
  const filteredWithdrawals = useMemo(() => {
    let filtered = withdrawals;

    // Status filter (frontend only)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((w) => w.status === statusFilter);
    }

    // Sort
    return filtered.sort((a, b) => {
      const dateA = dayjs(a.created_at);
      const dateB = dayjs(b.created_at);
      return sortOrder === 'newest'
        ? dateB.valueOf() - dateA.valueOf()
        : dateA.valueOf() - dateB.valueOf();
    });
  }, [withdrawals, statusFilter, sortOrder]);

  // Handle date range changes - triggers server request - EXACT same as payments
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    const params: Record<string, string> = {};

    if (range?.from) {
      params.from = dayjs(range.from).format('YYYY-MM-DD');
    }

    if (range?.to) {
      params.to = dayjs(range.to).format('YYYY-MM-DD');
    }

    router.get(index(), params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const totalFilteredAmount = useMemo(
    () => filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0),
    [filteredWithdrawals],
  );

  return (
    <CompanyDashboardLayout
      activeMenuIds={['funds.withdrawals']}
      openMenuIds={['funds']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Wallet', url: '/wallet' },
        { title: 'Withdrawals' },
      ]}
    >
      <Head title="Withdrawals" />

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Stats - using server data */}
        <SummaryStats stats={stats} />

        {/* Filters - EXACT same pattern as payments */}
        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        <Separator />

        {/* Results count - EXACT same as payments */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {filteredWithdrawals.length}
            </span>{' '}
            of{' '}
            <span className="font-medium text-foreground">
              {withdrawals.length}
            </span>{' '}
            withdrawals
          </p>
          {filteredWithdrawals.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Total:{' '}
              <span className="font-semibold text-foreground">
                {formatIDR(totalFilteredAmount)}
              </span>
            </p>
          )}
        </div>

        {/* Active filters display - EXACT same as payments */}
        {(filters.from || filters.to) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active date filter:</span>
            <Badge variant="outline" className="gap-1">
              <CalendarIcon className="w-3 h-3" />
              {filters.from &&
                format(dayjs(filters.from).toDate(), 'MMM dd, yyyy')}
              {filters.from && filters.to && ' - '}
              {filters.to && format(dayjs(filters.to).toDate(), 'MMM dd, yyyy')}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleDateRangeChange(undefined)}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Withdrawals list */}
        <section className="space-y-2">
          {filteredWithdrawals.length > 0 ? (
            filteredWithdrawals.map((withdrawal) => (
              <WithdrawalCard key={withdrawal.id} withdrawal={withdrawal} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Banknote className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No withdrawals found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {withdrawals.length === 0
                    ? "You haven't made any withdrawals yet"
                    : 'No withdrawals match your current filters'}
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </CompanyDashboardLayout>
  );
}

// Helper function
export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
