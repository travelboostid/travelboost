import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Head } from '@inertiajs/react';
import { MegaphoneIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import AdPlatformConnections from './components/ad-platform-connections';
import PendingPromotionBudgetTopup from './components/pending-promotion-budget-topup';
import PromotionBudgetSummary from './components/promotion-budget-summary';
import RecentPromotionBudgetTransactions from './components/recent-transactions';

export type PromotionBudgetPageProps = {
    budget: {
        balance: number;
    };
    pendingTopup: Record<string, unknown> | null;
    recentTransactions: Array<{
        id: number;
        type: string;
        platform: string | null;
        amount: number;
        description: string | null;
        created_at: string | null;
    }>;
    adPlatforms: Array<{
        platform: string;
        label: string;
        has_oauth_account: boolean;
        oauth_has_ads_scope: boolean;
        connection: {
            status: string;
            external_account_id: string | null;
            external_account_name: string | null;
            provisioned_at: string | null;
            meta: Record<string, unknown>;
        } | null;
        coming_soon?: boolean;
    }>;
    googleAdsConfigured: boolean;
    metaAdsConfigured: boolean;
};

export default function Page() {
    return (
        <CompanyDashboardLayout
            breadcrumb={[{ title: 'Marketing' }, { title: 'Promotion Budget' }]}
            openMenuIds={['marketings']}
            activeMenuIds={['marketings.budgeting']}
        >
            <Head title="Promotion Budget" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header>
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                            <MegaphoneIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Promotion budget" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Top up your promotion budget. Google and Meta ad connections are coming soon." />
                            </p>
                        </div>
                    </div>
                </header>

                <PendingPromotionBudgetTopup />

                <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                    <PromotionBudgetSummary />
                    <RecentPromotionBudgetTransactions />
                </div>

                <AdPlatformConnections />
            </div>
        </CompanyDashboardLayout>
    );
}
