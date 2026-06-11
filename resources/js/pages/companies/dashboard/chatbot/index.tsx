import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Head } from '@inertiajs/react';
import { BotIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import AiCreditsSummary from './components/ai-credits-summary';
import ChatbotSettings from './components/chatbot-settings';
import DailyUsageStats from './components/daily-usage-stats';
import PendingAiCreditTopup from './components/pending-ai-credit-topup';

export type ChatbotPageProps = {
    settings: {
        chatbot_enabled?: boolean;
    };
    credit: {
        balance?: number | string;
    } | null;
    dailyStats: Array<{
        date: string;
        cost: number | string;
        num_interactions: number;
    }>;
    usageCostToday: number | string;
    usageCostIn30Days: number | string;
    pendingTopup: Record<string, unknown> | null;
};

export default function Page() {
    return (
        <CompanyDashboardLayout
            breadcrumb={[{ title: 'Settings' }, { title: 'Chat AI' }]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.chatbot']}
        >
            <Head title="Chat AI" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header>
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <BotIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Chat AI" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Manage AI credits, enable the chatbot, and monitor usage." />
                            </p>
                        </div>
                    </div>
                </header>

                <PendingAiCreditTopup />

                <ChatbotSettings />

                <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                    <AiCreditsSummary />
                    <DailyUsageStats />
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
