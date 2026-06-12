import usePageProps from '@/hooks/use-page-props';
import {
    GlobeIcon,
    LayersIcon,
    MonitorIcon,
    Share2Icon,
    SmartphoneIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import { AnalyticsDonutChart } from './analytics-donut-chart';
import { AnalyticsPanel } from './analytics-panel';
import { AnalyticsRankedList } from './analytics-ranked-list';
import { toBreakdownItems } from './analytics-utils';
import PeriodOverview from './period-overview';

export default function AnalyticsOverviewContent() {
    const { insights } = usePageProps<AnalyticsPageProps>();

    if (!insights) {
        return null;
    }

    return (
        <>
            <PeriodOverview />

            <div className="grid gap-4 lg:grid-cols-2">
                <AnalyticsPanel
                    icon={SmartphoneIcon}
                    iconClassName="text-blue-600 dark:text-blue-400"
                    title={<FormattedMessage defaultMessage="Devices" />}
                    description={
                        <FormattedMessage defaultMessage="Users by device type" />
                    }
                >
                    <AnalyticsDonutChart
                        items={toBreakdownItems(insights.devices, 'users')}
                        valueLabel={<FormattedMessage defaultMessage="Users" />}
                    />
                </AnalyticsPanel>

                <AnalyticsPanel
                    icon={LayersIcon}
                    iconClassName="text-violet-600 dark:text-violet-400"
                    title={
                        <FormattedMessage defaultMessage="Traffic channels" />
                    }
                    description={
                        <FormattedMessage defaultMessage="How visitors found your site" />
                    }
                >
                    <AnalyticsRankedList
                        items={toBreakdownItems(insights.channels, 'sessions')}
                        valueLabel={
                            <FormattedMessage defaultMessage="Sessions" />
                        }
                    />
                </AnalyticsPanel>

                <AnalyticsPanel
                    icon={GlobeIcon}
                    iconClassName="text-sky-600 dark:text-sky-400"
                    title={<FormattedMessage defaultMessage="Top countries" />}
                    description={
                        <FormattedMessage defaultMessage="Geographic distribution of users" />
                    }
                >
                    <AnalyticsRankedList
                        items={toBreakdownItems(insights.countries, 'users')}
                        valueLabel={<FormattedMessage defaultMessage="Users" />}
                    />
                </AnalyticsPanel>

                <AnalyticsPanel
                    icon={MonitorIcon}
                    iconClassName="text-amber-600 dark:text-amber-400"
                    title={<FormattedMessage defaultMessage="Browsers" />}
                    description={
                        <FormattedMessage defaultMessage="Most used browsers" />
                    }
                >
                    <AnalyticsRankedList
                        items={toBreakdownItems(insights.browsers, 'users')}
                        valueLabel={<FormattedMessage defaultMessage="Users" />}
                    />
                </AnalyticsPanel>

                <AnalyticsPanel
                    className="lg:col-span-2"
                    icon={Share2Icon}
                    iconClassName="text-pink-600 dark:text-pink-400"
                    title={<FormattedMessage defaultMessage="Social sources" />}
                    description={
                        <FormattedMessage defaultMessage="Sessions from social networks" />
                    }
                >
                    <AnalyticsRankedList
                        items={toBreakdownItems(
                            insights.social_sources,
                            'sessions',
                        )}
                        valueLabel={
                            <FormattedMessage defaultMessage="Sessions" />
                        }
                        maxItems={10}
                    />
                </AnalyticsPanel>
            </div>
        </>
    );
}
