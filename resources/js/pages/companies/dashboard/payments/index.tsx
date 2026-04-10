import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { Plus, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import FilterBar from './components/filter-bar';
import PaymentCard from './components/payment-card';
import PaymentsSummary from './components/payments-summary';

export type PaymentsPageProps = {
  payments: any[];
  filters?: {
    from?: string;
    to?: string;
  };
};

export default function Page({ payments, filters }: PaymentsPageProps) {
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
    const filtered = payments.filter((payment) => {
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

  return (
    <CompanyDashboardLayout
      breadcrumb={[{ title: 'Funds' }, { title: 'Payments' }]}
      openMenuIds={['funds']}
      activeMenuIds={['funds.payments']}
    >
      <Head title="Payments" />

      <div className="mx-auto p-4 space-y-6">
        {/* Stats */}
        <PaymentsSummary />

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
    </CompanyDashboardLayout>
  );
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
