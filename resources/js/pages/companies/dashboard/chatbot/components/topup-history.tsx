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
import { formatIDR } from '@/lib/utils';
import { cancel as paymentsCancel } from '@/routes/companies/dashboard/payments';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowUpRight, BotIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import type { ChatbotPageProps } from '../index';

dayjs.extend(relativeTime);

type Transaction = NonNullable<ChatbotPageProps['transactions']>[number];

function TransactionItem({ transaction }: { transaction: Transaction }) {
    const { company } = usePageSharedDataProps();
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (
            !confirm(
                'Are you sure you want to cancel this AI credit top-up request?',
            )
        )
            return;

        setIsCancelling(true);
        router.post(
            paymentsCancel({
                company: company.username,
                payment: transaction.id,
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
        <div className="flex flex-col gap-3 rounded-xl border bg-background/60 p-3 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/15">
                    <ArrowUpRight className="size-4" />
                </div>
                <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                        <FormattedMessage defaultMessage="AI Credit Top-up" />
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
                        {transaction.status === 'paid' && (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                                Paid
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
                <p className="text-right text-sm font-semibold tabular-nums text-primary sm:text-base">
                    +{formatIDR(transaction.amount)}
                </p>
                {transaction.status === 'pending' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={handleCancel}
                        disabled={isCancelling}
                        title="Cancel request"
                    >
                        <XIcon className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function TopupHistory() {
    const { transactions } = usePageProps<ChatbotPageProps>();

    if (!transactions || transactions.length === 0) {
        return null;
    }

    return (
        <Card className="border shadow-sm">
            <CardHeader className="gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <BotIcon className="size-4" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">
                            <FormattedMessage defaultMessage="Top-up History" />
                        </CardTitle>
                        <CardDescription>
                            <FormattedMessage defaultMessage="Recent AI credit top-up requests." />
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
                <div className="space-y-2.5">
                    {transactions.map((transaction) => (
                        <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
