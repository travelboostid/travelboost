import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Head } from '@inertiajs/react';
import { CreditCardIcon } from 'lucide-react';

export default function Page() {
  return (
    <AdminDashboardLayout
      containerClassName="p-4"
      activeMenuIds={['fund', 'fund.payment-history']}
      openMenuIds={['fund']}
      breadcrumb={[{ title: 'Fund' }, { title: 'Payment History' }]}
    >
      <Head title="Payment History" />
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <CreditCardIcon className="h-12 w-12" />
        <p className="text-lg font-medium">Payment History</p>
        <p className="text-sm">Coming soon — payment records across all companies.</p>
      </div>
    </AdminDashboardLayout>
  );
}
