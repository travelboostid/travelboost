import { selectAccount } from '@/actions/App/Http/Controllers/Companies/Dashboard/GoogleAnalyticsController';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import usePageProps from '@/hooks/use-page-props';
import { cn } from '@/lib/utils';
import {
    index as analyticsIndex,
    setupAccount,
} from '@/routes/companies/dashboard/analytics';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import 'dayjs/locale/id';
import {
    ArrowLeftIcon,
    BarChart3Icon,
    CheckCircle2Icon,
    ExternalLinkIcon,
    GlobeIcon,
    Loader2Icon,
    SearchIcon,
    SparklesIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';

type GaStream = {
    id: string;
    display_name?: string;
    measurement_id?: string | null;
    default_uri?: string | null;
};

type GaProperty = {
    id: string;
    display_name: string;
    time_zone?: string;
    currency_code?: string;
    streams: GaStream[];
};

type GaAccount = {
    id: string;
    display_name: string;
    region_code?: string;
    properties: GaProperty[];
};

type StreamOption = {
    key: string;
    account: GaAccount;
    property: GaProperty;
    stream?: GaStream;
};

export type SelectOrSetupAccountPageProps = {
    googleAccount: {
        id: number;
        email?: string;
    };
    analyticAccounts?: GaAccount[];
};

function flattenStreamOptions(accounts: GaAccount[]): StreamOption[] {
    return accounts.flatMap((account) =>
        account.properties.flatMap((property) => {
            if (!property.streams?.length) {
                return [
                    {
                        key: `${account.id}-${property.id}-empty`,
                        account,
                        property,
                    },
                ];
            }

            return property.streams.map((stream) => ({
                key: `${account.id}-${property.id}-${stream.id}`,
                account,
                property,
                stream,
            }));
        }),
    );
}

function PropertyListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-10 w-full sm:max-w-sm" />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-muted/20 px-4 py-3 dark:border-slate-800">
                <p className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Fetching properties from Google Analytics…" />
                </p>
            </div>

            <div className="space-y-6">
                {[0, 1].map((groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                        <Skeleton className="h-5 w-40" />
                        <div className="grid gap-3">
                            {[0, 1].map((cardIndex) => (
                                <div
                                    key={cardIndex}
                                    className="rounded-xl border border-slate-200/80 bg-card p-4 dark:border-slate-800"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                                        <div className="min-w-0 flex-1 space-y-3">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-6 w-24 rounded-full" />
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-10 w-full sm:w-28" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StreamSelectionCard({
    option,
    selecting,
    onSelect,
}: {
    option: StreamOption;
    selecting: boolean;
    onSelect: () => void;
}) {
    const { account, property, stream } = option;
    const hasWebStream = Boolean(stream?.measurement_id);
    const website = stream?.default_uri?.replace(/\/$/, '');

    return (
        <article
            className={cn(
                'rounded-xl border border-slate-200/80 bg-card p-4 shadow-sm transition hover:border-primary/30 dark:border-slate-800',
                !hasWebStream && 'opacity-70',
            )}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {account.display_name}
                        </p>
                        <h3 className="text-base font-semibold text-foreground">
                            {property.display_name}
                        </h3>
                        {stream?.display_name ? (
                            <p className="text-sm text-muted-foreground">
                                {stream.display_name}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {stream?.measurement_id ? (
                            <Badge
                                variant="secondary"
                                className="font-mono text-xs"
                            >
                                {stream.measurement_id}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs">
                                <FormattedMessage defaultMessage="No web stream" />
                            </Badge>
                        )}
                        {property.time_zone ? (
                            <Badge variant="outline" className="text-xs">
                                {property.time_zone}
                            </Badge>
                        ) : null}
                        {property.currency_code ? (
                            <Badge variant="outline" className="text-xs">
                                {property.currency_code}
                            </Badge>
                        ) : null}
                    </div>

                    {website ? (
                        <a
                            href={website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-primary hover:underline"
                        >
                            <GlobeIcon className="size-3.5 shrink-0" />
                            <span className="truncate">{website}</span>
                            <ExternalLinkIcon className="size-3 shrink-0" />
                        </a>
                    ) : null}

                    {!hasWebStream ? (
                        <p className="text-xs text-muted-foreground">
                            <FormattedMessage defaultMessage="Only GA4 web data streams with a measurement ID can be connected." />
                        </p>
                    ) : null}
                </div>

                <Button
                    type="button"
                    className="w-full shrink-0 sm:w-auto"
                    disabled={!hasWebStream || selecting}
                    onClick={onSelect}
                >
                    {selecting ? (
                        <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                        <CheckCircle2Icon className="size-4" />
                    )}
                    <FormattedMessage defaultMessage="Connect" />
                </Button>
            </div>
        </article>
    );
}

function PropertySelectionList({
    googleAccount,
    analyticAccounts,
}: {
    googleAccount: SelectOrSetupAccountPageProps['googleAccount'];
    analyticAccounts: GaAccount[];
}) {
    const intl = useIntl();
    const { company } = usePageProps();
    const [search, setSearch] = useState('');
    const [selectingKey, setSelectingKey] = useState<string | null>(null);

    const streamOptions = useMemo(
        () => flattenStreamOptions(analyticAccounts),
        [analyticAccounts],
    );

    const connectableCount = useMemo(
        () =>
            streamOptions.filter((option) => option.stream?.measurement_id)
                .length,
        [streamOptions],
    );

    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return streamOptions;
        }

        return streamOptions.filter((option) => {
            const haystack = [
                option.account.display_name,
                option.account.id,
                option.property.display_name,
                option.property.id,
                option.stream?.display_name,
                option.stream?.measurement_id,
                option.stream?.default_uri,
                option.property.time_zone,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [search, streamOptions]);

    const groupedOptions = useMemo(() => {
        const groups = new Map<string, StreamOption[]>();

        for (const option of filteredOptions) {
            const groupKey = option.account.id;
            const existing = groups.get(groupKey) ?? [];

            existing.push(option);
            groups.set(groupKey, existing);
        }

        return Array.from(groups.entries()).map(([accountId, options]) => ({
            accountId,
            accountName: options[0]?.account.display_name ?? accountId,
            options,
        }));
    }, [filteredOptions]);

    const handleSelect = (option: StreamOption) => {
        const { account, property, stream } = option;

        if (!stream?.measurement_id) {
            return;
        }

        setSelectingKey(option.key);

        router.post(
            selectAccount(company.username),
            {
                company_google_account_id: googleAccount.id,
                ga_account_id: account.id,
                property_id: property.id,
                data_stream_id: stream.id,
                measurement_id: stream.measurement_id,
                website_url: stream.default_uri || null,
                timezone: property.time_zone || 'Asia/Jakarta',
                currency: property.currency_code || 'IDR',
            },
            {
                onSuccess: () => {
                    toast.success(
                        intl.formatMessage({
                            defaultMessage:
                                'Google Analytics property successfully connected!',
                        }),
                    );
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).flat()[0];

                    toast.error(
                        typeof firstError === 'string'
                            ? firstError
                            : intl.formatMessage({
                                  defaultMessage:
                                      'Could not connect this property. Please try again.',
                              }),
                    );
                },
                onFinish: () => setSelectingKey(null),
            },
        );
    };

    if (streamOptions.length === 0) {
        return (
            <Empty className="rounded-xl border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <SparklesIcon />
                    </EmptyMedia>
                    <EmptyTitle>
                        <FormattedMessage defaultMessage="No Analytics properties found" />
                    </EmptyTitle>
                    <EmptyDescription>
                        <FormattedMessage defaultMessage="We couldn't find any GA4 properties on this Google account. Create one in Google Analytics, then return here to connect it." />
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row flex-wrap justify-center gap-2">
                    <Button asChild variant="default">
                        <a href={setupAccount(company.username).url}>
                            <ExternalLinkIcon className="size-4" />
                            <FormattedMessage defaultMessage="Create in Google Analytics" />
                        </a>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={analyticsIndex(company.username).url}>
                            <FormattedMessage defaultMessage="Back to Analytics" />
                        </Link>
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    <FormattedMessage
                        defaultMessage="{count, plural, one {# connectable web stream} other {# connectable web streams}} found"
                        values={{ count: connectableCount }}
                    />
                </p>

                <div className="relative w-full sm:max-w-sm">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={intl.formatMessage({
                            defaultMessage:
                                'Search property, stream, or measurement ID…',
                        })}
                        className="pl-9"
                    />
                </div>
            </div>

            {filteredOptions.length === 0 ? (
                <Empty className="rounded-xl border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <SearchIcon />
                        </EmptyMedia>
                        <EmptyTitle>
                            <FormattedMessage defaultMessage="No matches" />
                        </EmptyTitle>
                        <EmptyDescription>
                            <FormattedMessage defaultMessage="Try a different search term or clear the filter." />
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSearch('')}
                        >
                            <FormattedMessage defaultMessage="Clear search" />
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="space-y-6">
                    {groupedOptions.map((group) => (
                        <section key={group.accountId} className="space-y-3">
                            <h2 className="text-sm font-semibold text-foreground">
                                {group.accountName}
                            </h2>
                            <div className="grid gap-3">
                                {group.options.map((option) => (
                                    <StreamSelectionCard
                                        key={option.key}
                                        option={option}
                                        selecting={selectingKey === option.key}
                                        onSelect={() => handleSelect(option)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SelectOrSetupAccountPage({
    googleAccount,
    analyticAccounts,
}: SelectOrSetupAccountPageProps) {
    const intl = useIntl();
    const { company } = usePageProps();

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Analytics',
                    }),
                    url: analyticsIndex(company.username).url,
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Choose property',
                    }),
                },
            ]}
            activeMenuIds={['marketings.analytics']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Choose Analytics property',
                })}
            />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground"
                        >
                            <Link href={analyticsIndex(company.username).url}>
                                <ArrowLeftIcon className="size-4" />
                                <FormattedMessage defaultMessage="Back to Analytics" />
                            </Link>
                        </Button>

                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <BarChart3Icon className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    <FormattedMessage defaultMessage="Choose Analytics property" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage
                                        defaultMessage="Select a GA4 web data stream to connect with {companyName}."
                                        values={{ companyName: company.name }}
                                    />
                                </p>
                            </div>
                        </div>
                    </div>

                    <Badge variant="outline" className="w-fit text-xs">
                        <FormattedMessage defaultMessage="Step 2 of 2 · Analytics property" />
                    </Badge>
                </header>

                {googleAccount.email ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-muted-foreground">
                            <FormattedMessage defaultMessage="Signed in as" />
                        </span>
                        <span className="font-medium text-foreground">
                            {googleAccount.email}
                        </span>
                    </div>
                ) : null}

                <Deferred
                    data="analyticAccounts"
                    fallback={<PropertyListSkeleton />}
                >
                    <PropertySelectionList
                        googleAccount={googleAccount}
                        analyticAccounts={analyticAccounts ?? []}
                    />
                </Deferred>
            </div>
        </CompanyDashboardLayout>
    );
}
