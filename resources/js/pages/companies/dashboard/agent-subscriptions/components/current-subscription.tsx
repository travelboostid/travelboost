import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { cn, formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import {
    CalendarDaysIcon,
    CheckCircle2Icon,
    Clock3Icon,
    CrownIcon,
    PackageIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { AgentSubscriptionPageProps } from '..';

function statusConfig(status: string) {
    switch (status) {
        case 'active':
            return {
                label: <FormattedMessage defaultMessage="Active" />,
                className:
                    'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
                iconClass:
                    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                cardRing: 'ring-emerald-500/15',
            };
        case 'expired':
            return {
                label: <FormattedMessage defaultMessage="Expired" />,
                className:
                    'border-destructive/30 bg-destructive/5 text-destructive',
                iconClass: 'bg-destructive/15 text-destructive',
                cardRing: 'ring-destructive/15',
            };
        default:
            return {
                label: <FormattedMessage defaultMessage="Inactive" />,
                className: 'text-muted-foreground',
                iconClass: 'bg-muted text-muted-foreground',
                cardRing: 'ring-border',
            };
    }
}

export function CurrentSubscription() {
    const { agentSubscription } = usePageProps<AgentSubscriptionPageProps>();

    if (!agentSubscription) {
        return null;
    }

    const status = agentSubscription.status ?? 'inactive';
    const config = statusConfig(status);
    const endedAt = agentSubscription.ended_at
        ? dayjs(agentSubscription.ended_at)
        : null;
    const startedAt = agentSubscription.started_at
        ? dayjs(agentSubscription.started_at)
        : null;
    const daysRemaining = endedAt ? endedAt.diff(dayjs(), 'day') : null;
    const isExpiringSoon =
        status === 'active' &&
        daysRemaining !== null &&
        daysRemaining >= 0 &&
        daysRemaining <= 14;

    return (
        <Card
            className={cn(
                'flex h-full flex-col overflow-hidden border-0 bg-linear-to-br from-primary/10 via-card to-card shadow-sm ring-1',
                config.cardRing,
            )}
        >
            <CardHeader className="space-y-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'flex size-12 items-center justify-center rounded-2xl shadow-sm',
                                status === 'active'
                                    ? 'bg-primary text-primary-foreground'
                                    : config.iconClass,
                            )}
                        >
                            <CrownIcon className="size-5" />
                        </div>
                        <div>
                            <CardDescription className="text-xs font-medium tracking-wide uppercase">
                                <FormattedMessage defaultMessage="Current plan" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {agentSubscription.package.name}
                            </CardTitle>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn('shrink-0', config.className)}
                    >
                        {config.label}
                    </Badge>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                    <FormattedMessage
                        defaultMessage="{price} for {months, plural, one {# month} other {# months}}"
                        values={{
                            price: formatIDR(agentSubscription.package.price),
                            months: agentSubscription.package.duration_months,
                        }}
                    />
                </p>
            </CardHeader>

            <CardContent className="mt-auto space-y-3 border-t border-primary/10 bg-background/40 pt-4">
                {endedAt ? (
                    <div className="flex items-start gap-3 rounded-xl border bg-background/80 px-4 py-3">
                        <CalendarDaysIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <FormattedMessage defaultMessage="Valid until" />
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {endedAt.format('DD MMM YYYY')}
                            </p>
                            {status === 'active' && daysRemaining !== null ? (
                                <p
                                    className={cn(
                                        'mt-1 text-xs font-medium',
                                        isExpiringSoon
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {daysRemaining < 0 ? (
                                        <FormattedMessage defaultMessage="Expired" />
                                    ) : daysRemaining === 0 ? (
                                        <FormattedMessage defaultMessage="Expires today" />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="{days, plural, one {# day} other {# days}} remaining"
                                            values={{ days: daysRemaining }}
                                        />
                                    )}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {startedAt ? (
                    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3">
                        <CheckCircle2Icon className="size-4 shrink-0 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            <FormattedMessage
                                defaultMessage="Started {date}"
                                values={{
                                    date: startedAt.format('DD MMM YYYY'),
                                }}
                            />
                        </p>
                    </div>
                ) : null}

                {isExpiringSoon ? (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                        <Clock3Icon className="size-3.5 shrink-0" />
                        <FormattedMessage defaultMessage="Renew soon to avoid interruption to your agent services." />
                    </div>
                ) : null}

                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3">
                    <PackageIcon className="size-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        <FormattedMessage
                            defaultMessage="Billing cycle: {months, plural, one {# month} other {# months}}"
                            values={{
                                months: agentSubscription.package
                                    .duration_months,
                            }}
                        />
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
