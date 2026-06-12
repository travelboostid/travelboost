import usePageProps from '@/hooks/use-page-props';
import { SmartphoneIcon } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import { AnalyticsDonutChart } from './analytics-donut-chart';
import { AnalyticsPanel } from './analytics-panel';
import { toBreakdownItems } from './analytics-utils';

type RealtimeDeviceBreakdownProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export default function RealtimeDeviceBreakdown(
    props: RealtimeDeviceBreakdownProps,
) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();
    const items = toBreakdownItems(realtimeInsights?.devices, 'value');

    return (
        <AnalyticsPanel
            {...props}
            icon={SmartphoneIcon}
            iconClassName="text-blue-600 dark:text-blue-400"
            title={<FormattedMessage defaultMessage="Devices" />}
            description={
                <FormattedMessage defaultMessage="Active users by device category" />
            }
        >
            <AnalyticsDonutChart
                items={items}
                valueLabel={<FormattedMessage defaultMessage="Users" />}
            />
        </AnalyticsPanel>
    );
}
