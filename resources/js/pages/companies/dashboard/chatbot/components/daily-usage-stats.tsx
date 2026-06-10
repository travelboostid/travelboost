'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import { ActivityIcon, BarChart3Icon, CalendarDaysIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { ChatbotPageProps } from '..';

const chartConfig = {
    cost: {
        label: 'Cost',
        color: 'var(--primary)',
    },
    num_interactions: {
        label: 'Interactions',
        color: 'var(--chart-2)',
    },
} satisfies ChartConfig;

function UsageStat({
    label,
    value,
    icon: Icon,
}: {
    label: React.ReactNode;
    value: string;
    icon: typeof ActivityIcon;
}) {
    return (
        <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
            </div>
            <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {value}
            </p>
        </div>
    );
}

export default function DailyUsageStats() {
    const { dailyStats, usageCostToday, usageCostIn30Days } =
        usePageProps<ChatbotPageProps>();

    const todayUsage = Number(usageCostToday ?? 0);
    const monthUsage = Number(usageCostIn30Days ?? 0);

    const normalizedData = (() => {
        if (!dailyStats?.length) {
            return [];
        }

        const map = new Map(
            dailyStats.map((item) => [
                new Date(item.date).toISOString().slice(0, 10),
                item,
            ]),
        );

        const start = new Date(dailyStats[0].date);
        const end = new Date(dailyStats[dailyStats.length - 1].date);

        const result: {
            date: string;
            cost: number;
            num_interactions: number;
        }[] = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().slice(0, 10);
            const item = map.get(key);

            result.push({
                date: key,
                cost: item ? Number(item.cost) : 0,
                num_interactions: item ? item.num_interactions : 0,
            });
        }

        return result;
    })();

    const hasUsage = normalizedData.some(
        (item) => item.cost > 0 || item.num_interactions > 0,
    );

    return (
        <Card className="@container/card flex h-full flex-col shadow-sm">
            <CardHeader className="gap-3 border-b pb-4">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BarChart3Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-base">
                            <FormattedMessage defaultMessage="Usage overview" />
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                            <FormattedMessage defaultMessage="Track daily spend and interactions from your chatbot." />
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
                <div className="grid grid-cols-2 gap-3">
                    <UsageStat
                        label={<FormattedMessage defaultMessage="Today" />}
                        value={formatIDR(todayUsage)}
                        icon={ActivityIcon}
                    />
                    <UsageStat
                        label={
                            <FormattedMessage defaultMessage="Last 30 days" />
                        }
                        value={formatIDR(monthUsage)}
                        icon={CalendarDaysIcon}
                    />
                </div>

                <div className="flex min-h-48 flex-1 flex-col">
                    {!hasUsage ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
                            <BarChart3Icon className="size-10 text-muted-foreground/50" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    <FormattedMessage defaultMessage="No usage yet" />
                                </p>
                                <p className="max-w-xs text-sm text-muted-foreground">
                                    <FormattedMessage defaultMessage="The chart will populate once your chatbot starts handling conversations." />
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ChartContainer
                            config={chartConfig}
                            className="aspect-auto min-h-48 w-full flex-1"
                        >
                            <AreaChart data={normalizedData}>
                                <defs>
                                    <linearGradient
                                        id="fillCost"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="var(--color-cost)"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="var(--color-cost)"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} />

                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);

                                        return date.toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'short',
                                                day: 'numeric',
                                            },
                                        );
                                    }}
                                />

                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(value) =>
                                                new Date(
                                                    value,
                                                ).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })
                                            }
                                            formatter={(value, name) => {
                                                if (name === 'cost') {
                                                    return [
                                                        'Cost ',
                                                        formatIDR(+value),
                                                    ];
                                                }

                                                if (
                                                    name === 'num_interactions'
                                                ) {
                                                    return [
                                                        value,
                                                        ' Interactions',
                                                    ];
                                                }

                                                return [value, name];
                                            }}
                                            indicator="dot"
                                        />
                                    }
                                />

                                <Area
                                    dataKey="cost"
                                    type="natural"
                                    fill="url(#fillCost)"
                                    stroke="var(--color-cost)"
                                />

                                <Area
                                    dataKey="num_interactions"
                                    type="natural"
                                    stroke="var(--color-num_interactions)"
                                    fillOpacity={0}
                                />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
