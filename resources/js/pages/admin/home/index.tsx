import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Head } from '@inertiajs/react';
import { ChartAreaInteractive } from '@/pages/companies/dashboard/home/components/chart-area-interactive';
import { SectionCards } from '@/pages/companies/dashboard/home/components/section-cards';

export default function Home() {

  return (
    <AdminDashboardLayout
      activeMenuIds={['dashboard']}
      breadcrumb={[{ title: 'Dashboard' }]}
    >
      <Head title="Admin Dashboard" />
      <div className="grid grid-cols-1 gap-4 p-4">
        <SectionCards />
        <ChartAreaInteractive />
      </div>
    </AdminDashboardLayout>
  );
}
