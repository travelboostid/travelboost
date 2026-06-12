import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FormattedMessage } from 'react-intl';

function StatCardSkeleton() {
    return (
        <Card className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="flex items-start gap-4 p-5">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </CardContent>
        </Card>
    );
}

function PanelSkeleton() {
    return (
        <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
        </Card>
    );
}

export function AnalyticsOverviewSkeleton() {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200/80 bg-muted/20 px-4 py-3 dark:border-slate-800">
                <p className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Loading last 30 days from Google Analytics…" />
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((index) => (
                    <StatCardSkeleton key={index} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {[0, 1, 2, 3, 4].map((index) => (
                    <PanelSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}

export function AnalyticsRealtimeSkeleton() {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200/80 bg-muted/20 px-4 py-3 dark:border-slate-800">
                <p className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Loading live visitor data…" />
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((index) => (
                    <StatCardSkeleton key={index} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {[0, 1, 2, 3].map((index) => (
                    <PanelSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}
