import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageProps from '@/hooks/use-page-props';
import { Head } from '@inertiajs/react';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { SectionCards } from './components/section-cards';
import SubscriptionAlert from './components/subscription-alert';

export type HomePageProps = {
  agentSubscription: any | null;
};

export default function Home() {
  const { company } = usePageProps<HomePageProps>();
  return (
    <CompanyDashboardLayout
      activeMenuIds={[`home`]}
      breadcrumb={[{ title: 'Dashboard', url: '/dashboard' }]}
    >
      <Head title="Home" />
      <div className="grid grid-cols-1 gap-4 p-4">
        {company.type === 'agent' && <SubscriptionAlert />}
        <SectionCards />
        <ChartAreaInteractive />
      </div>
    </CompanyDashboardLayout>
  );
}
