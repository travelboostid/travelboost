import { Button } from '@/components/ui/button';
import usePageProps from '@/hooks/use-page-props';
import { selectPixel } from '@/routes/companies/dashboard/analytics/meta';
import { Link } from '@inertiajs/react';
import { IconBrandFacebook } from '@tabler/icons-react';
import {
    ArrowRightIcon,
    LayersIcon,
    LineChartIcon,
    SparklesIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { MetaAnalyticsPageProps } from '../meta';
import {
    AnalyticsSetupLayout,
    type AnalyticsSetupBenefit,
} from './analytics-setup-layout';

const benefits: AnalyticsSetupBenefit[] = [
    {
        icon: LineChartIcon,
        title: <FormattedMessage defaultMessage="Pixel insights" />,
        description: (
            <FormattedMessage defaultMessage="View event counts and top URLs from your connected Meta Pixel." />
        ),
        iconClassName: 'text-blue-600 dark:text-blue-400',
    },
    {
        icon: LayersIcon,
        title: <FormattedMessage defaultMessage="Pixel picker" />,
        description: (
            <FormattedMessage defaultMessage="Choose from pixels in your Business account or paste a Pixel ID manually." />
        ),
        iconClassName: 'text-sky-600 dark:text-sky-400',
    },
    {
        icon: SparklesIcon,
        title: <FormattedMessage defaultMessage="Automatic tracking" />,
        description: (
            <FormattedMessage defaultMessage="Your Meta Pixel is injected into public pages once connected." />
        ),
        iconClassName: 'text-pink-600 dark:text-pink-400',
    },
];

export function MetaPixelUnlinked() {
    const { company, metaAccount } = usePageProps<MetaAnalyticsPageProps>();

    return (
        <AnalyticsSetupLayout
            currentStep={2}
            icon={IconBrandFacebook}
            iconClassName="text-[#1877F2]"
            step1Label={<FormattedMessage defaultMessage="Connect Facebook" />}
            step2Label={<FormattedMessage defaultMessage="Link Meta Pixel" />}
            title={<FormattedMessage defaultMessage="Link your Meta Pixel" />}
            description={
                <FormattedMessage defaultMessage="Select a pixel from your Facebook Business account, or enter a Pixel ID manually to start tracking." />
            }
            connectedAccountEmail={metaAccount?.email}
            connectedAccountLabel={
                !metaAccount?.email && metaAccount?.name ? (
                    <FormattedMessage
                        defaultMessage="Signed in as {name}"
                        values={{ name: metaAccount.name }}
                    />
                ) : undefined
            }
            benefits={benefits}
            actions={
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href={selectPixel(company.username)}>
                        <FormattedMessage defaultMessage="Choose Meta Pixel" />
                        <ArrowRightIcon className="size-4" />
                    </Link>
                </Button>
            }
        />
    );
}
