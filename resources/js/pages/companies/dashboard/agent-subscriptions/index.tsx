import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageProps from '@/hooks/use-page-props';
import { Head } from '@inertiajs/react';
import { CrownIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { CurrentSubscription } from './components/current-subscription';
import PendingSubscriptionPayment from './components/pending-subscription-payment';
import SubscribePackages from './components/subscribe-packages';
import SubscriptionStatusAlert from './components/subscription-status-alert';

export type AgentSubscriptionPackage = {
    id: number;
    name: string;
    duration_months: number;
    price: number | string;
    is_active?: boolean;
};

export type AgentSubscription = {
    id: number;
    status: 'active' | 'expired' | 'inactive';
    started_at: string | null;
    ended_at: string | null;
    package: AgentSubscriptionPackage;
};

export type AgentSubscriptionPageProps = {
    agentSubscription: AgentSubscription | null;
    agentSubscriptionPackages: AgentSubscriptionPackage[];
    pendingPayment: Record<string, unknown> | null;
};

export default function Page() {
    const { agentSubscription } = usePageProps<AgentSubscriptionPageProps>();
    const hasSubscription = Boolean(agentSubscription);

    return (
        <CompanyDashboardLayout
            openMenuIds={['settings']}
            activeMenuIds={['settings.agent-subscriptions']}
            breadcrumb={[
                { title: 'Settings' },
                { title: 'Agent Subscription' },
            ]}
        >
            <Head title="Agent Subscription" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header>
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <CrownIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Agent subscription" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Manage your plan, renew before expiry, and keep your agent account active." />
                            </p>
                        </div>
                    </div>
                </header>

                <PendingSubscriptionPayment />
                <SubscriptionStatusAlert />

                <div
                    className={
                        hasSubscription
                            ? 'grid gap-6 lg:grid-cols-2 lg:items-stretch'
                            : 'mx-auto max-w-2xl'
                    }
                >
                    {hasSubscription ? <CurrentSubscription /> : null}
                    <SubscribePackages />
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
