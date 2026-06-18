import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { create as createCampaign } from '@/routes/companies/dashboard/marketing/campaigns';
import { Head, Link } from '@inertiajs/react';
import { IconBrandGoogle, IconBrandMeta } from '@tabler/icons-react';
import { ChevronDownIcon, MegaphoneIcon, PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import AdCampaignsComingSoon from './components/ad-campaigns-coming-soon';
import AdPlatformSetupBanner from './components/ad-platform-setup-banner';
import CampaignBudgetHighlight from './components/campaign-budget-highlight';
import CampaignListItem from './components/campaign-list-item';
import useMarketingFlash from './components/use-marketing-flash';

export type AdCampaignsPageProps = {
    campaigns: Array<{
        id: number;
        platform: string;
        name: string;
        status: string;
        daily_budget: number;
        final_url: string;
        lifetime_spend: number;
        external_campaign_id: string | null;
        created_at: string | null;
    }>;
    budgetBalance: number;
    adCampaignsEnabled: boolean;
    googleAdsReady: boolean;
    googleAdsConnectionStatus?: string;
    metaAdsReady: boolean;
    metaAdsConnectionStatus?: string;
    defaultLandingPageUrl: string | null;
    googleAdsConfigured: boolean;
    metaAdsConfigured: boolean;
};

type PlatformFilter = 'all' | 'google' | 'meta';

export default function Page() {
    useMarketingFlash();

    const {
        campaigns,
        budgetBalance,
        adCampaignsEnabled,
        googleAdsReady,
        googleAdsConnectionStatus,
        metaAdsReady,
        metaAdsConnectionStatus,
        googleAdsConfigured,
        metaAdsConfigured,
    } = usePageProps<AdCampaignsPageProps>();
    const { company, marketingFeatures } = usePageSharedDataProps() as {
        company: { username: string };
        marketingFeatures?: { google_ads: boolean; meta_ads: boolean };
    };
    const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');

    const googleAdsEnabled = marketingFeatures?.google_ads ?? false;
    const metaAdsEnabled = marketingFeatures?.meta_ads ?? false;

    const filteredCampaigns = useMemo(() => {
        if (platformFilter === 'all') {
            return campaigns;
        }

        return campaigns.filter(
            (campaign) => campaign.platform === platformFilter,
        );
    }, [campaigns, platformFilter]);

    const activeCampaignCount = campaigns.filter(
        (campaign) => campaign.status === 'active',
    ).length;
    const totalSpend = campaigns.reduce(
        (sum, campaign) => sum + campaign.lifetime_spend,
        0,
    );

    const anyPlatformReady = googleAdsReady || metaAdsReady;

    return (
        <CompanyDashboardLayout
            breadcrumb={[{ title: 'Marketing' }, { title: 'Ad Campaigns' }]}
            openMenuIds={['marketings']}
            activeMenuIds={['marketings.campaigns']}
        >
            <Head title="Ad Campaigns" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <MegaphoneIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                <FormattedMessage defaultMessage="Ad campaigns" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Run Google and Meta campaigns from your promotion budget." />
                            </p>
                        </div>
                    </div>
                    {adCampaignsEnabled ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>
                                    <PlusIcon className="size-4" />
                                    <FormattedMessage defaultMessage="Create campaign" />
                                    <ChevronDownIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {googleAdsEnabled ? (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`${createCampaign(company.username).url}?platform=google`}
                                        >
                                            <IconBrandGoogle className="size-4 text-[#4285F4]" />
                                            <FormattedMessage defaultMessage="Google Performance Max" />
                                        </Link>
                                    </DropdownMenuItem>
                                ) : null}
                                {metaAdsEnabled ? (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`${createCampaign(company.username).url}?platform=meta`}
                                        >
                                            <IconBrandMeta className="size-4 text-[#1877F2]" />
                                            <FormattedMessage defaultMessage="Meta traffic campaign" />
                                        </Link>
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                </header>

                {!adCampaignsEnabled ? (
                    <AdCampaignsComingSoon companyUsername={company.username} />
                ) : (
                    <>
                        <CampaignBudgetHighlight
                            companyUsername={company.username}
                            budgetBalance={budgetBalance}
                            activeCampaignCount={activeCampaignCount}
                            totalSpend={totalSpend}
                        />

                        {googleAdsEnabled && !googleAdsReady ? (
                            <AdPlatformSetupBanner
                                platform="google"
                                companyUsername={company.username}
                                connectionStatus={googleAdsConnectionStatus}
                                platformConfigured={googleAdsConfigured}
                                hasBudget={budgetBalance > 0}
                            />
                        ) : null}

                        {metaAdsEnabled && !metaAdsReady ? (
                            <AdPlatformSetupBanner
                                platform="meta"
                                companyUsername={company.username}
                                connectionStatus={metaAdsConnectionStatus}
                                platformConfigured={metaAdsConfigured}
                                hasBudget={budgetBalance > 0}
                            />
                        ) : null}

                        {campaigns.length === 0 ? (
                            anyPlatformReady ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                                        <div className="flex gap-3">
                                            {googleAdsEnabled ? (
                                                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#4285F4]/10">
                                                    <IconBrandGoogle className="size-7 text-[#4285F4]" />
                                                </div>
                                            ) : null}
                                            {metaAdsEnabled ? (
                                                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#1877F2]/10">
                                                    <IconBrandMeta className="size-7 text-[#1877F2]" />
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="max-w-md space-y-2">
                                            <p className="text-lg font-semibold">
                                                <FormattedMessage defaultMessage="No campaigns yet" />
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                <FormattedMessage defaultMessage="Launch your first campaign to drive traffic to your landing page." />
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="lg">
                                                    <PlusIcon className="size-4" />
                                                    <FormattedMessage defaultMessage="Create your first campaign" />
                                                    <ChevronDownIcon className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {googleAdsReady ? (
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`${createCampaign(company.username).url}?platform=google`}
                                                        >
                                                            <FormattedMessage defaultMessage="Google Performance Max" />
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ) : null}
                                                {metaAdsReady ? (
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`${createCampaign(company.username).url}?platform=meta`}
                                                        >
                                                            <FormattedMessage defaultMessage="Meta traffic campaign" />
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ) : null}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardContent>
                                </Card>
                            ) : null
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-sm font-medium text-muted-foreground">
                                        <FormattedMessage
                                            defaultMessage="{count, plural, one {# campaign} other {# campaigns}}"
                                            values={{
                                                count: filteredCampaigns.length,
                                            }}
                                        />
                                    </h2>
                                    <div className="flex gap-2">
                                        {(
                                            [
                                                ['all', 'All'],
                                                ['google', 'Google'],
                                                ['meta', 'Meta'],
                                            ] as const
                                        ).map(([value, label]) => (
                                            <Button
                                                key={value}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    platformFilter === value
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    setPlatformFilter(value)
                                                }
                                            >
                                                {label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                {filteredCampaigns.map((campaign) => (
                                    <CampaignListItem
                                        key={campaign.id}
                                        campaign={campaign}
                                        companyUsername={company.username}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
