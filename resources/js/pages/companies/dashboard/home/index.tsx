import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageProps from '@/hooks/use-page-props';
import { Head } from '@inertiajs/react';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { SectionCards } from './components/section-cards';
import SubscriptionAlert from './components/subscription-alert';
import { TopLists } from './components/top-lists';

export type HomePageProps = {
  agentSubscription: any | null;
  stats: any;
  chartData: any[];
  topDestinations: any[];
  topAgents: any[];
};

export default function Home() {
  const { company, stats, chartData, topDestinations, topAgents } =
    usePageProps<HomePageProps>();

  return (
    <CompanyDashboardLayout
      activeMenuIds={[`home`]}
      breadcrumb={[{ title: 'Dashboard', url: '/dashboard' }]}
    >
      <Head title="Performance Dashboard" />
      <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50/50 min-h-screen">
        {company.type === 'agent' && <SubscriptionAlert />}

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {company.name}!
          </h1>
          <p className="text-muted-foreground">
            Monitor performance and accelerate your growth today.
          </p>
        </div>

        <SectionCards stats={stats} company={company} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartAreaInteractive data={chartData} />
          </div>
          <div className="lg:col-span-1">
            <TopLists
              destinations={topDestinations}
              agents={topAgents}
              type={company.type}
            />
          </div>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
}
