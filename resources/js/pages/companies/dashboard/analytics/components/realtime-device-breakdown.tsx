'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { Smartphone } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AnalyticsPageProps } from '..';

/**
 * Stable string hash → number
 */
function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

/**
 * Deterministic, visually balanced HSL color
 */
function getColorFromLabel(label: string) {
    const hue = hashString(label) % 360;
    return `hsl(${hue} 70% 55%)`;
}

/**
 * Attach color directly to data (Cell replacement approach)
 */
function applyChartColors<T extends { name: string }>(data: T[]) {
    return data.map((item) => ({
        ...item,
        fill: getColorFromLabel(item.name),
    }));
}

type RealtimeDeviceBreakdownProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;
export default function RealtimeDeviceBreakdown(
    props: RealtimeDeviceBreakdownProps,
) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();

    const devicesWithColors = applyChartColors(realtimeInsights.devices);

    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-chart-1" />
                    Device Breakdown
                </CardTitle>
                <CardDescription>User distribution by device</CardDescription>
            </CardHeader>

            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={devicesWithColors}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            dataKey="value"
                        />

                        <Tooltip formatter={(value) => `${value} user(s)`} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
