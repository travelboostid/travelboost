import usePageProps from '@/hooks/use-page-props';
import {
    ActivityIcon,
    MousePointerClickIcon,
    PercentIcon,
    UsersIcon,
} from 'lucide-react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import { AnalyticsStatCards } from './analytics-stat-cards';

export default function PeriodOverview() {
    const { insights } = usePageProps<AnalyticsPageProps>();

    if (!insights?.overview) {
        return null;
    }

    const { users, sessions, page_views, bounce_rate } = insights.overview;

    return (
        <AnalyticsStatCards
            items={[
                {
                    label: <FormattedMessage defaultMessage="Active users" />,
                    value: <FormattedNumber value={users} />,
                    hint: <FormattedMessage defaultMessage="Last 30 days" />,
                    icon: UsersIcon,
                    iconClassName: 'text-blue-600 dark:text-blue-400',
                },
                {
                    label: <FormattedMessage defaultMessage="Sessions" />,
                    value: <FormattedNumber value={sessions} />,
                    hint: <FormattedMessage defaultMessage="Last 30 days" />,
                    icon: ActivityIcon,
                    iconClassName: 'text-violet-600 dark:text-violet-400',
                },
                {
                    label: <FormattedMessage defaultMessage="Page views" />,
                    value: <FormattedNumber value={page_views} />,
                    hint: <FormattedMessage defaultMessage="Last 30 days" />,
                    icon: MousePointerClickIcon,
                    iconClassName: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                    label: <FormattedMessage defaultMessage="Bounce rate" />,
                    value: `${bounce_rate}%`,
                    hint: (
                        <FormattedMessage defaultMessage="Single-page sessions" />
                    ),
                    icon: PercentIcon,
                    iconClassName: 'text-amber-600 dark:text-amber-400',
                },
            ]}
        />
    );
}
