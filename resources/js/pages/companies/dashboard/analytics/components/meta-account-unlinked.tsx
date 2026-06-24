import { Button } from '@/components/ui/button';
import usePageProps from '@/hooks/use-page-props';
import { selectPixel } from '@/routes/companies/dashboard/analytics/meta';
import { connect } from '@/routes/companies/dashboard/facebook';
import { Link } from '@inertiajs/react';
import { IconBrandFacebook } from '@tabler/icons-react';
import {
    BarChart3Icon,
    MousePointerClickIcon,
    ShieldCheckIcon,
    TargetIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import {
    AnalyticsSetupLayout,
    type AnalyticsSetupBenefit,
} from './analytics-setup-layout';

const benefits: AnalyticsSetupBenefit[] = [
    {
        icon: BarChart3Icon,
        title: <FormattedMessage defaultMessage="7-day event overview" />,
        description: (
            <FormattedMessage defaultMessage="See top events, URLs, and device breakdowns from your Meta Pixel." />
        ),
        iconClassName: 'text-blue-600 dark:text-blue-400',
    },
    {
        icon: TargetIcon,
        title: <FormattedMessage defaultMessage="Conversion tracking" />,
        description: (
            <FormattedMessage defaultMessage="Track page views, leads, and content views on your public pages." />
        ),
        iconClassName: 'text-violet-600 dark:text-violet-400',
    },
    {
        icon: MousePointerClickIcon,
        title: <FormattedMessage defaultMessage="Automatic pixel injection" />,
        description: (
            <FormattedMessage defaultMessage="Your Meta Pixel is added to landing pages once connected." />
        ),
        iconClassName: 'text-pink-600 dark:text-pink-400',
    },
];

export function MetaAccountUnlinked() {
    const { company } = usePageProps();

    return (
        <AnalyticsSetupLayout
            currentStep={1}
            icon={IconBrandFacebook}
            iconClassName="text-[#1877F2]"
            step1Label={<FormattedMessage defaultMessage="Connect Facebook" />}
            step2Label={<FormattedMessage defaultMessage="Link Meta Pixel" />}
            title={
                <FormattedMessage defaultMessage="Connect your Facebook account" />
            }
            description={
                <FormattedMessage defaultMessage="Sign in with Facebook to discover Meta Pixels from your Business account, or enter a Pixel ID manually on the next step." />
            }
            benefits={benefits}
            actions={
                <>
                    <Button asChild size="lg" className="w-full sm:w-auto">
                        <a href={connect(company.username).url}>
                            <IconBrandFacebook className="size-4" />
                            <FormattedMessage defaultMessage="Continue with Facebook" />
                        </a>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <Link href={selectPixel(company.username)}>
                            <FormattedMessage defaultMessage="Enter Pixel ID manually" />
                        </Link>
                    </Button>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground sm:w-full sm:basis-full">
                        <ShieldCheckIcon className="size-3.5 shrink-0" />
                        <FormattedMessage defaultMessage="Read-only access for pixel discovery and stats. You can disconnect anytime." />
                    </p>
                </>
            }
        />
    );
}
