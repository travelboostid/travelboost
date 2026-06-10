import { Card, CardContent } from '@/components/ui/card';
import { cn, formatIDR } from '@/lib/utils';
import { ArrowDownRightIcon, Clock3Icon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type WithdrawalsSummaryProps = {
    totalAmount: number;
    totalCount: number;
    pendingAmount: number;
    completedAmount: number;
    periodLabel: string;
};

function StatCard({
    label,
    value,
    subtitle,
    tone,
    icon: Icon,
}: {
    label: React.ReactNode;
    value: string;
    subtitle: React.ReactNode;
    tone: 'withdrawn' | 'pending';
    icon: typeof ArrowDownRightIcon;
}) {
    return (
        <Card className="overflow-hidden border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-5">
                <div
                    className={cn(
                        'flex size-9 items-center justify-center rounded-xl',
                        tone === 'withdrawn'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <p
                    className={cn(
                        'mt-1 text-2xl font-bold tabular-nums sm:text-3xl',
                        tone === 'withdrawn'
                            ? 'text-destructive'
                            : 'text-amber-700 dark:text-amber-300',
                    )}
                >
                    {value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
            </CardContent>
        </Card>
    );
}

export default function WithdrawalsSummary({
    totalAmount,
    totalCount,
    pendingAmount,
    completedAmount,
    periodLabel,
}: WithdrawalsSummaryProps) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                    label={
                        <FormattedMessage defaultMessage="Total withdrawn" />
                    }
                    value={formatIDR(totalAmount)}
                    subtitle={
                        <FormattedMessage
                            defaultMessage="{count} withdrawals · {completed} completed"
                            values={{
                                count: totalCount,
                                completed: formatIDR(completedAmount),
                            }}
                        />
                    }
                    tone="withdrawn"
                    icon={ArrowDownRightIcon}
                />
                <StatCard
                    label={<FormattedMessage defaultMessage="Pending" />}
                    value={formatIDR(pendingAmount)}
                    subtitle={
                        <FormattedMessage defaultMessage="Awaiting transfer" />
                    }
                    tone="pending"
                    icon={Clock3Icon}
                />
            </div>
        </div>
    );
}
