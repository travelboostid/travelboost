import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { formatIDR } from '@/lib/utils';
import { cancel as paymentsCancel } from '@/routes/companies/dashboard/payments';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowUpRight, BotIcon, ReceiptTextIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';

dayjs.extend(relativeTime);

export type ChatbotPaymentHistoryProps = {
    transactions: {
        data: Array<{
            id: number | string;
            amount: number;
            status: string;
            provider: string;
            payment_method: string;
            created_at: string;
        }>;
    };
};

type Transaction = ChatbotPaymentHistoryProps['transactions']['data'][0];

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
        <div className="flex flex-col gap-3 rounded-xl border bg-background/60 p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/15">
                    <ArrowUpRight className="size-4" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                            <FormattedMessage defaultMessage="AI Credit Top-up" />
                        </p>
                        {transaction.status === 'pending' && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                                Pending
                            </span>
                        )}
                        {transaction.status === 'failed' && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                                Failed
                            </span>
                        )}
                        {transaction.status === 'cancelled' && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                                Cancelled
                            </span>
                        )}
                        {transaction.status === 'paid' && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                                Paid
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
                <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-primary sm:text-base">
                    +{formatIDR(transaction.amount)}
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

export default function ChatbotPaymentHistory({
    transactions,
}: ChatbotPaymentHistoryProps) {
    return (
        <CompanyDashboardLayout
            activeMenuIds={['settings.chatbot']}
            openMenuIds={['settings']}
            breadcrumb={[
                { title: 'Settings' },
                { title: 'Chat AI', href: 'companies.dashboard.chatbot' },
                { title: 'Top-up History' },
            ]}
        >
            <Head title="AI Credit Top-up History" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <BotIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="AI Credit Top-up History" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Review your AI credit top-up requests." />
                            </p>
                        </div>
                    </div>
                </header>

                <Card className="border shadow-sm">
                    <CardHeader className="gap-4 border-b pb-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <ReceiptTextIcon className="size-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    <FormattedMessage defaultMessage="Activity" />
                                </CardTitle>
                                <CardDescription>
                                    <FormattedMessage
                                        defaultMessage="{count} results shown"
                                        values={{
                                            count: transactions.data.length,
                                        }}
                                    />
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-5">
                        {transactions.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                                <ReceiptTextIcon className="mb-3 size-8 opacity-20" />
                                <p className="text-sm font-medium">
                                    No transactions found.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.data.map((transaction) => (
                                    <TransactionItem
                                        key={transaction.id}
                                        transaction={transaction}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
