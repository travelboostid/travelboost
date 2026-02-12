import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Head } from '@inertiajs/react';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { SectionCards } from './components/section-cards';

export default function Home() {
  return (
    <DashboardLayout
      activeMenuIds={[`home`]}
      breadcrumb={[{ title: 'Dashboard', url: '/dashboard' }]}
    >
      <Head title="Preferences" />
      <div className="grid grid-cols-1 gap-4 p-4">
        <SectionCards />
        <ChartAreaInteractive />
      </div>
    </DashboardLayout>
  );
}
