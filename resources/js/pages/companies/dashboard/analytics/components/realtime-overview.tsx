import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { cn } from '@/lib/utils';
import { EyeIcon, UsersIcon, ZapIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';

type RealtimeOverviewProps = HTMLAttributes<HTMLDivElement>;

export default function RealtimeOverview({
    className,
    ...otherProps
}: RealtimeOverviewProps) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();
    const totalPageViews = realtimeInsights.overview.page_views;
    const totalActiveUsers = realtimeInsights.overview.active_users;
    const totalEvents = realtimeInsights.overview.events;
    return (
        <div
            className={cn('grid gap-4 md:grid-cols-3', className)}
            {...otherProps}
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        <FormattedMessage defaultMessage="Active Users" />
                    </CardTitle>
                    <UsersIcon className="h-4 w-4 text-chart-1" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {totalActiveUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <FormattedMessage defaultMessage="Currently active" />
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        <FormattedMessage defaultMessage="Page Views" />
                    </CardTitle>
                    <EyeIcon className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {totalPageViews}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <FormattedMessage defaultMessage="Today's views" />
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        <FormattedMessage defaultMessage="Events" />
                    </CardTitle>
                    <ZapIcon className="h-4 w-4 text-chart-3" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {totalEvents}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <FormattedMessage defaultMessage="Total events" />
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
