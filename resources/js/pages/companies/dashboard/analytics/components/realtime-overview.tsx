import usePageProps from '@/hooks/use-page-props';
import { cn } from '@/lib/utils';
import { EyeIcon, UsersIcon, ZapIcon } from 'lucide-react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import { AnalyticsStatCards } from './analytics-stat-cards';

type RealtimeOverviewProps = {
    className?: string;
};

export default function RealtimeOverview({ className }: RealtimeOverviewProps) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();
    const overview = realtimeInsights?.overview;

    if (!overview) {
        return null;
    }

    return (
        <AnalyticsStatCards
            className={cn('sm:grid-cols-3', className)}
            items={[
                {
                    label: <FormattedMessage defaultMessage="Active users" />,
                    value: <FormattedNumber value={overview.active_users} />,
                    hint: (
                        <FormattedMessage defaultMessage="Right now on your site" />
                    ),
                    icon: UsersIcon,
                    iconClassName: 'text-blue-600 dark:text-blue-400',
                },
                {
                    label: <FormattedMessage defaultMessage="Page views" />,
                    value: <FormattedNumber value={overview.page_views} />,
                    hint: <FormattedMessage defaultMessage="Last 30 minutes" />,
                    icon: EyeIcon,
                    iconClassName: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                    label: <FormattedMessage defaultMessage="Events" />,
                    value: <FormattedNumber value={overview.events} />,
                    hint: <FormattedMessage defaultMessage="Last 30 minutes" />,
                    icon: ZapIcon,
                    iconClassName: 'text-amber-600 dark:text-amber-400',
                },
            ]}
        />
    );
}
