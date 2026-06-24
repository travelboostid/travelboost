import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import usePageProps from '@/hooks/use-page-props';
import { connect } from '@/routes/companies/dashboard/facebook';
import { Deferred, Head } from '@inertiajs/react';
import { IconBrandFacebook } from '@tabler/icons-react';
import 'dayjs/locale/id';
import { BarChart3Icon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AnalyticsOverviewSkeleton } from '../components/analytics-dashboard-skeleton';
import { AnalyticsProviderTabs } from '../components/analytics-provider-tabs';
import { MetaAccountUnlinked } from '../components/meta-account-unlinked';
import { MetaConnectionMenu } from '../components/meta-connection-menu';
import MetaOverviewContent from '../components/meta-overview-content';
import { MetaPixelUnlinked } from '../components/meta-pixel-unlinked';

export type MetaAnalyticsPageProps = {
    metaAccount: {
        email?: string;
        name?: string;
    } | null;
    metaPixel: {
        pixel_id?: string;
        pixel_name?: string;
        website_url?: string;
        connection_source?: 'oauth' | 'manual';
    } | null;
    metaInsights?: {
        overview: {
            events: number;
            page_views: number;
            unique_events: number;
        };
        events: Array<{
            name: string;
            count: number;
            percentage: number;
        }>;
        urls: Array<{
            name: string;
            count: number;
            percentage: number;
        }>;
        devices: Array<{
            name: string;
            count: number;
            percentage: number;
        }>;
    } | null;
};

export default function MetaAnalyticsPage({
    metaAccount,
    metaPixel,
}: MetaAnalyticsPageProps) {
    const intl = useIntl();
    const { company } = usePageProps();
    const hasPixel = Boolean(metaPixel);
    const canShowInsights =
        hasPixel && metaPixel?.connection_source === 'oauth' && metaAccount;

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
                    defaultMessage: 'Meta Pixel Analytics',
                })}
            />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2]/10 text-[#1877F2]">
                            <IconBrandFacebook className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Analytics" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="Track Meta Pixel events and marketing performance for {companyName}."
                                    values={{ companyName: company.name }}
                                />
                            </p>
                        </div>
                    </div>

                    {hasPixel && metaPixel?.pixel_id ? (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <Badge
                                variant="secondary"
                                className="font-mono text-xs"
                            >
                                Meta · {metaPixel.pixel_id}
                            </Badge>
                            {metaPixel.pixel_name ? (
                                <Badge variant="outline" className="text-xs">
                                    {metaPixel.pixel_name}
                                </Badge>
                            ) : null}
                            <MetaConnectionMenu />
                        </div>
                    ) : !metaAccount ? (
                        <Badge
                            variant="outline"
                            className="w-fit text-xs sm:shrink-0"
                        >
                            <FormattedMessage defaultMessage="Step 1 of 2 · Facebook account" />
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="w-fit text-xs sm:shrink-0"
                        >
                            <FormattedMessage defaultMessage="Step 2 of 2 · Meta Pixel" />
                        </Badge>
                    )}
                </header>

                <AnalyticsProviderTabs activeProvider="meta" />

                {!metaAccount && !hasPixel && <MetaAccountUnlinked />}
                {metaAccount && !hasPixel && <MetaPixelUnlinked />}

                {hasPixel && metaPixel?.connection_source === 'manual' ? (
                    <Alert>
                        <BarChart3Icon />
                        <AlertTitle>
                            <FormattedMessage defaultMessage="Tracking is active" />
                        </AlertTitle>
                        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                <FormattedMessage defaultMessage="Your Meta Pixel is firing on public pages. Connect Facebook to unlock dashboard insights for this pixel." />
                            </span>
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="w-fit"
                            >
                                <a href={connect(company.username).url}>
                                    <FormattedMessage defaultMessage="Connect Facebook" />
                                </a>
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : null}

                {canShowInsights ? (
                    <Deferred
                        data="metaInsights"
                        fallback={<AnalyticsOverviewSkeleton />}
                    >
                        <MetaOverviewContent />
                    </Deferred>
                ) : null}
            </div>
        </CompanyDashboardLayout>
    );
}
