import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type AnalyticsPanelProps = {
    title: ReactNode;
    description?: ReactNode;
    icon: LucideIcon;
    iconClassName?: string;
    children: ReactNode;
    className?: string;
};

export function AnalyticsPanel({
    title,
    description,
    icon: Icon,
    iconClassName,
    children,
    className,
}: AnalyticsPanelProps) {
    return (
        <Card
            className={cn(
                'border-slate-200/80 shadow-sm dark:border-slate-800',
                className,
            )}
        >
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span
                        className={cn(
                            'flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800',
                            iconClassName,
                        )}
                    >
                        <Icon className="size-4" />
                    </span>
                    {title}
                </CardTitle>
                {description ? (
                    <CardDescription>{description}</CardDescription>
                ) : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
