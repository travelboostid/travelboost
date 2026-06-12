import usePageProps from '@/hooks/use-page-props';
import { TrendingUpIcon } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';
import { AnalyticsPanel } from './analytics-panel';
import { AnalyticsRankedList, formatPageName } from './analytics-ranked-list';
import { toBreakdownItems } from './analytics-utils';

type RealtimeTopPagesProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export default function RealtimeTopPages(props: RealtimeTopPagesProps) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();
    const items = toBreakdownItems(realtimeInsights?.pages, 'value');

    return (
        <AnalyticsPanel
            {...props}
            icon={TrendingUpIcon}
            iconClassName="text-emerald-600 dark:text-emerald-400"
            title={<FormattedMessage defaultMessage="Top pages" />}
            description={
                <FormattedMessage defaultMessage="Most viewed pages right now" />
            }
        >
            <AnalyticsRankedList
                items={items}
                formatName={formatPageName}
                valueLabel={<FormattedMessage defaultMessage="Page views" />}
            />
        </AnalyticsPanel>
    );
}
