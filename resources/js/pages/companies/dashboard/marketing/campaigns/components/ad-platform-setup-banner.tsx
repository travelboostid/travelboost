import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { connectAds as connectMetaAds } from '@/routes/companies/dashboard/facebook';
import { connectAds as connectGoogleAds } from '@/routes/companies/dashboard/google';
import { show as budgetIndex } from '@/routes/companies/dashboard/marketing/budget';
import { retryProvision as retryGoogleAdsProvisioning } from '@/routes/companies/dashboard/marketing/budget/google';
import { retryProvision as retryMetaAdsProvisioning } from '@/routes/companies/dashboard/marketing/budget/meta';
import { Link, router } from '@inertiajs/react';
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    CircleIcon,
    Loader2Icon,
    RefreshCwIcon,
} from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

type AdPlatformSetupBannerProps = {
    platform: 'google' | 'meta';
    companyUsername: string;
    connectionStatus?: string;
    platformConfigured: boolean;
    hasBudget: boolean;
};

type SetupStep = {
    id: string;
    label: React.ReactNode;
    description: React.ReactNode;
    status: 'complete' | 'current' | 'upcoming';
};

function stepIcon(status: SetupStep['status']) {
    if (status === 'complete') {
        return (
            <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
        );
    }

    if (status === 'current') {
        return <CircleIcon className="size-4 text-primary" />;
    }

    return <CircleIcon className="size-4 text-muted-foreground/50" />;
}

export default function AdPlatformSetupBanner({
    platform,
    companyUsername,
    connectionStatus,
    platformConfigured,
    hasBudget,
}: AdPlatformSetupBannerProps) {
    const [retrying, setRetrying] = useState(false);
    const isMeta = platform === 'meta';
    const platformLabel = isMeta ? 'Meta Ads' : 'Google Ads';
    const connectLabel = isMeta ? (
        <FormattedMessage defaultMessage="Connect Facebook" />
    ) : (
        <FormattedMessage defaultMessage="Connect Google" />
    );

    const hasConnection = Boolean(connectionStatus);
    const isConnected = connectionStatus === 'connected';
    const canRetry =
        connectionStatus &&
        [
            'pending_platform_setup',
            'pending_provisioning',
            'provisioning_failed',
        ].includes(connectionStatus);

    const steps: SetupStep[] = [
        {
            id: 'budget',
            label: (
                <FormattedMessage defaultMessage="Top up promotion budget" />
            ),
            description: (
                <FormattedMessage defaultMessage="Add funds that will pay for your ad spend." />
            ),
            status: hasBudget ? 'complete' : 'current',
        },
        {
            id: 'connect',
            label: isMeta ? (
                <FormattedMessage defaultMessage="Connect Facebook account" />
            ) : (
                <FormattedMessage defaultMessage="Connect Google account" />
            ),
            description: (
                <FormattedMessage defaultMessage="Authorize TravelBoost to manage ads on your behalf." />
            ),
            status: hasConnection
                ? 'complete'
                : hasBudget
                  ? 'current'
                  : 'upcoming',
        },
        {
            id: 'provision',
            label: isMeta ? (
                <FormattedMessage defaultMessage="Set up Meta Ads account" />
            ) : (
                <FormattedMessage defaultMessage="Set up Google Ads account" />
            ),
            description: !platformConfigured ? (
                <FormattedMessage
                    defaultMessage="TravelBoost is finishing {platform} manager setup on our side."
                    values={{ platform: platformLabel }}
                />
            ) : connectionStatus === 'provisioning_failed' ? (
                <FormattedMessage defaultMessage="Account setup failed. Retry or contact support." />
            ) : isMeta ? (
                <FormattedMessage defaultMessage="We provision an ad account under TravelBoost billing." />
            ) : (
                <FormattedMessage defaultMessage="We provision a client account under TravelBoost billing." />
            ),
            status: isConnected
                ? 'complete'
                : hasConnection
                  ? 'current'
                  : 'upcoming',
        },
    ];

    const headline = !hasBudget ? (
        <FormattedMessage defaultMessage="Add promotion budget first" />
    ) : !hasConnection ? (
        isMeta ? (
            <FormattedMessage defaultMessage="Connect Facebook to run ads" />
        ) : (
            <FormattedMessage defaultMessage="Connect Google to run ads" />
        )
    ) : isConnected ? (
        <FormattedMessage
            defaultMessage="{platform} is ready"
            values={{ platform: platformLabel }}
        />
    ) : connectionStatus === 'provisioning_failed' ? (
        <FormattedMessage
            defaultMessage="{platform} setup failed"
            values={{ platform: platformLabel }}
        />
    ) : (
        <FormattedMessage
            defaultMessage="{platform} setup in progress"
            values={{ platform: platformLabel }}
        />
    );

    const handleRetry = () => {
        setRetrying(true);
        const retryRoute = isMeta
            ? retryMetaAdsProvisioning(companyUsername)
            : retryGoogleAdsProvisioning(companyUsername);

        router.post(
            retryRoute.url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRetrying(false),
            },
        );
    };

    const connectUrl = isMeta
        ? connectMetaAds(companyUsername).url
        : connectGoogleAds(companyUsername).url;

    if (isConnected) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-dashed bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-5 py-4">
                <Alert className="border-0 bg-transparent p-0 shadow-none">
                    <AlertCircleIcon />
                    <AlertTitle>{headline}</AlertTitle>
                    <AlertDescription>
                        <FormattedMessage defaultMessage="Complete the steps below before creating your first campaign." />
                    </AlertDescription>
                </Alert>
            </div>

            <div className="space-y-4 p-5">
                <ol className="space-y-3">
                    {steps.map((step) => (
                        <li
                            key={step.id}
                            className={cn(
                                'flex gap-3 rounded-xl border p-4',
                                step.status === 'current' &&
                                    'border-primary/30 bg-primary/5',
                                step.status === 'complete' &&
                                    'border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20',
                            )}
                        >
                            <div className="mt-0.5 shrink-0">
                                {stepIcon(step.status)}
                            </div>
                            <div className="min-w-0 space-y-1">
                                <p className="text-sm font-medium">
                                    {step.label}
                                </p>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    {step.description}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>

                <div className="flex flex-wrap gap-2">
                    {!hasBudget ? (
                        <Button asChild>
                            <Link href={budgetIndex(companyUsername).url}>
                                <FormattedMessage defaultMessage="Top up budget" />
                            </Link>
                        </Button>
                    ) : null}

                    {hasBudget && !hasConnection ? (
                        <Button asChild>
                            <a href={connectUrl}>{connectLabel}</a>
                        </Button>
                    ) : null}

                    {canRetry ? (
                        <Button
                            variant="outline"
                            disabled={retrying}
                            onClick={handleRetry}
                        >
                            {retrying ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                                <RefreshCwIcon className="size-4" />
                            )}
                            <FormattedMessage defaultMessage="Retry setup" />
                        </Button>
                    ) : null}

                    <Button variant="outline" asChild>
                        <Link href={budgetIndex(companyUsername).url}>
                            <FormattedMessage defaultMessage="Manage ad platforms" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
