import { Card, CardContent } from '@/components/ui/card';
import { cn, formatIDR } from '@/lib/utils';
import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type PeriodSummaryProps = {
    incomeAmount: number;
    expenseAmount: number;
    transactionCount: number;
    periodLabel: string;
};

function StatCard({
    label,
    value,
    tone,
    icon: Icon,
}: {
    label: React.ReactNode;
    value: string;
    tone: 'income' | 'expense';
    icon: typeof ArrowUpRightIcon;
}) {
    return (
        <Card className="overflow-hidden border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-5">
                <div
                    className={cn(
                        'flex size-9 items-center justify-center rounded-xl',
                        tone === 'income'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive',
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
                        tone === 'income' ? 'text-primary' : 'text-destructive',
                    )}
                >
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

export default function PeriodSummary({
    incomeAmount,
    expenseAmount,
    transactionCount,
    periodLabel,
}: PeriodSummaryProps) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                    label={
                        <FormattedMessage defaultMessage="Income in period" />
                    }
                    value={`+${formatIDR(incomeAmount)}`}
                    tone="income"
                    icon={ArrowUpRightIcon}
                />
                <StatCard
                    label={
                        <FormattedMessage defaultMessage="Expenses in period" />
                    }
                    value={`-${formatIDR(expenseAmount)}`}
                    tone="expense"
                    icon={ArrowDownRightIcon}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                <FormattedMessage
                    defaultMessage="{count} transactions in this period"
                    values={{ count: transactionCount }}
                />
            </p>
        </div>
    );
}
