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
import { Clock3Icon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { AgentSubscriptionPageProps } from '..';
import CancelPayment from '../../payments/components/cancel-payment';
import ContinueSubscriptionPayment from './continue-subscription-payment';

dayjs.extend(relativeTime);

function formatPaymentMethod(method: unknown): string | null {
    if (typeof method !== 'string' || method.trim() === '') {
        return null;
    }

    return method.replace(/_/g, ' ').replace(/-/g, ' ');
}

export default function PendingSubscriptionPayment() {
    const { pendingPayment } = usePageProps<AgentSubscriptionPageProps>();

    if (!pendingPayment) {
        return null;
    }

    const amount =
        typeof pendingPayment.amount === 'number'
            ? pendingPayment.amount
            : null;
    const provider =
        typeof pendingPayment.provider === 'string'
            ? pendingPayment.provider
            : null;
    const paymentMethod = formatPaymentMethod(pendingPayment.payment_method);
    const payload =
        pendingPayment.payload && typeof pendingPayment.payload === 'object'
            ? (pendingPayment.payload as Record<string, unknown>)
            : null;
    const expiryLabel = formatPaymentExpiry(
        typeof payload?.charge_expires_at === 'string'
            ? payload.charge_expires_at
            : null,
    );
    const createdAt =
        typeof pendingPayment.created_at === 'string'
            ? pendingPayment.created_at
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
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <Clock3Icon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-base">
                                <FormattedMessage defaultMessage="Pending subscription payment" />
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                                {amount !== null ? (
                                    <FormattedMessage
                                        defaultMessage="Complete your {amount} payment to activate or renew your subscription."
                                        values={{ amount: formatIDR(amount) }}
                                    />
                                ) : (
                                    <FormattedMessage defaultMessage="Complete your payment to activate or renew your subscription." />
                                )}
                            </CardDescription>
                        </div>
                    </div>
                    {amount !== null ? (
                        <p className="text-2xl font-bold tabular-nums text-foreground sm:text-right">
                            {formatIDR(amount)}
                        </p>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                    {provider ? (
                        <Badge variant="outline" className="capitalize">
                            {provider}
                        </Badge>
                    ) : null}
                    {paymentMethod ? (
                        <Badge variant="secondary">{paymentMethod}</Badge>
                    ) : null}
                    {expiryLabel ? (
                        <Badge
                            variant="outline"
                            className={cn(
                                isExpired &&
                                    'border-destructive/30 text-destructive',
                            )}
                        >
                            {expiryLabel}
                        </Badge>
                    ) : null}
                    {createdAt ? (
                        <span className="text-xs text-muted-foreground">
                            <FormattedMessage
                                defaultMessage="Started {time}"
                                values={{
                                    time: dayjs(createdAt).fromNow(),
                                }}
                            />
                        </span>
                    ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <CancelPayment payment={pendingPayment} />
                    {provider !== 'manual' ? (
                        <ContinueSubscriptionPayment payment={pendingPayment}>
                            <FormattedMessage defaultMessage="Continue payment" />
                        </ContinueSubscriptionPayment>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
