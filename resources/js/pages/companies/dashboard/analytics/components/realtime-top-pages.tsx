'use client';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { TrendingUpIcon } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';

type RealtimeTopPagesProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export default function RealtimeTopPages(props: RealtimeTopPagesProps) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();

    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5 text-chart-2" />
                    <FormattedMessage defaultMessage="Top Pages" />
                </CardTitle>
                <CardDescription>
                    <FormattedMessage defaultMessage="Most viewed pages" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {realtimeInsights.pages.map((page: any) => (
                        <div
                            key={page.name}
                            className="flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <p className="font-medium text-foreground">
                                    {page.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage defaultMessage="Page views" />
                                </p>
                            </div>
                            <Badge variant="secondary">{page.value}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
