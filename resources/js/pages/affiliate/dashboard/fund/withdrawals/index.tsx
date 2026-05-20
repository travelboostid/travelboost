import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
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
    filters: { from?: string; to?: string };
    stats: {
        total_withdrawals: number;
        total_amount: number;
        pending_amount: number;
        completed_amount: number;
    };
};

export default function AffiliateWithdrawalsPage({
    withdrawals,
    filters,
    stats,
}: WithdrawalsPageProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (!filters.from && !filters.to) return undefined;
        return {
            from: filters.from ? dayjs(filters.from).toDate() : undefined,
            to: filters.to ? dayjs(filters.to).toDate() : undefined,
        };
    });

    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const filteredWithdrawals = useMemo(() => {
        let filtered = withdrawals;
        if (statusFilter !== 'all') {
            filtered = filtered.filter((w) => w.status === statusFilter);
        }
        return filtered.sort((a, b) => {
            const dateA = dayjs(a.created_at);
            const dateB = dayjs(b.created_at);
            return sortOrder === 'newest'
                ? dateB.valueOf() - dateA.valueOf()
                : dateA.valueOf() - dateB.valueOf();
        });
    }, [withdrawals, statusFilter, sortOrder]);

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        const params: Record<string, string> = {};
        if (range?.from) params.from = dayjs(range.from).format('YYYY-MM-DD');
        if (range?.to) params.to = dayjs(range.to).format('YYYY-MM-DD');

        router.get('/affiliate/dashboard/fund/withdrawals', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AffiliateDashboardLayout
            activeMenuIds={['fund.withdrawals']}
            openMenuIds={['fund']}
            breadcrumb={[
                { title: 'Fund', url: '#' },
                {
                    title: 'Withdrawals',
                    url: '/affiliate/dashboard/fund/withdrawals',
                },
            ]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head title="Withdrawals" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Withdrawal History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor all your commission withdrawal requests and their current
            status.
          </p>
        </div> */}

                <WithdrawalsSummary stats={stats} />

                <FilterBar
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    sortOrder={sortOrder}
                    onSortOrderChange={setSortOrder}
                />

                <section className="space-y-3">
                    {filteredWithdrawals.length > 0 ? (
                        filteredWithdrawals.map((withdrawal) => (
                            <WithdrawalCard
                                key={withdrawal.id}
                                withdrawal={withdrawal}
                            />
                        ))
                    ) : (
                        <EmptyWithdrawals />
                    )}
                </section>
            </div>
        </AffiliateDashboardLayout>
    );
}
