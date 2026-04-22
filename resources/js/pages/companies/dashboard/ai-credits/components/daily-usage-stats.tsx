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
import type { AiCreditsPageProps } from '..';

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

export default function DailyUsageStats() {
  const { dailyStats } = usePageProps<AiCreditsPageProps>();

  // ✅ Normalize + fill missing dates
  const normalizedData = (() => {
    if (!dailyStats?.length) return [];

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

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Daily AI Credits Usage</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Graph showing daily AI credits usage (cost, input tokens, output
            tokens) in last 30 days.
          </span>
          <span className="@[540px]/card:hidden">Usage</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-62.5 w-full"
        >
          <AreaChart data={normalizedData}>
            <defs>
              <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
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
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                  formatter={(value, name) => {
                    if (name === 'cost') return ['Cost ', formatIDR(+value)];
                    if (name === 'num_interactions')
                      return [value, ' Interactions'];
                    return [value, name];
                  }}
                  indicator="dot"
                />
              }
            />

            {/* Cost (area) */}
            <Area
              dataKey="cost"
              type="natural"
              fill="url(#fillCost)"
              stroke="var(--color-cost)"
            />

            {/* Interactions (line) */}
            <Area
              dataKey="num_interactions"
              type="natural"
              stroke="var(--color-num_interactions)"
              fillOpacity={0}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
