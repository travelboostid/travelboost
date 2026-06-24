import { selectPixel as storePixel } from '@/actions/App/Http/Controllers/Companies/Dashboard/MetaAnalyticsController';
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
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import usePageProps from '@/hooks/use-page-props';
import { index as metaAnalyticsIndex } from '@/routes/companies/dashboard/analytics/meta';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { IconBrandFacebook } from '@tabler/icons-react';
import {
    ArrowLeftIcon,
    CheckCircle2Icon,
    Loader2Icon,
    SearchIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';
import { AnalyticsProviderTabs } from '../components/analytics-provider-tabs';

type MetaPixelOption = {
    id: string;
    name: string;
    ad_account_id: string | null;
};

export type SelectMetaPixelPageProps = {
    metaAccount: {
        id: number;
        email?: string;
    } | null;
    availablePixels?: MetaPixelOption[];
};

function PixelListSkeleton() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((index) => (
                <div
                    key={index}
                    className="rounded-xl border border-slate-200/80 bg-card p-4 dark:border-slate-800"
                >
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-2 h-4 w-32" />
                </div>
            ))}
        </div>
    );
}

function PixelSelectionList() {
    const intl = useIntl();
    const {
        company,
        metaAccount,
        availablePixels = [],
    } = usePageProps<SelectMetaPixelPageProps>();
    const [search, setSearch] = useState('');
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [manualPixelId, setManualPixelId] = useState('');
    const [manualSubmitting, setManualSubmitting] = useState(false);

    const filteredPixels = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return availablePixels;
        }

        return availablePixels.filter((pixel) =>
            [pixel.id, pixel.name, pixel.ad_account_id]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(query),
        );
    }, [availablePixels, search]);

    const handleSelect = (pixel: MetaPixelOption) => {
        setSelectingId(pixel.id);

        router.post(
            storePixel(company.username).url,
            {
                pixel_id: pixel.id,
                pixel_name: pixel.name,
                ad_account_id: pixel.ad_account_id,
                connection_source: 'oauth',
                company_facebook_account_id: metaAccount?.id,
            },
            {
                onError: () => {
                    toast.error(
                        intl.formatMessage({
                            defaultMessage:
                                'Could not connect this Meta Pixel. Please try again.',
                        }),
                    );
                },
                onFinish: () => setSelectingId(null),
            },
        );
    };

    const handleManualSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!/^\d+$/.test(manualPixelId.trim())) {
            toast.error(
                intl.formatMessage({
                    defaultMessage: 'Enter a valid numeric Meta Pixel ID.',
                }),
            );
            return;
        }

        setManualSubmitting(true);

        router.post(
            storePixel(company.username).url,
            {
                pixel_id: manualPixelId.trim(),
                connection_source: 'manual',
            },
            {
                onError: () => {
                    toast.error(
                        intl.formatMessage({
                            defaultMessage:
                                'Could not save this Meta Pixel ID. Please try again.',
                        }),
                    );
                },
                onFinish: () => setManualSubmitting(false),
            },
        );
    };

    return (
        <div className="space-y-8">
            {metaAccount ? (
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            <FormattedMessage
                                defaultMessage="{count, plural, one {# pixel found} other {# pixels found}}"
                                values={{ count: availablePixels.length }}
                            />
                        </p>
                        <div className="relative w-full sm:max-w-sm">
                            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Search pixels…',
                                })}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {filteredPixels.length === 0 ? (
                        <Empty className="border border-dashed">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <IconBrandFacebook />
                                </EmptyMedia>
                                <EmptyTitle>
                                    <FormattedMessage defaultMessage="No pixels found" />
                                </EmptyTitle>
                                <EmptyDescription>
                                    <FormattedMessage defaultMessage="Try another search or enter your Pixel ID manually below." />
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <div className="grid gap-3">
                            {filteredPixels.map((pixel) => (
                                <article
                                    key={pixel.id}
                                    className="rounded-xl border border-slate-200/80 bg-card p-4 shadow-sm dark:border-slate-800"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 space-y-2">
                                            <h3 className="font-semibold text-foreground">
                                                {pixel.name}
                                            </h3>
                                            <Badge
                                                variant="secondary"
                                                className="font-mono text-xs"
                                            >
                                                {pixel.id}
                                            </Badge>
                                        </div>
                                        <Button
                                            type="button"
                                            className="w-full sm:w-auto"
                                            disabled={selectingId === pixel.id}
                                            onClick={() => handleSelect(pixel)}
                                        >
                                            {selectingId === pixel.id ? (
                                                <Loader2Icon className="size-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2Icon className="size-4" />
                                            )}
                                            <FormattedMessage defaultMessage="Connect" />
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}

            <Card className="border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                    <CardTitle>
                        <FormattedMessage defaultMessage="Enter Pixel ID manually" />
                    </CardTitle>
                    <CardDescription>
                        <FormattedMessage defaultMessage="Use this if you already know your Meta Pixel ID. Tracking starts immediately; connect Facebook later for dashboard insights." />
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleManualSubmit}
                        className="flex flex-col gap-4 sm:flex-row sm:items-end"
                    >
                        <div className="grid w-full gap-2 sm:max-w-sm">
                            <Label htmlFor="manual-pixel-id">
                                <FormattedMessage defaultMessage="Meta Pixel ID" />
                            </Label>
                            <Input
                                id="manual-pixel-id"
                                value={manualPixelId}
                                onChange={(event) =>
                                    setManualPixelId(event.target.value)
                                }
                                placeholder="123456789012345"
                                inputMode="numeric"
                                pattern="\d+"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={manualSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {manualSubmitting ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : null}
                            <FormattedMessage defaultMessage="Save Pixel ID" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SelectMetaPixelPage({
    metaAccount,
}: SelectMetaPixelPageProps) {
    const intl = useIntl();
    const { company } = usePageProps();

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Analytics',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Choose Meta Pixel',
                    }),
                },
            ]}
            activeMenuIds={['marketings.analytics']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Choose Meta Pixel',
                })}
            />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-fit px-0"
                    >
                        <Link href={metaAnalyticsIndex(company.username)}>
                            <ArrowLeftIcon className="size-4" />
                            <FormattedMessage defaultMessage="Back to Meta Analytics" />
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                            <FormattedMessage defaultMessage="Choose Meta Pixel" />
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="Select a pixel from your Facebook Business account or enter one manually." />
                        </p>
                    </div>
                </div>

                <AnalyticsProviderTabs activeProvider="meta" />

                {metaAccount ? (
                    <Deferred
                        data="availablePixels"
                        fallback={<PixelListSkeleton />}
                    >
                        <PixelSelectionList />
                    </Deferred>
                ) : (
                    <PixelSelectionList />
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
