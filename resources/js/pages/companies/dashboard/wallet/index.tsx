import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PendingTopup from './components/pending-topup';
import RecentTransactions from './components/recent-transactions';
import WalletSummary from './components/wallet-summary';
dayjs.extend(relativeTime);

export type WalletPageProps = {
  balance: number;
  income: {
    this_month: number;
    last_month: number;
  };
  expenses: {
    this_month: number;
    last_month: number;
  };
  net_change: {
    growth_pct: number;
  };
  transactions: any[];
};

export default function WalletPage() {
  return (
    <CompanyDashboardLayout
      activeMenuIds={[`funds.wallets`]}
      openMenuIds={['funds']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Wallet' },
      ]}
    >
      <Head title="My Wallet" />
      <div className="max-w-6xl mx-auto grid gap-4 p-4">
        <WalletSummary />
        <PendingTopup />
        <RecentTransactions />
      </div>
    </CompanyDashboardLayout>
  );
}
