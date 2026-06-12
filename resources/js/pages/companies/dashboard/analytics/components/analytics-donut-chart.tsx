import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { PieChartIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { applyChartColors, type BreakdownItem } from './analytics-utils';

type AnalyticsDonutChartProps = {
    items: BreakdownItem[];
    valueLabel: ReactNode;
};

export function AnalyticsDonutChart({
    items,
    valueLabel,
}: AnalyticsDonutChartProps) {
    const intl = useIntl();

    if (items.length === 0) {
        return (
            <Empty className="border-none py-8">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <PieChartIcon />
                    </EmptyMedia>
                    <EmptyTitle>
                        <FormattedMessage defaultMessage="No data yet" />
                    </EmptyTitle>
                    <EmptyDescription>
                        <FormattedMessage defaultMessage="Breakdown will appear once traffic is recorded." />
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    const chartData = applyChartColors(items);
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="space-y-4">
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => [
                                intl.formatNumber(Number(value)),
                                valueLabel,
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
                {chartData.map((item) => (
                    <li
                        key={item.name}
                        className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: item.fill }}
                            />
                            <span className="truncate font-medium">
                                {item.name}
                            </span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                            {total > 0
                                ? Math.round((item.value / total) * 100)
                                : 0}
                            %
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
