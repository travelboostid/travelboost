'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { ActivityIcon } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AnalyticsPageProps } from '..';

function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function getColorFromLabel(label: string) {
    const hue = hashString(label) % 360;
    return `hsl(${hue} 70% 55%)`;
}

function applyChartColors<T extends { name: string }>(data: T[]) {
    return data.map((item) => ({
        ...item,
        fill: getColorFromLabel(item.name),
    }));
}

type RealtimeEventsProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export default function RealtimeEvents(props: RealtimeEventsProps) {
    const intl = useIntl();
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();

    const eventsWithColors = applyChartColors(realtimeInsights.events);

    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5 text-chart-5" />
                    <FormattedMessage defaultMessage="Event Types" />
                </CardTitle>
                <CardDescription>
                    <FormattedMessage defaultMessage="Event distribution" />
                </CardDescription>
            </CardHeader>

            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={eventsWithColors}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            dataKey="value"
                        />

                        <Tooltip
                            formatter={(value) =>
                                intl.formatMessage(
                                    {
                                        defaultMessage: '{count} event(s)',
                                    },
                                    { count: value },
                                )
                            }
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
