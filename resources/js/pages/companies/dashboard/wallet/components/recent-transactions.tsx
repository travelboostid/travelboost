import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { buildWalletQueryParams } from '@/components/wallet/wallet-selector-applet';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn, formatIDR } from '@/lib/utils';
import { index } from '@/routes/companies/dashboard/wallet-transaction';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    ArrowDownLeft,
    ArrowRightIcon,
    ArrowUpRight,
    ReceiptTextIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { WalletPageProps } from '..';
import EmptyRecentTransactions from './empty-recent-transactions';

dayjs.extend(relativeTime);

type Transaction = WalletPageProps['transactions'][number];

function TransactionItem({ transaction }: { transaction: Transaction }) {
    const isIncome = transaction.amount > 0;
    const Icon = isIncome ? ArrowUpRight : ArrowDownLeft;
    const description = transaction.meta?.description || 'Wallet transaction';

    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-background/60 p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        isIncome
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive',
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                        {description}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {dayjs(transaction.created_at).format(
                            'DD MMM YYYY, HH:mm',
                        )}
                        <span className="mx-1.5 text-muted-foreground/50">
                            ·
                        </span>
                        {dayjs(transaction.created_at).fromNow()}
                    </p>
                </div>
            </div>
            <p
                className={cn(
                    'shrink-0 text-right text-sm font-semibold tabular-nums sm:text-base',
                    isIncome ? 'text-primary' : 'text-destructive',
                )}
            >
                {isIncome ? '+' : '-'}
                {formatIDR(Math.abs(transaction.amount))}
            </p>
        </div>
    );
}

export default function RecentTransactions() {
    const { company } = usePageSharedDataProps();
    const { transactions, wallet } = usePageProps<WalletPageProps>();
    const walletQuery = buildWalletQueryParams(wallet.slug);

    return (
        <Card className="h-full border shadow-sm">
            <CardHeader className="gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <ReceiptTextIcon className="size-4" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">
                            <FormattedMessage defaultMessage="Recent transactions" />
                        </CardTitle>
                        <CardDescription>
                            <FormattedMessage defaultMessage="Your latest wallet activity at a glance." />
                        </CardDescription>
                    </div>
                </div>
                {transactions.length > 0 ? (
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="hidden shrink-0 sm:inline-flex"
                    >
                        <Link
                            href={index({
                                company: company.username,
                                query: walletQuery,
                            })}
                        >
                            <FormattedMessage defaultMessage="View all" />
                            <ArrowRightIcon className="size-4" />
                        </Link>
                    </Button>
                ) : null}
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
                {transactions.length === 0 ? (
                    <EmptyRecentTransactions />
                ) : (
                    <div className="space-y-2.5">
                        {transactions.map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                            />
                        ))}
                    </div>
                )}

                {transactions.length > 0 ? (
                    <Button asChild variant="outline" className="h-11 w-full">
                        <Link
                            href={index({
                                company: company.username,
                                query: walletQuery,
                            })}
                        >
                            <FormattedMessage defaultMessage="See more transactions" />
                            <ArrowRightIcon className="size-4" />
                        </Link>
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}
