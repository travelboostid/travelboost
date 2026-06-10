import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { cn, formatIDR } from '@/lib/utils';
import {
    ArrowDownRightIcon,
    ArrowUpRightIcon,
    MinusIcon,
    Plus,
    Repeat2,
    TrendingDownIcon,
    TrendingUpIcon,
    WalletIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { WalletPageProps } from '..';
import { TopupDialog } from './topup-dialog';
import { WithdrawDialog } from './withdraw-dialog';

function GrowthBadge({ value }: { value: number }) {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const Icon = isPositive
        ? TrendingUpIcon
        : isNegative
          ? TrendingDownIcon
          : MinusIcon;

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1 tabular-nums',
                isPositive &&
                    'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
                isNegative &&
                    'border-destructive/30 bg-destructive/5 text-destructive',
            )}
        >
            <Icon className="size-3" />
            {Math.abs(value)}%
        </Badge>
    );
}

function StatCard({
    label,
    value,
    tone,
    growth,
    lastMonth,
    icon: Icon,
}: {
    label: React.ReactNode;
    value: string;
    tone: 'income' | 'expense';
    growth?: number;
    lastMonth: number;
    icon: typeof ArrowUpRightIcon;
}) {
    return (
        <Card className="overflow-hidden border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div
                        className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl',
                            tone === 'income'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-destructive/10 text-destructive',
                        )}
                    >
                        <Icon className="size-4" />
                    </div>
                    {typeof growth === 'number' ? (
                        <GrowthBadge value={growth} />
                    ) : null}
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
                <p className="mt-2 text-xs text-muted-foreground">
                    <FormattedMessage
                        defaultMessage="Last month: {amount}"
                        values={{ amount: formatIDR(lastMonth) }}
                    />
                </p>
            </CardContent>
        </Card>
    );
}

export default function WalletSummary() {
    const { balance, income, expenses, net_change } =
        usePageProps<WalletPageProps>();

    const netPositive = net_change.this_month >= 0;

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden border-0 bg-linear-to-br from-primary/10 via-card to-card shadow-sm ring-1 ring-primary/10">
                <CardHeader className="space-y-4 pb-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                    <WalletIcon className="size-5" />
                                </div>
                                <div>
                                    <CardDescription className="text-xs font-medium tracking-wide uppercase">
                                        <FormattedMessage defaultMessage="Available balance" />
                                    </CardDescription>
                                    <CardTitle className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl lg:text-[2.5rem]">
                                        {formatIDR(balance)}
                                    </CardTitle>
                                </div>
                            </div>
                            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="Net change this month: {amount}"
                                    values={{
                                        amount: (
                                            <span
                                                className={cn(
                                                    'font-semibold tabular-nums',
                                                    netPositive
                                                        ? 'text-primary'
                                                        : 'text-destructive',
                                                )}
                                            >
                                                {netPositive ? '+' : '-'}
                                                {formatIDR(
                                                    Math.abs(
                                                        net_change.this_month,
                                                    ),
                                                )}
                                            </span>
                                        ),
                                    }}
                                />
                            </p>
                        </div>
                        <GrowthBadge value={net_change.growth_pct} />
                    </div>
                </CardHeader>

                <CardFooter className="flex flex-col gap-2 border-t border-primary/10 bg-background/40 pt-4 sm:flex-row">
                    <TopupDialog>
                        <Button
                            size="lg"
                            className="h-11 w-full gap-2 sm:flex-1"
                        >
                            <Plus className="size-4" />
                            <FormattedMessage defaultMessage="Top up" />
                        </Button>
                    </TopupDialog>
                    <WithdrawDialog>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-11 w-full gap-2 bg-background/80 sm:flex-1"
                        >
                            <Repeat2 className="size-4" />
                            <FormattedMessage defaultMessage="Withdraw" />
                        </Button>
                    </WithdrawDialog>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                    label={
                        <FormattedMessage defaultMessage="Income this month" />
                    }
                    value={`+${formatIDR(income.this_month)}`}
                    tone="income"
                    growth={income.growth_pct}
                    lastMonth={income.last_month}
                    icon={ArrowUpRightIcon}
                />
                <StatCard
                    label={
                        <FormattedMessage defaultMessage="Expenses this month" />
                    }
                    value={`-${formatIDR(expenses.this_month)}`}
                    tone="expense"
                    growth={expenses.growth_pct}
                    lastMonth={expenses.last_month}
                    icon={ArrowDownRightIcon}
                />
            </div>
        </div>
    );
}
