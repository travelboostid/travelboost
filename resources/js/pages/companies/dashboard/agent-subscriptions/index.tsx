import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CurrentSubscription } from './components/current-subscription';
import ExtendSubscriptionCard from './components/extend-subscription-card';
import SubscriptionAlert from './components/subscription-alert';

dayjs.extend(relativeTime);

export type AgentSubscriptionPageProps = {
    agentSubscription: any | null;
    agentSubscriptionPackages: any[];
};

export default function Page({
    agentSubscription,
}: AgentSubscriptionPageProps) {
    return (
        <CompanyDashboardLayout
            openMenuIds={['settings']}
            activeMenuIds={['settings.agent-subscriptions']}
            containerClassName="mx-auto max-w-4xl w-full space-y-8 p-4"
            breadcrumb={[
                { title: 'Settings' },
                { title: 'Agent Subscriptions' },
            ]}
        >
            {agentSubscription ? (
                <>
                    {/* Current Subscription Section */}
                    <CurrentSubscription />
                    {/* Payment History Section */}
                    <ExtendSubscriptionCard />
                </>
            ) : (
                <SubscriptionAlert />
            )}
        </CompanyDashboardLayout>
    );
}
