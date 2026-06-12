import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BarChart3Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import type { BreakdownItem } from './analytics-utils';
import { formatPagePath } from './analytics-utils';

type AnalyticsRankedListProps = {
    items: BreakdownItem[];
    valueLabel: ReactNode;
    formatName?: (name: string) => string;
    maxItems?: number;
    className?: string;
};

export function AnalyticsRankedList({
    items,
    valueLabel,
    formatName = (name) => name,
    maxItems = 8,
    className,
}: AnalyticsRankedListProps) {
    const visibleItems = items.slice(0, maxItems);
    const maxValue = Math.max(...visibleItems.map((item) => item.value), 1);

    if (visibleItems.length === 0) {
        return (
            <Empty className="border-none py-8">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <BarChart3Icon />
                    </EmptyMedia>
                    <EmptyTitle>
                        <FormattedMessage defaultMessage="No data yet" />
                    </EmptyTitle>
                    <EmptyDescription>
                        <FormattedMessage defaultMessage="Data will appear here once visitors interact with your site." />
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {visibleItems.map((item, index) => {
                const barValue =
                    item.percentage ??
                    Math.round((item.value / maxValue) * 100);
                const displayName = formatName(item.name);

                return (
                    <div key={`${item.name}-${index}`} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p
                                    className="truncate text-sm font-medium text-foreground"
                                    title={displayName}
                                >
                                    {displayName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {valueLabel}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold tabular-nums text-foreground">
                                    {item.value.toLocaleString()}
                                </p>
                                {item.percentage !== undefined ? (
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        {item.percentage}%
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <Progress value={barValue} className="h-1.5" />
                    </div>
                );
            })}
        </div>
    );
}

export function formatPageName(name: string): string {
    return formatPagePath(name);
}
