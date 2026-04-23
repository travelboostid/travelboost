import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Head } from '@inertiajs/react';

export default function Home() {
  return (
    <AdminDashboardLayout
      activeMenuIds={['dashboard']}
      breadcrumb={[{ title: 'Dashboard' }]}
    >
      <Head title="Admin Dashboard" />
      <div className="grid grid-cols-1 gap-4 p-4">Home</div>
    </AdminDashboardLayout>
  );
}
