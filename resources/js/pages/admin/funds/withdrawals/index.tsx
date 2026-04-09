import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Head } from '@inertiajs/react';
import { BanknoteIcon } from 'lucide-react';

export default function Page() {
  return (
    <AdminDashboardLayout
      containerClassName="p-4"
      activeMenuIds={['fund', 'fund.withdrawals']}
      openMenuIds={['fund']}
      breadcrumb={[{ title: 'Fund' }, { title: 'Withdrawals' }]}
    >
      <Head title="Withdrawals" />
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <BanknoteIcon className="h-12 w-12" />
        <p className="text-lg font-medium">Withdrawal Requests</p>
        <p className="text-sm">Coming soon — manage all withdrawal requests.</p>
      </div>
    </AdminDashboardLayout>
  );
}
