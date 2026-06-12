import { Button } from '@/components/ui/button';
import usePageProps from '@/hooks/use-page-props';
import { connect } from '@/routes/companies/dashboard/google';
import { IconBrandGoogle } from '@tabler/icons-react';
import {
    BarChart3Icon,
    GlobeIcon,
    RadioIcon,
    ShieldCheckIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import {
    AnalyticsSetupLayout,
    type AnalyticsSetupBenefit,
} from './analytics-setup-layout';

const benefits: AnalyticsSetupBenefit[] = [
    {
        icon: BarChart3Icon,
        title: <FormattedMessage defaultMessage="30-day performance" />,
        description: (
            <FormattedMessage defaultMessage="See users, sessions, page views, and bounce rate over the last month." />
        ),
        iconClassName: 'text-blue-600 dark:text-blue-400',
    },
    {
        icon: RadioIcon,
        title: <FormattedMessage defaultMessage="Live visitor snapshot" />,
        description: (
            <FormattedMessage defaultMessage="Monitor active users, top pages, and events in near real time." />
        ),
        iconClassName: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        icon: GlobeIcon,
        title: <FormattedMessage defaultMessage="Audience breakdown" />,
        description: (
            <FormattedMessage defaultMessage="Understand devices, countries, channels, and social traffic sources." />
        ),
        iconClassName: 'text-violet-600 dark:text-violet-400',
    },
];

export function GoogleAccountUnlinked() {
    const { company } = usePageProps();

    return (
        <AnalyticsSetupLayout
            currentStep={1}
            icon={IconBrandGoogle}
            iconClassName="text-[#4285F4]"
            title={
                <FormattedMessage defaultMessage="Connect your Google account" />
            }
            description={
                <FormattedMessage defaultMessage="Start by signing in with Google. We use this to securely access your Analytics properties — no manual API keys required." />
            }
            benefits={benefits}
            actions={
                <>
                    <Button asChild size="lg" className="w-full sm:w-auto">
                        <a href={connect(company.username).url}>
                            <IconBrandGoogle className="size-4" />
                            <FormattedMessage defaultMessage="Continue with Google" />
                        </a>
                    </Button>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground sm:w-full sm:basis-full">
                        <ShieldCheckIcon className="size-3.5 shrink-0" />
                        <FormattedMessage defaultMessage="Read-only Analytics access. You can disconnect anytime." />
                    </p>
                </>
            }
        />
    );
}
