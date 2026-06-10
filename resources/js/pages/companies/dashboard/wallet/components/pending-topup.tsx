import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { formatPaymentExpiry } from '@/lib/payment-instructions';
import { cn, formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AlertCircleIcon, Clock3Icon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { WalletPageProps } from '..';
import CancelPayment from '../../payments/components/cancel-payment';
import ContinuePayment from './continue-payment';

dayjs.extend(relativeTime);

function formatPaymentMethod(method: unknown): string | null {
    if (typeof method !== 'string' || method.trim() === '') {
        return null;
    }

    return method.replace(/_/g, ' ').replace(/-/g, ' ');
}

export default function PendingTopup() {
    const { pendingTopup } = usePageProps<WalletPageProps>();

    if (!pendingTopup) {
        return null;
    }

    const amount =
        typeof pendingTopup.amount === 'number' ? pendingTopup.amount : null;
    const provider =
        typeof pendingTopup.provider === 'string'
            ? pendingTopup.provider
            : null;
    const paymentMethod = formatPaymentMethod(pendingTopup.payment_method);
    const payload =
        pendingTopup.payload && typeof pendingTopup.payload === 'object'
            ? (pendingTopup.payload as Record<string, unknown>)
            : null;
    const expiryLabel = formatPaymentExpiry(
        typeof payload?.charge_expires_at === 'string'
            ? payload.charge_expires_at
            : null,
    );
    const createdAt =
        typeof pendingTopup.created_at === 'string'
            ? pendingTopup.created_at
            : null;
    const isExpired = expiryLabel === 'Expired';

    return (
        <Card
            className={cn(
                'overflow-hidden border shadow-sm',
                isExpired
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-amber-500/30 bg-amber-500/5',
            )}
        >
            <CardHeader className="gap-4 border-b border-amber-500/15 pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                                isExpired
                                    ? 'bg-destructive/15 text-destructive'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                            )}
                        >
                            {isExpired ? (
                                <AlertCircleIcon className="size-5" />
                            ) : (
                                <Clock3Icon className="size-5" />
                            )}
                        </div>
                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-base sm:text-lg">
                                    <FormattedMessage defaultMessage="Pending top-up" />
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        isExpired
                                            ? 'border-destructive/40 text-destructive'
                                            : 'border-amber-500/40 text-amber-800 dark:text-amber-300',
                                    )}
                                >
                                    {isExpired ? (
                                        <FormattedMessage defaultMessage="Expired" />
                                    ) : (
                                        <FormattedMessage defaultMessage="Awaiting payment" />
                                    )}
                                </Badge>
                            </div>
                            <CardDescription className="max-w-xl text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Your wallet top-up is waiting for payment. Continue where you left off or cancel to start again." />
                            </CardDescription>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {provider ? (
                                    <Badge
                                        variant="secondary"
                                        className="capitalize"
                                    >
                                        {provider}
                                    </Badge>
                                ) : null}
                                {paymentMethod ? (
                                    <Badge variant="outline">
                                        {paymentMethod}
                                    </Badge>
                                ) : null}
                                {createdAt ? (
                                    <span>
                                        <FormattedMessage
                                            defaultMessage="Started {time}"
                                            values={{
                                                time: dayjs(
                                                    createdAt,
                                                ).fromNow(),
                                            }}
                                        />
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {amount !== null ? (
                        <div className="rounded-xl border bg-background/80 px-4 py-3 sm:text-right">
                            <p className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="Amount due" />
                            </p>
                            <p className="text-2xl font-bold tabular-nums text-foreground">
                                {formatIDR(amount)}
                            </p>
                            {expiryLabel ? (
                                <p
                                    className={cn(
                                        'mt-1 text-xs font-medium',
                                        isExpired
                                            ? 'text-destructive'
                                            : 'text-amber-700 dark:text-amber-300',
                                    )}
                                >
                                    {expiryLabel}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-stretch">
                <CancelPayment payment={pendingTopup} />
                <ContinuePayment payment={pendingTopup}>
                    <FormattedMessage defaultMessage="Continue payment" />
                </ContinuePayment>
            </CardContent>
        </Card>
    );
}
