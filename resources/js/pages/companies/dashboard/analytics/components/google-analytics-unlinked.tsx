import { Button } from '@/components/ui/button';
import usePageProps from '@/hooks/use-page-props';
import { showAccountSetupOrSelections } from '@/routes/companies/dashboard/analytics';
import { Link } from '@inertiajs/react';
import { IconBrandGoogleAnalytics } from '@tabler/icons-react';
import {
    ArrowRightIcon,
    LayersIcon,
    LineChartIcon,
    SparklesIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import {
    AnalyticsSetupLayout,
    type AnalyticsSetupBenefit,
} from './analytics-setup-layout';

const benefits: AnalyticsSetupBenefit[] = [
    {
        icon: LineChartIcon,
        title: <FormattedMessage defaultMessage="Unified dashboard" />,
        description: (
            <FormattedMessage defaultMessage="View GA4 metrics alongside your company dashboard without leaving Travelboost." />
        ),
        iconClassName: 'text-orange-600 dark:text-orange-400',
    },
    {
        icon: LayersIcon,
        title: <FormattedMessage defaultMessage="Property & stream picker" />,
        description: (
            <FormattedMessage defaultMessage="Choose the GA4 property and web data stream that matches your landing page." />
        ),
        iconClassName: 'text-sky-600 dark:text-sky-400',
    },
    {
        icon: SparklesIcon,
        title: <FormattedMessage defaultMessage="Automatic tracking" />,
        description: (
            <FormattedMessage defaultMessage="Your measurement ID is injected into public pages once connected." />
        ),
        iconClassName: 'text-pink-600 dark:text-pink-400',
    },
];

export function GoogleAnalyticsUnlinked() {
    const { company, account } = usePageProps<AnalyticsPageProps>();

    return (
        <AnalyticsSetupLayout
            currentStep={2}
            icon={IconBrandGoogleAnalytics}
            iconClassName="text-[#E37400]"
            title={
                <FormattedMessage defaultMessage="Link your Analytics property" />
            }
            description={
                <FormattedMessage defaultMessage="You're one step away. Select an existing GA4 property and web data stream, or create a new one — then insights will appear here." />
            }
            connectedAccountEmail={account?.email}
            benefits={benefits}
            actions={
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href={showAccountSetupOrSelections(company.username)}>
                        <FormattedMessage defaultMessage="Choose Analytics property" />
                        <ArrowRightIcon className="size-4" />
                    </Link>
                </Button>
            }
        />
    );
}
