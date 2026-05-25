import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PendingWithdrawal from './components/pending-withdrawal';
import RecentCommissions from './components/recent-commissions';
import RecentTransactions from './components/recent-transactions';
import WalletSummary from './components/wallet-summary';

dayjs.extend(relativeTime);

export type WalletPageProps = {
    balance: number;
    income: { this_month: number; last_month: number; growth_pct: number };
    expenses: { this_month: number; last_month: number; growth_pct: number };
    net_change: { this_month: number; last_month: number; growth_pct: number };
    transactions: any[];
    recent_commissions: any[];
    pending_withdrawal: any;
};

export default function AffiliateWalletPage() {
    return (
        <AffiliateDashboardLayout
            activeMenuIds={['fund.wallet']}
            openMenuIds={['fund']}
            breadcrumb={[
                { title: 'Fund', url: '#' },
                { title: 'Wallet', url: '/affiliate/dashboard/fund/wallet' },
            ]}
        >
            <Head title="Wallet" />
            <div className="max-w-6xl mx-auto grid gap-4">
                <WalletSummary />
                <PendingWithdrawal />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <RecentCommissions />
                    <RecentTransactions />
                </div>
            </div>
        </AffiliateDashboardLayout>
    );
}
