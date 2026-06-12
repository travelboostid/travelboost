import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type StatCardItem = {
    label: ReactNode;
    value: ReactNode;
    hint?: ReactNode;
    icon: LucideIcon;
    iconClassName?: string;
};

type AnalyticsStatCardsProps = {
    items: StatCardItem[];
    className?: string;
};

export function AnalyticsStatCards({
    items,
    className,
}: AnalyticsStatCardsProps) {
    return (
        <div
            className={cn(
                'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
                className,
            )}
        >
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <Card
                        key={String(item.label)}
                        className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800"
                    >
                        <CardContent className="flex items-start gap-4 p-5">
                            <div
                                className={cn(
                                    'flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800',
                                    item.iconClassName,
                                )}
                            >
                                <Icon className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {item.label}
                                </p>
                                <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                    {item.value}
                                </p>
                                {item.hint ? (
                                    <p className="text-xs text-muted-foreground">
                                        {item.hint}
                                    </p>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
