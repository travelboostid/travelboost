import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Head } from '@inertiajs/react';
import AiCreditsSummary from './components/ai-credits-summary';
import AiCreditsTopup from './components/ai-credits-topup';
import ChatbotSettings from './components/chatbot-settings';
import DailyUsageStats from './components/daily-usage-stats';

export type ChatbotPageProps = {
    settings: any;
    credit: any;
    dailyStats: any[];
    usageCostToday: any;
    usageCostIn30Days: any;
};

export default function Page() {
    return (
        <CompanyDashboardLayout
            containerClassName="p-4"
            breadcrumb={[{ title: 'Settings' }, { title: 'Chatbot Settings' }]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.chatbot']}
        >
            <Head title="Chatbot Settings" />
            <div className="grid gap-4 container mx-auto max-w-3xl">
                <ChatbotSettings />
                <AiCreditsSummary />
                <AiCreditsTopup />
                <DailyUsageStats />
            </div>
        </CompanyDashboardLayout>
    );
}
