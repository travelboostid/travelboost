import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn, formatIDR } from '@/lib/utils';
import { cancel as paymentsCancel } from '@/routes/companies/dashboard/payments';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowDownLeft, ArrowUpRight, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import EmptyWalletTransactions from '../empty-wallet-transactions';

dayjs.extend(relativeTime);

export type WalletTransaction = {
    id: number | string;
    type: 'income' | 'expense';
    amount: number;
    meta?: { description?: string } | null;
    status?: 'pending' | 'success' | 'failed';
    confirmed?: boolean;
    created_at: string;
};

function TransactionItem({ transaction }: { transaction: WalletTransaction }) {
    const intl = useIntl();
    const isIncome = transaction.type === 'income';
    const Icon = isIncome ? ArrowUpRight : ArrowDownLeft;
    const description =
        transaction.meta?.description ||
        intl.formatMessage({
            defaultMessage: 'Wallet transaction',
        });

    const { company } = usePageSharedDataProps();
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Use the id directly if it's prefixed, or just payment_id if passed
        const paymentId = transaction.id.toString().replace('p_', '');
        if (!confirm('Are you sure you want to cancel this top-up request?'))
            return;

        setIsCancelling(true);
        router.post(
            paymentsCancel({ company: company.username, payment: paymentId }),
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
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                            {description}
                        </p>
                        {transaction.status === 'pending' && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                                Pending
                            </span>
                        )}
                        {transaction.status === 'failed' && (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-600/10 ring-inset sm:text-xs">
                                Failed
                            </span>
                        )}
                        {transaction.status === 'cancelled' && (
                            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 ring-1 ring-zinc-500/20 ring-inset sm:text-xs">
                                Cancelled
                            </span>
                        )}
                        {transaction.status === 'success' &&
                            transaction.meta?.description?.includes(
                                'Manual Top-up Approval',
                            ) && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                                    Approved
                                </span>
                            )}
                    </div>
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
                        'shrink-0 text-right text-sm font-semibold tabular-nums sm:text-base',
                        isIncome ? 'text-primary' : 'text-destructive',
                    )}
                >
                    {isIncome ? '+' : '-'}
                    {formatIDR(transaction.amount)}
                </p>
                {transaction.status === 'pending' && (
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
                )}
            </div>
        </div>
    );
}

export default function TransactionList({
    transactions,
    showClearFilters,
    onClearFilters,
}: {
    transactions: WalletTransaction[];
    showClearFilters?: boolean;
    onClearFilters?: () => void;
}) {
    if (transactions.length === 0) {
        return (
            <EmptyWalletTransactions
                showClearFilters={showClearFilters}
                onClearFilters={onClearFilters}
            />
        );
    }

    return (
        <div className="space-y-3">
            {transactions.map((transaction) => (
                <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                />
            ))}
        </div>
    );
}
