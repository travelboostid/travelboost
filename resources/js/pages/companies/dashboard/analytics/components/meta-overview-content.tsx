import usePageProps from '@/hooks/use-page-props';
import {
    ActivityIcon,
    GlobeIcon,
    LayersIcon,
    MousePointerClickIcon,
} from 'lucide-react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import type { MetaAnalyticsPageProps } from '../meta';
import { AnalyticsPanel } from './analytics-panel';
import { AnalyticsRankedList } from './analytics-ranked-list';
import { AnalyticsStatCards } from './analytics-stat-cards';

export default function MetaOverviewContent() {
    const { metaInsights } = usePageProps<MetaAnalyticsPageProps>();

    if (!metaInsights) {
        return null;
    }

    const { overview, events, urls, devices } = metaInsights;

    return (
        <div className="space-y-6">
            <AnalyticsStatCards
                items={[
                    {
                        label: (
                            <FormattedMessage defaultMessage="Total events" />
                        ),
                        value: <FormattedNumber value={overview.events} />,
                        hint: <FormattedMessage defaultMessage="Last 7 days" />,
                        icon: ActivityIcon,
                        iconClassName: 'text-blue-600 dark:text-blue-400',
                    },
                    {
                        label: <FormattedMessage defaultMessage="Page views" />,
                        value: <FormattedNumber value={overview.page_views} />,
                        hint: <FormattedMessage defaultMessage="Last 7 days" />,
                        icon: MousePointerClickIcon,
                        iconClassName: 'text-emerald-600 dark:text-emerald-400',
                    },
                    {
                        label: (
                            <FormattedMessage defaultMessage="Unique events" />
                        ),
                        value: (
                            <FormattedNumber value={overview.unique_events} />
                        ),
                        hint: <FormattedMessage defaultMessage="Last 7 days" />,
                        icon: LayersIcon,
                        iconClassName: 'text-violet-600 dark:text-violet-400',
                    },
                ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
                <AnalyticsPanel
                    icon={ActivityIcon}
                    iconClassName="text-blue-600 dark:text-blue-400"
                    title={<FormattedMessage defaultMessage="Top events" />}
                    description={
                        <FormattedMessage defaultMessage="Most fired pixel events" />
                    }
                >
                    <AnalyticsRankedList
                        items={events.map((item) => ({
                            name: item.name,
                            value: item.count,
                            percentage: item.percentage,
                        }))}
                        valueLabel={<FormattedMessage defaultMessage="Count" />}
                    />
                </AnalyticsPanel>

                <AnalyticsPanel
                    icon={GlobeIcon}
                    iconClassName="text-sky-600 dark:text-sky-400"
                    title={<FormattedMessage defaultMessage="Top URLs" />}
                    description={
                        <FormattedMessage defaultMessage="Pages with the most pixel activity" />
                    }
                >
                    <AnalyticsRankedList
                        items={urls.map((item) => ({
                            name: item.name,
                            value: item.count,
                            percentage: item.percentage,
                        }))}
                        valueLabel={<FormattedMessage defaultMessage="Count" />}
                    />
                </AnalyticsPanel>

                <AnalyticsPanel
                    className="lg:col-span-2"
                    icon={LayersIcon}
                    iconClassName="text-violet-600 dark:text-violet-400"
                    title={<FormattedMessage defaultMessage="Devices" />}
                    description={
                        <FormattedMessage defaultMessage="Events by device type" />
                    }
                >
                    <AnalyticsRankedList
                        items={devices.map((item) => ({
                            name: item.name,
                            value: item.count,
                            percentage: item.percentage,
                        }))}
                        valueLabel={<FormattedMessage defaultMessage="Count" />}
                    />
                </AnalyticsPanel>
            </div>
        </div>
    );
}
