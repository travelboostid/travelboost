import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePageProps from '@/hooks/use-page-props';
import { Deferred, Head, router } from '@inertiajs/react';
import 'dayjs/locale/id';
import { BarChart3Icon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AnalyticsConnectionMenu } from './components/analytics-connection-menu';
import {
    AnalyticsOverviewSkeleton,
    AnalyticsRealtimeSkeleton,
} from './components/analytics-dashboard-skeleton';
import AnalyticsOverviewContent from './components/analytics-overview-content';
import AnalyticsRealtimeContent from './components/analytics-realtime-content';
import { GoogleAccountUnlinked } from './components/google-account-unlinked';
import { GoogleAnalyticsUnlinked } from './components/google-analytics-unlinked';

export type AnalyticsPageProps = {
    account: {
        email?: string;
        name?: string;
    } | null;
    analytics: {
        measurement_id?: string;
        property_id?: string;
        website_url?: string;
    } | null;
    insights?: {
        overview: {
            users: number;
            sessions: number;
            page_views: number;
            bounce_rate: number;
        };
        devices: Array<Record<string, unknown>>;
        channels: Array<Record<string, unknown>>;
        countries: Array<Record<string, unknown>>;
        browsers: Array<Record<string, unknown>>;
        social_sources: Array<Record<string, unknown>>;
    } | null;
    realtimeInsights?: {
        overview: {
            active_users: number;
            page_views: number;
            events: number;
        };
        devices: Array<Record<string, unknown>>;
        countries: Array<Record<string, unknown>>;
        pages: Array<Record<string, unknown>>;
        events: Array<Record<string, unknown>>;
    } | null;
};

export default function AnalyticsPage({
    account,
    analytics,
}: AnalyticsPageProps) {
    const intl = useIntl();
    const { company } = usePageProps();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const isConnected = Boolean(account && analytics);

    const handleRefreshRealtime = () => {
        setRefreshing(true);

        router.reload({
            only: ['realtimeInsights'],
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Analytics',
                    }),
                },
            ]}
            activeMenuIds={['marketings.analytics']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Google Analytics',
                })}
            />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <BarChart3Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Analytics" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="Track visitor behavior and marketing performance for {companyName}."
                                    values={{ companyName: company.name }}
                                />
                            </p>
                        </div>
                    </div>

                    {isConnected && analytics?.measurement_id ? (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <Badge
                                variant="secondary"
                                className="font-mono text-xs"
                            >
                                GA4 · {analytics.measurement_id}
                            </Badge>
                            {analytics.website_url ? (
                                <Badge variant="outline" className="text-xs">
                                    {analytics.website_url}
                                </Badge>
                            ) : null}
                            <AnalyticsConnectionMenu />
                        </div>
                    ) : !account ? (
                        <Badge
                            variant="outline"
                            className="w-fit text-xs sm:shrink-0"
                        >
                            <FormattedMessage defaultMessage="Step 1 of 2 · Google account" />
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="w-fit text-xs sm:shrink-0"
                        >
                            <FormattedMessage defaultMessage="Step 2 of 2 · Analytics property" />
                        </Badge>
                    )}
                </header>

                {!account && <GoogleAccountUnlinked />}
                {account && !analytics && <GoogleAnalyticsUnlinked />}

                {isConnected ? (
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="gap-6"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <TabsList>
                                <TabsTrigger value="overview">
                                    <BarChart3Icon />
                                    <FormattedMessage defaultMessage="Last 30 days" />
                                </TabsTrigger>
                                <TabsTrigger value="realtime">
                                    <span className="relative flex items-center gap-1.5">
                                        <span className="relative flex size-2">
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                        </span>
                                        <FormattedMessage defaultMessage="Live" />
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            {activeTab === 'realtime' ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={refreshing}
                                    onClick={handleRefreshRealtime}
                                    className="w-full sm:w-auto"
                                >
                                    <RefreshCwIcon
                                        className={
                                            refreshing ? 'animate-spin' : ''
                                        }
                                    />
                                    <FormattedMessage defaultMessage="Refresh live data" />
                                </Button>
                            ) : null}
                        </div>

                        <TabsContent value="overview" className="space-y-6">
                            <Deferred
                                data="insights"
                                fallback={<AnalyticsOverviewSkeleton />}
                            >
                                <AnalyticsOverviewContent />
                            </Deferred>
                        </TabsContent>

                        <TabsContent value="realtime" className="space-y-6">
                            <Deferred
                                data="realtimeInsights"
                                fallback={<AnalyticsRealtimeSkeleton />}
                            >
                                <AnalyticsRealtimeContent />
                            </Deferred>
                        </TabsContent>
                    </Tabs>
                ) : null}
            </div>
        </CompanyDashboardLayout>
    );
}
