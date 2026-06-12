import usePageProps from '@/hooks/use-page-props';
import { GlobeIcon } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import { AnalyticsPanel } from './analytics-panel';
import { AnalyticsRankedList } from './analytics-ranked-list';
import { toBreakdownItems } from './analytics-utils';

type RealtimeTopCountriesProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export default function RealtimeTopCountries(props: RealtimeTopCountriesProps) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();
    const items = toBreakdownItems(realtimeInsights?.countries, 'value');

    return (
        <AnalyticsPanel
            {...props}
            icon={GlobeIcon}
            iconClassName="text-sky-600 dark:text-sky-400"
            title={<FormattedMessage defaultMessage="Top countries" />}
            description={
                <FormattedMessage defaultMessage="Where your live visitors are from" />
            }
        >
            <AnalyticsRankedList
                items={items}
                valueLabel={<FormattedMessage defaultMessage="Active users" />}
            />
        </AnalyticsPanel>
    );
}
