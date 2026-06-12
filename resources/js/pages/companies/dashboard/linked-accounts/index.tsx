import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import usePageProps from '@/hooks/use-page-props';
import { index as analyticsIndex } from '@/routes/companies/dashboard/analytics';
import { connect } from '@/routes/companies/dashboard/google';
import { Head, Link } from '@inertiajs/react';
import { IconBrandGoogle, IconBrandGoogleAnalytics } from '@tabler/icons-react';
import { ArrowRightIcon, Link2Icon, ShieldCheckIcon } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { DisconnectGoogleAccountButton } from './components/disconnect-google-account-button';

type LinkedIntegration = {
    key: string;
    label: string;
    status: 'connected' | 'not_connected';
    detail: string | null;
    meta: Record<string, string | null>;
};

type LinkedAccount = {
    id: number;
    email: string | null;
    name: string | null;
    connected_at: string | null;
    integrations: LinkedIntegration[];
};

type LinkedAccountGroup = {
    type: string;
    title: string;
    description: string;
    accounts: LinkedAccount[];
};

export type LinkedAccountsPageProps = {
    accountGroups: LinkedAccountGroup[];
};

function IntegrationIcon({ integrationKey }: { integrationKey: string }) {
    if (integrationKey === 'google_analytics') {
        return <IconBrandGoogleAnalytics className="size-4 text-[#E37400]" />;
    }

    return <IconBrandGoogle className="size-4 text-[#4285F4]" />;
}

function GoogleAccountGroupCard({ group }: { group: LinkedAccountGroup }) {
    const { company } = usePageProps();
    const account = group.accounts[0];
    const analyticsIntegration = account?.integrations.find(
        (integration) => integration.key === 'google_analytics',
    );
    const hasAnalytics = analyticsIntegration?.status === 'connected';

    return (
        <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#4285F4]/10">
                        <IconBrandGoogle className="size-5 text-[#4285F4]" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle>{group.title}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                    </div>
                </div>
                {account ? (
                    <DisconnectGoogleAccountButton
                        email={account.email}
                        name={account.name}
                        hasAnalytics={hasAnalytics}
                    />
                ) : null}
            </CardHeader>
            <CardContent>
                {!account ? (
                    <Empty className="border border-dashed border-slate-200/80 bg-muted/20 dark:border-slate-800">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Link2Icon />
                            </EmptyMedia>
                            <EmptyTitle>
                                <FormattedMessage defaultMessage="No Google account linked" />
                            </EmptyTitle>
                            <EmptyDescription>
                                <FormattedMessage defaultMessage="Connect Google to enable Analytics and other Google services for your company." />
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button asChild>
                                <a href={connect(company.username).url}>
                                    <IconBrandGoogle className="size-4" />
                                    <FormattedMessage defaultMessage="Connect Google account" />
                                </a>
                            </Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200/80 bg-muted/20 p-4 dark:border-slate-800">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-foreground">
                                        {account.name ??
                                            account.email ??
                                            'Google account'}
                                    </p>
                                    {account.email ? (
                                        <p className="truncate text-sm text-muted-foreground">
                                            {account.email}
                                        </p>
                                    ) : null}
                                    {account.connected_at ? (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            <FormattedMessage
                                                defaultMessage="Linked {date}"
                                                values={{
                                                    date: (
                                                        <FormattedDate
                                                            value={
                                                                account.connected_at
                                                            }
                                                            dateStyle="medium"
                                                        />
                                                    ),
                                                }}
                                            />
                                        </p>
                                    ) : null}
                                </div>
                                <Badge variant="secondary">
                                    <FormattedMessage defaultMessage="Active" />
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">
                                <FormattedMessage defaultMessage="Connected services" />
                            </p>
                            <div className="grid gap-3">
                                {account.integrations.map((integration) => (
                                    <div
                                        key={integration.key}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <IntegrationIcon
                                                    integrationKey={
                                                        integration.key
                                                    }
                                                />
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <p className="font-medium text-foreground">
                                                    {integration.label}
                                                </p>
                                                {integration.status ===
                                                    'connected' &&
                                                integration.detail ? (
                                                    <p className="truncate font-mono text-xs text-muted-foreground">
                                                        {integration.detail}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        <FormattedMessage defaultMessage="Not connected yet" />
                                                    </p>
                                                )}
                                                {integration.meta
                                                    .website_url ? (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {
                                                            integration.meta
                                                                .website_url
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                integration.status ===
                                                'connected'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {integration.status ===
                                            'connected' ? (
                                                <FormattedMessage defaultMessage="Connected" />
                                            ) : (
                                                <FormattedMessage defaultMessage="Not connected" />
                                            )}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!hasAnalytics ? (
                            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200/80 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage defaultMessage="Google is linked, but Analytics is not set up yet." />
                                </p>
                                <Button asChild variant="outline" size="sm">
                                    <Link
                                        href={analyticsIndex(company.username)}
                                    >
                                        <FormattedMessage defaultMessage="Set up Analytics" />
                                        <ArrowRightIcon className="size-4" />
                                    </Link>
                                </Button>
                            </div>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function LinkedAccountsPage({
    accountGroups,
}: LinkedAccountsPageProps) {
    const intl = useIntl();

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Settings',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Linked accounts',
                    }),
                },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.linked-accounts']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Linked accounts',
                })}
            />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Link2Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Linked accounts" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Manage third-party accounts connected to your company, grouped by provider." />
                            </p>
                        </div>
                    </div>
                </header>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheckIcon className="size-3.5 shrink-0" />
                    <FormattedMessage defaultMessage="Unlinking Google also removes any linked Analytics property and stops tracking on public pages." />
                </p>

                <div className="space-y-6">
                    {accountGroups.map((group) => (
                        <GoogleAccountGroupCard
                            key={group.type}
                            group={group}
                        />
                    ))}
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
