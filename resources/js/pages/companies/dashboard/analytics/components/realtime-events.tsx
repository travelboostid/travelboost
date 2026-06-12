import usePageProps from '@/hooks/use-page-props';
import { ActivityIcon } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import { AnalyticsDonutChart } from './analytics-donut-chart';
import { AnalyticsPanel } from './analytics-panel';
import { toBreakdownItems } from './analytics-utils';

type RealtimeEventsProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export default function RealtimeEvents(props: RealtimeEventsProps) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();
    const items = toBreakdownItems(realtimeInsights?.events, 'value');

    return (
        <AnalyticsPanel
            {...props}
            icon={ActivityIcon}
            iconClassName="text-violet-600 dark:text-violet-400"
            title={<FormattedMessage defaultMessage="Event types" />}
            description={
                <FormattedMessage defaultMessage="Events in the last 30 minutes" />
            }
        >
            <AnalyticsDonutChart
                items={items}
                valueLabel={<FormattedMessage defaultMessage="Events" />}
            />
        </AnalyticsPanel>
    );
}
