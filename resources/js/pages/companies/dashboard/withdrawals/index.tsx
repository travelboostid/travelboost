import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { CreateWithdrawalButton } from './components/create-withdrawal-button';
import EmptyWithdrawals from './components/empty-withdrawals';
import FilterBar from './components/filter-bar';
import WithdrawalCard from './components/withdrawal-card';
import WithdrawalsSummary from './components/withdrawals-summary';

export type WithdrawalsPageProps = {
    wallets: any[];
    withdrawals: any[];
    filters: {
        from?: string;
        to?: string;
        status?: string;
        sort?: string;
    };
    stats: {
        total_withdrawals: number;
        total_amount: number;
        pending_amount: number;
        completed_amount: number;
    };
};

// Main component
export default function WithdrawalsPage({ withdrawals }: WithdrawalsPageProps) {
    return (
        <CompanyDashboardLayout
            activeMenuIds={['funds.withdrawals']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Withdrawals' }]}
            applet={<CreateWithdrawalButton />}
        >
            <Head title="Withdrawals" />

            <div className="max-w-5xl mx-auto p-4 space-y-6">
                <WithdrawalsSummary />
                <Card>
                    <CardHeader className="border-b">
                        <FilterBar />
                    </CardHeader>
                    <CardContent>
                        {/* Withdrawals list */}
                        <section className="space-y-2">
                            {withdrawals.length > 0 ? (
                                withdrawals.map((withdrawal) => (
                                    <WithdrawalCard
                                        key={withdrawal.id}
                                        withdrawal={withdrawal}
                                    />
                                ))
                            ) : (
                                <EmptyWithdrawals />
                            )}
                        </section>
                    </CardContent>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
