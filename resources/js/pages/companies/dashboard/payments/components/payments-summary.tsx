import { Card, CardContent } from '@/components/ui/card';
import { cn, formatIDR } from '@/lib/utils';
import { CheckCircle2Icon, CoinsIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type PaymentsSummaryProps = {
    totalAmount: number;
    totalCount: number;
    paidCount: number;
    pendingCount: number;
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
    tone: 'total' | 'pending';
    icon: typeof CoinsIcon;
}) {
    return (
        <Card className="overflow-hidden border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-5">
                <div
                    className={cn(
                        'flex size-9 items-center justify-center rounded-xl',
                        tone === 'total'
                            ? 'bg-primary/10 text-primary'
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
                        tone === 'total'
                            ? 'text-primary'
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

export default function PaymentsSummary({
    totalAmount,
    totalCount,
    paidCount,
    pendingCount,
    periodLabel,
}: PaymentsSummaryProps) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                    label={<FormattedMessage defaultMessage="Total payments" />}
                    value={formatIDR(totalAmount)}
                    subtitle={
                        <FormattedMessage
                            defaultMessage="{count} transactions · {paid} paid"
                            values={{ count: totalCount, paid: paidCount }}
                        />
                    }
                    tone="total"
                    icon={CoinsIcon}
                />
                <StatCard
                    label={
                        <FormattedMessage defaultMessage="Awaiting payment" />
                    }
                    value={String(pendingCount)}
                    subtitle={
                        <FormattedMessage defaultMessage="Unpaid or pending" />
                    }
                    tone="pending"
                    icon={CheckCircle2Icon}
                />
            </div>
        </div>
    );
}
