import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { connectAds as connectMetaAds } from '@/routes/companies/dashboard/facebook';
import { connectAds as connectGoogleAds } from '@/routes/companies/dashboard/google';
import { retryProvision as retryGoogleAdsProvisioning } from '@/routes/companies/dashboard/marketing/budget/google';
import { retryProvision as retryMetaAdsProvisioning } from '@/routes/companies/dashboard/marketing/budget/meta';
import { index as campaignsIndex } from '@/routes/companies/dashboard/marketing/campaigns';
import { Link, router } from '@inertiajs/react';
import {
    IconBrandGoogle,
    IconBrandMeta,
    IconBrandTiktok,
} from '@tabler/icons-react';
import { Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import type { PromotionBudgetPageProps } from '..';

function PlatformIcon({ platform }: { platform: string }) {
    if (platform === 'google') {
        return <IconBrandGoogle className="size-5 text-[#4285F4]" />;
    }

    if (platform === 'meta') {
        return <IconBrandMeta className="size-5 text-[#1877F2]" />;
    }

    return <IconBrandTiktok className="size-5" />;
}

function statusLabel(status: string | undefined): React.ReactNode {
    switch (status) {
        case 'connected':
            return <FormattedMessage defaultMessage="Connected" />;
        case 'pending_platform_setup':
            return (
                <FormattedMessage defaultMessage="Awaiting platform setup" />
            );
        case 'pending_provisioning':
            return <FormattedMessage defaultMessage="Provisioning" />;
        case 'provisioning_failed':
            return <FormattedMessage defaultMessage="Setup failed" />;
        default:
            return <FormattedMessage defaultMessage="Not connected" />;
    }
}

export default function AdPlatformConnections() {
    const { adPlatforms, googleAdsConfigured, metaAdsConfigured } =
        usePageProps<PromotionBudgetPageProps>();
    const { company } = usePageSharedDataProps();
    const [retryingPlatform, setRetryingPlatform] = useState<string | null>(
        null,
    );

    const handleRetry = (platform: string) => {
        setRetryingPlatform(platform);
        const retryRoute =
            platform === 'meta'
                ? retryMetaAdsProvisioning(company.username)
                : retryGoogleAdsProvisioning(company.username);

        router.post(
            retryRoute.url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRetryingPlatform(null),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    <FormattedMessage defaultMessage="Ad platforms" />
                </CardTitle>
                <CardDescription>
                    <FormattedMessage defaultMessage="Connect advertising platforms to create campaigns from your promotion budget." />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {adPlatforms.map((platform) => {
                    const connection = platform.connection;
                    const isConnected = connection?.status === 'connected';
                    const isPlatformConfigured =
                        platform.platform === 'meta'
                            ? metaAdsConfigured
                            : googleAdsConfigured;
                    const canRetry =
                        !platform.coming_soon &&
                        connection &&
                        [
                            'pending_platform_setup',
                            'pending_provisioning',
                            'provisioning_failed',
                        ].includes(connection.status);
                    const connectUrl =
                        platform.platform === 'meta'
                            ? connectMetaAds(company.username).url
                            : connectGoogleAds(company.username).url;

                    return (
                        <div
                            key={platform.platform}
                            className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                                    <PlatformIcon
                                        platform={platform.platform}
                                    />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <p className="font-medium">
                                        {platform.label}
                                    </p>
                                    {platform.coming_soon ? (
                                        <p className="text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Coming soon" />
                                        </p>
                                    ) : connection?.external_account_id ? (
                                        <p className="font-mono text-xs text-muted-foreground">
                                            {connection.external_account_id}
                                        </p>
                                    ) : connection?.meta?.message ? (
                                        <p className="text-sm text-muted-foreground">
                                            {String(connection.meta.message)}
                                        </p>
                                    ) : !isPlatformConfigured ? (
                                        <p className="text-sm text-muted-foreground">
                                            <FormattedMessage
                                                defaultMessage="TravelBoost is finishing {platform} manager setup."
                                                values={{
                                                    platform: platform.label,
                                                }}
                                            />
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={
                                        isConnected ? 'secondary' : 'outline'
                                    }
                                >
                                    {platform.coming_soon
                                        ? 'Coming soon'
                                        : statusLabel(connection?.status)}
                                </Badge>

                                {platform.coming_soon ? null : !connection ? (
                                    <Button asChild size="sm">
                                        <a href={connectUrl}>
                                            <FormattedMessage defaultMessage="Connect" />
                                        </a>
                                    </Button>
                                ) : null}

                                {canRetry ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                            retryingPlatform ===
                                            platform.platform
                                        }
                                        onClick={() =>
                                            handleRetry(platform.platform)
                                        }
                                    >
                                        {retryingPlatform ===
                                        platform.platform ? (
                                            <Loader2Icon className="size-4 animate-spin" />
                                        ) : (
                                            <RefreshCwIcon className="size-4" />
                                        )}
                                        <FormattedMessage defaultMessage="Retry setup" />
                                    </Button>
                                ) : null}

                                {isConnected ? (
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={
                                                campaignsIndex(company.username)
                                                    .url
                                            }
                                        >
                                            <FormattedMessage defaultMessage="View campaigns" />
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
