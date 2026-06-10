import { Badge } from '@/components/ui/badge';
import { paymentStatusLabel } from '@/lib/payment-status';
import { cn, formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CoinsIcon } from 'lucide-react';
import CancelPayment from './cancel-payment';
import ContinuePayment from './continue-payment';

dayjs.extend(relativeTime);

const PAYABLE_TYPE_MAP: Record<string, string> = {
    'wallet-topup-payment': 'Wallet top-up',
    'agent-subscription-payment': 'Agent subscription',
    'ai-credit-topup-payment': 'AI credits top-up',
};

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'paid':
            return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
        case 'pending':
        case 'unpaid':
            return 'border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300';
        case 'failed':
        case 'expired':
        case 'cancelled':
            return 'border-destructive/30 bg-destructive/5 text-destructive';
        default:
            return '';
    }
}

type Payment = {
    id: number;
    amount: number;
    status: string;
    payable_type: string;
    created_at: string;
};

export default function PaymentCard({ payment }: { payment: Payment }) {
    const canContinue = ['unpaid', 'pending'].includes(payment.status);
    const canCancel = payment.status === 'pending';
    const typeLabel =
        PAYABLE_TYPE_MAP[payment.payable_type] ?? payment.payable_type;

    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-background/60 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CoinsIcon className="size-4" />
                </div>
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                            {formatIDR(payment.amount)}
                        </p>
                        <Badge
                            variant="outline"
                            className={cn(
                                'gap-1',
                                statusBadgeClass(payment.status),
                            )}
                        >
                            {paymentStatusLabel(payment.status)}
                        </Badge>
                        <Badge variant="secondary">{typeLabel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {dayjs(payment.created_at).format('DD MMM YYYY, HH:mm')}
                        <span className="mx-1.5 text-muted-foreground/50">
                            ·
                        </span>
                        {dayjs(payment.created_at).fromNow()}
                    </p>
                </div>
            </div>

            {(canContinue || canCancel) && (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {canContinue ? <ContinuePayment payment={payment} /> : null}
                    {canCancel ? <CancelPayment payment={payment} /> : null}
                </div>
            )}
        </div>
    );
}
