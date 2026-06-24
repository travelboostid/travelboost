import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn, formatIDR } from '@/lib/utils';
import { cancel as paymentsCancel } from '@/routes/companies/dashboard/payments';
import { index as walletTransactionsIndex } from '@/routes/companies/dashboard/wallet-transaction';
import { Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    ArrowDownLeft,
    ArrowRightIcon,
    ArrowUpRight,
    ReceiptTextIcon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import type { WalletPageProps } from '..';
import EmptyRecentTransactions from './empty-recent-transactions';

dayjs.extend(relativeTime);

type Transaction = WalletPageProps['transactions'][number];

function walletTransactionsHref(companyUsername: string, walletSlug: string) {
    return walletTransactionsIndex.url(
        { company: companyUsername },
        { query: { wallet: walletSlug } },
    );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
    const { company } = usePageSharedDataProps();
    const { wallet } = usePageProps<WalletPageProps>();
    const isIncome = transaction.amount > 0;
    const Icon = isIncome ? ArrowUpRight : ArrowDownLeft;
    const description = transaction.meta?.description || 'Wallet transaction';

    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!transaction.payment_id) return;
        if (!confirm('Are you sure you want to cancel this top-up request?'))
            return;

        setIsCancelling(true);
        router.post(
            paymentsCancel({
                company: company.username,
                payment: transaction.payment_id,
            }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Top-up request cancelled.'),
                onError: () => toast.error('Failed to cancel top-up request.'),
                onFinish: () => setIsCancelling(false),
            },
        );
    };

    return (
        <Link
            href={walletTransactionsHref(company.username, wallet.slug)}
            className="group flex flex-col gap-3 rounded-xl border bg-background/60 p-3 transition-colors hover:border-primary/20 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
            <div className="flex min-w-0 items-start gap-3">
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
                        isIncome
                            ? 'bg-primary/10 text-primary group-hover:bg-primary/15'
                            : 'bg-destructive/10 text-destructive group-hover:bg-destructive/15',
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                        {description}
                        {transaction.status === 'pending' && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                                Pending
                            </span>
                        )}
                        {transaction.status === 'failed' && (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
                                Failed
                            </span>
                        )}
                        {transaction.status === 'cancelled' && (
                            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-500/20 ring-inset">
                                Cancelled
                            </span>
                        )}
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
            <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
                <p
                    className={cn(
                        'text-right text-sm font-semibold tabular-nums sm:text-base',
                        isIncome ? 'text-primary' : 'text-destructive',
                    )}
                >
                    {isIncome ? '+' : '-'}
                    {formatIDR(Math.abs(transaction.amount))}
                </p>
                {transaction.status === 'pending' ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleCancel}
                        disabled={isCancelling}
                        title="Cancel request"
                    >
                        <XIcon className="mr-1.5 size-3.5" />
                        <span className="text-xs">Cancel</span>
                    </Button>
                ) : (
                    <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
            </div>
        </Link>
    );
}

export default function RecentTransactions() {
    const { company } = usePageSharedDataProps();
    const { transactions, wallet } = usePageProps<WalletPageProps>();
    const transactionsHref = walletTransactionsHref(
        company.username,
        wallet.slug,
    );

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
                        <Link href={transactionsHref}>
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
                        <Link href={transactionsHref}>
                            <FormattedMessage defaultMessage="See more transactions" />
                            <ArrowRightIcon className="size-4" />
                        </Link>
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}
