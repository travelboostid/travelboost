import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Head } from '@inertiajs/react';
import { LandmarkIcon } from 'lucide-react';

export default function Page() {
  return (
    <AdminDashboardLayout
      containerClassName="p-4"
      activeMenuIds={['fund', 'fund.bank-accounts']}
      openMenuIds={['fund']}
      breadcrumb={[{ title: 'Fund' }, { title: 'Bank Accounts' }]}
    >
      <Head title="Bank Accounts" />
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <LandmarkIcon className="h-12 w-12" />
        <p className="text-lg font-medium">Bank Accounts</p>
        <p className="text-sm">Coming soon — view all registered bank accounts.</p>
      </div>
    </AdminDashboardLayout>
  );
}
