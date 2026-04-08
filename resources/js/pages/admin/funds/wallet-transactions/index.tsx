import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Head } from '@inertiajs/react';
import { ArrowLeftRight } from 'lucide-react';

export default function Page() {
  return (
    <AdminDashboardLayout
      containerClassName="p-4"
      activeMenuIds={['fund', 'fund.wallet-transactions']}
      openMenuIds={['fund']}
      breadcrumb={[{ title: 'Fund' }, { title: 'Wallet Transactions' }]}
    >
      <Head title="Wallet Transactions" />
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <ArrowLeftRight className="h-12 w-12" />
        <p className="text-lg font-medium">Wallet Transactions</p>
        <p className="text-sm">Coming soon — transaction history across all companies.</p>
      </div>
    </AdminDashboardLayout>
  );
}
