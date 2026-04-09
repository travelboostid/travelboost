import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Head } from '@inertiajs/react';
import { WalletIcon } from 'lucide-react';

export default function Page() {
  return (
    <AdminDashboardLayout
      containerClassName="p-4"
      activeMenuIds={['fund', 'fund.wallets']}
      openMenuIds={['fund']}
      breadcrumb={[{ title: 'Fund' }, { title: 'Wallet' }]}
    >
      <Head title="Wallets" />
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <WalletIcon className="h-12 w-12" />
        <p className="text-lg font-medium">Wallet Overview</p>
        <p className="text-sm">Coming soon — global wallet data across all companies.</p>
      </div>
    </AdminDashboardLayout>
  );
}
