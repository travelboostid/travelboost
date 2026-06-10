import { cn, formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import EmptyWalletTransactions from '../empty-wallet-transactions';

dayjs.extend(relativeTime);

export type WalletTransaction = {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    meta?: { description?: string } | null;
    confirmed?: boolean;
    created_at: string;
};

function TransactionItem({ transaction }: { transaction: WalletTransaction }) {
    const isIncome = transaction.type === 'income';
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
                {formatIDR(transaction.amount)}
            </p>
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
        <div className="space-y-2.5">
            {transactions.map((transaction) => (
                <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                />
            ))}
        </div>
    );
}
