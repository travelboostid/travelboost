import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn, formatIDR } from '@/lib/utils';
import {
    index as campaignsIndex,
    store as storeCampaign,
} from '@/routes/companies/dashboard/marketing/campaigns';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    ArrowLeftIcon,
    PlusIcon,
    Trash2Icon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import AdPlatformSetupBanner from './components/ad-platform-setup-banner';
import useMarketingFlash from './components/use-marketing-flash';

export type CreateAdCampaignPageProps = {
    platform: 'google' | 'meta';
    budgetBalance: number;
    defaultLandingPageUrl: string | null;
    minDailyBudget: number;
    googleAdsReady: boolean;
    googleAdsConnectionStatus?: string;
    metaAdsReady: boolean;
    metaAdsConnectionStatus?: string;
    googleAdsConfigured: boolean;
    metaAdsConfigured: boolean;
};

function CharacterCount({ current, max }: { current: number; max: number }) {
    const isNearLimit = current >= max - 5;

    return (
        <p
            className={cn(
                'text-right text-xs tabular-nums',
                isNearLimit ? 'text-amber-600' : 'text-muted-foreground',
            )}
        >
            {current}/{max}
        </p>
    );
}

export default function Page() {
    useMarketingFlash();

    const {
        platform,
        budgetBalance,
        defaultLandingPageUrl,
        minDailyBudget,
        googleAdsReady,
        googleAdsConnectionStatus,
        metaAdsReady,
        metaAdsConnectionStatus,
        googleAdsConfigured,
        metaAdsConfigured,
    } = usePageProps<CreateAdCampaignPageProps>();
    const { company } = usePageSharedDataProps();

    const isMeta = platform === 'meta';
    const platformReady = isMeta ? metaAdsReady : googleAdsReady;
    const platformConfigured = isMeta ? metaAdsConfigured : googleAdsConfigured;
    const connectionStatus = isMeta
        ? metaAdsConnectionStatus
        : googleAdsConnectionStatus;
    const minHeadlines = isMeta ? 1 : 3;
    const minDescriptions = isMeta ? 1 : 2;

    const form = useForm({
        platform,
        name: '',
        final_url: defaultLandingPageUrl ?? '',
        daily_budget: minDailyBudget,
        headlines: isMeta ? [''] : ['', '', ''],
        descriptions: isMeta ? [''] : ['', ''],
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(storeCampaign(company.username).url);
    };

    const hasInsufficientBudget = form.data.daily_budget > budgetBalance;
    const estimatedDays =
        form.data.daily_budget > 0
            ? Math.floor(budgetBalance / form.data.daily_budget)
            : 0;

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: 'Marketing' },
                { title: 'Ad Campaigns' },
                { title: 'Create' },
            ]}
            openMenuIds={['marketings']}
            activeMenuIds={['marketings.campaigns']}
        >
            <Head title="Create Ad Campaign" />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
                <header className="space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 w-fit gap-1 text-muted-foreground"
                        asChild
                    >
                        <Link href={campaignsIndex(company.username).url}>
                            <ArrowLeftIcon className="size-4" />
                            <FormattedMessage defaultMessage="Back to campaigns" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            {isMeta ? (
                                <FormattedMessage defaultMessage="Create Meta traffic campaign" />
                            ) : (
                                <FormattedMessage defaultMessage="Create Performance Max campaign" />
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <FormattedMessage
                                defaultMessage="Available promotion budget: {amount}"
                                values={{ amount: formatIDR(budgetBalance) }}
                            />
                        </p>
                    </div>
                </header>

                {!platformReady ? (
                    <AdPlatformSetupBanner
                        platform={platform}
                        companyUsername={company.username}
                        connectionStatus={connectionStatus}
                        platformConfigured={platformConfigured}
                        hasBudget={budgetBalance > 0}
                    />
                ) : null}

                {hasInsufficientBudget && platformReady ? (
                    <Alert variant="destructive">
                        <AlertTriangleIcon />
                        <AlertTitle>
                            <FormattedMessage defaultMessage="Insufficient promotion budget" />
                        </AlertTitle>
                        <AlertDescription>
                            <FormattedMessage
                                defaultMessage="Your daily budget ({daily}) exceeds your available balance ({balance}). Top up before launching."
                                values={{
                                    daily: formatIDR(form.data.daily_budget),
                                    balance: formatIDR(budgetBalance),
                                }}
                            />
                        </AlertDescription>
                    </Alert>
                ) : null}

                <form
                    onSubmit={submit}
                    className={cn(
                        'space-y-6',
                        !platformReady && 'pointer-events-none opacity-60',
                    )}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                <FormattedMessage defaultMessage="Campaign details" />
                            </CardTitle>
                            <CardDescription>
                                {isMeta ? (
                                    <FormattedMessage defaultMessage="Targeting defaults to Indonesia. Your campaign drives link clicks on Facebook and Instagram." />
                                ) : (
                                    <FormattedMessage defaultMessage="Targeting defaults to Indonesia. Your campaign goes live on Google Ads after creation." />
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    <FormattedMessage defaultMessage="Campaign name" />
                                </Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="Bali Summer Tours"
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="final_url">
                                    <FormattedMessage defaultMessage="Landing page URL" />
                                </Label>
                                <Input
                                    id="final_url"
                                    type="url"
                                    value={form.data.final_url}
                                    onChange={(e) =>
                                        form.setData(
                                            'final_url',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="https://yoursite.com/tours"
                                    required
                                />
                                <InputError message={form.errors.final_url} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="daily_budget">
                                    <FormattedMessage defaultMessage="Daily budget (IDR)" />
                                </Label>
                                <Input
                                    id="daily_budget"
                                    type="number"
                                    min={minDailyBudget}
                                    step={1000}
                                    value={form.data.daily_budget}
                                    onChange={(e) =>
                                        form.setData(
                                            'daily_budget',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    <FormattedMessage
                                        defaultMessage="Minimum {amount}. At this rate, your current balance covers about {days, plural, one {# day} other {# days}}."
                                        values={{
                                            amount: formatIDR(minDailyBudget),
                                            days: Math.max(estimatedDays, 0),
                                        }}
                                    />
                                </p>
                                <InputError
                                    message={form.errors.daily_budget}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                <FormattedMessage defaultMessage="Headlines" />
                            </CardTitle>
                            <CardDescription>
                                {isMeta ? (
                                    <FormattedMessage defaultMessage="Add a short headline for your link ad." />
                                ) : (
                                    <FormattedMessage defaultMessage="Add 3–15 short headlines. Google mixes and matches them across placements." />
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {form.data.headlines.map((headline, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex gap-2">
                                        <Input
                                            value={headline}
                                            maxLength={30}
                                            placeholder={`Headline ${index + 1}`}
                                            onChange={(e) => {
                                                const next = [
                                                    ...form.data.headlines,
                                                ];
                                                next[index] = e.target.value;
                                                form.setData('headlines', next);
                                            }}
                                            required={index < minHeadlines}
                                        />
                                        {index >= 3 ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    form.setData(
                                                        'headlines',
                                                        form.data.headlines.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    );
                                                }}
                                            >
                                                <Trash2Icon className="size-4" />
                                            </Button>
                                        ) : null}
                                    </div>
                                    <CharacterCount
                                        current={headline.length}
                                        max={30}
                                    />
                                </div>
                            ))}
                            {form.data.headlines.length < 15 && !isMeta ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        form.setData('headlines', [
                                            ...form.data.headlines,
                                            '',
                                        ])
                                    }
                                >
                                    <PlusIcon className="size-4" />
                                    <FormattedMessage defaultMessage="Add headline" />
                                </Button>
                            ) : null}
                            <InputError message={form.errors.headlines} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                <FormattedMessage defaultMessage="Descriptions" />
                            </CardTitle>
                            <CardDescription>
                                {isMeta ? (
                                    <FormattedMessage defaultMessage="Add the primary text shown above your link." />
                                ) : (
                                    <FormattedMessage defaultMessage="Add at least 2 descriptions that expand on your offer." />
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {form.data.descriptions.map(
                                (description, index) => (
                                    <div key={index} className="space-y-1">
                                        <Textarea
                                            value={description}
                                            maxLength={90}
                                            rows={2}
                                            placeholder={`Description ${index + 1}`}
                                            onChange={(e) => {
                                                const next = [
                                                    ...form.data.descriptions,
                                                ];
                                                next[index] = e.target.value;
                                                form.setData(
                                                    'descriptions',
                                                    next,
                                                );
                                            }}
                                            required={index < minDescriptions}
                                        />
                                        <CharacterCount
                                            current={description.length}
                                            max={90}
                                        />
                                    </div>
                                ),
                            )}
                            <InputError message={form.errors.descriptions} />
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" asChild>
                            <Link href={campaignsIndex(company.username).url}>
                                <FormattedMessage defaultMessage="Cancel" />
                            </Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                !platformReady ||
                                hasInsufficientBudget
                            }
                        >
                            {form.processing ? <Spinner /> : null}
                            <FormattedMessage defaultMessage="Create campaign" />
                        </Button>
                    </div>
                </form>
            </div>
        </CompanyDashboardLayout>
    );
}
