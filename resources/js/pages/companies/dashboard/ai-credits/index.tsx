import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import AiCreditsInfo from './components/ai-credits-info';
import AiCreditsSummary from './components/ai-credits-summary';
import AiCreditsTopup from './components/ai-credits-topup';
import DailyUsageStats from './components/daily-usage-stats';

export type AiCreditsPageProps = {
  ai_credits: number;
};

export default function AiCreditsPage() {
  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'AI Credits' }]}
    >
      <div className="grid gap-4">
        <AiCreditsInfo />
        <AiCreditsSummary />
        <AiCreditsTopup />
        <DailyUsageStats />
      </div>
    </CompanyDashboardLayout>
  );
}
