import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { PromotionBudgetPageProps } from '..';

function transactionLabel(type: string): React.ReactNode {
    switch (type) {
        case 'topup':
            return <FormattedMessage defaultMessage="Top-up" />;
        case 'spend':
            return <FormattedMessage defaultMessage="Ad spend" />;
        case 'adjustment':
            return <FormattedMessage defaultMessage="Adjustment" />;
        default:
            return type;
    }
}

export default function RecentPromotionBudgetTransactions() {
    const { recentTransactions } = usePageProps<PromotionBudgetPageProps>();

    if (!recentTransactions.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        <FormattedMessage defaultMessage="Recent activity" />
                    </CardTitle>
                    <CardDescription>
                        <FormattedMessage defaultMessage="Top-ups and ad spend will appear here." />
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    <FormattedMessage defaultMessage="Recent activity" />
                </CardTitle>
                <CardDescription>
                    <FormattedMessage defaultMessage="Latest promotion budget transactions." />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {recentTransactions.map((transaction) => {
                    const isCredit =
                        transaction.type === 'topup' ||
                        transaction.type === 'adjustment';

                    return (
                        <div
                            key={transaction.id}
                            className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className={
                                        isCredit
                                            ? 'text-emerald-600'
                                            : 'text-orange-600'
                                    }
                                >
                                    {isCredit ? (
                                        <ArrowUpIcon className="size-4" />
                                    ) : (
                                        <ArrowDownIcon className="size-4" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        {transaction.description ??
                                            transactionLabel(transaction.type)}
                                    </p>
                                    {transaction.created_at ? (
                                        <p className="text-xs text-muted-foreground">
                                            {dayjs(
                                                transaction.created_at,
                                            ).format('D MMM YYYY, HH:mm')}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums">
                                    {isCredit ? '+' : '-'}
                                    {formatIDR(transaction.amount)}
                                </p>
                                <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                >
                                    {transactionLabel(transaction.type)}
                                </Badge>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
