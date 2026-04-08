import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { index } from '@/routes/company/withdrawal';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import EmptyWithdrawals from './components/empty-withdrawals';
import FilterBar from './components/filter-bar';
import WithdrawalCard from './components/withdrawal-card';
import WithdrawalsSummary from './components/withdrawals-summary';

export type WithdrawalsPageProps = {
  withdrawals: any[];
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
};

// Main component
export default function WithdrawalsPage({
  withdrawals,
  filters,
}: WithdrawalsPageProps) {
  const { company } = usePageSharedDataProps();
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

    router.get(index({ company: company.username }), params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

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
        <WithdrawalsSummary />
        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {/* Withdrawals list */}
        <section className="space-y-2">
          {filteredWithdrawals.length > 0 ? (
            filteredWithdrawals.map((withdrawal) => (
              <WithdrawalCard key={withdrawal.id} withdrawal={withdrawal} />
            ))
          ) : (
            <EmptyWithdrawals />
          )}
        </section>
      </div>
    </CompanyDashboardLayout>
  );
}
