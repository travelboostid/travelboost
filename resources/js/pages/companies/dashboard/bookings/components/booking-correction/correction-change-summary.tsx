import { formatIDR } from '@/constants/booking';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';

export type CorrectionPayload = {
    requested_departure_date?: string | null;
    previous_departure_date?: string | null;
    previous_status?: string | null;
    restored_status?: string | null;
    departure_date?: string | null;
    price_before?: number | null;
    price_after?: number | null;
    price_difference?: number | null;
} | null;

export function formatCorrectionDate(value: string | null | undefined) {
    return value ? dayjs(value).format('DD MMM YYYY') : '-';
}

export function CorrectionChangeSummary({
    targetAction,
    payload,
    currentDeparture,
}: {
    targetAction: string;
    payload: CorrectionPayload;
    currentDeparture: string | null;
}) {
    if (targetAction === 'reschedule' && payload) {
        const priceDiff = Number(payload.price_difference ?? 0);

        return (
            <div className="space-y-2 rounded-md border border-primary/15 bg-primary/5 px-3 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    <span>{formatCorrectionDate(payload.previous_departure_date ?? currentDeparture)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{formatCorrectionDate(payload.requested_departure_date)}</span>
                </div>
                {priceDiff !== 0 && (
                    <p className="text-muted-foreground">
                        <FormattedMessage defaultMessage="Price change:" />{' '}
                        <span
                            className={
                                priceDiff > 0
                                    ? 'font-semibold text-amber-700 dark:text-amber-300'
                                    : 'font-semibold text-emerald-700 dark:text-emerald-300'
                            }
                        >
                            {priceDiff > 0 ? '+' : ''}
                            {formatIDR(priceDiff)}
                        </span>
                        {payload.price_after != null && (
                            <span>
                                {' '}
                                (
                                <FormattedMessage
                                    defaultMessage="new total {amount}"
                                    values={{
                                        amount: formatIDR(payload.price_after),
                                    }}
                                />
                                )
                            </span>
                        )}
                    </p>
                )}
            </div>
        );
    }

    if (targetAction === 'restore' && payload) {
        return (
            <div className="space-y-1 rounded-md border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="font-medium text-foreground">
                    <FormattedMessage
                        defaultMessage="{from} → {to}"
                        values={{
                            from: payload.previous_status ?? 'cancelled',
                            to: payload.restored_status ?? 'down payment',
                        }}
                    />
                </p>
                <p className="text-muted-foreground">
                    <FormattedMessage
                        defaultMessage="Departure remains {date}"
                        values={{
                            date: formatCorrectionDate(
                                payload.departure_date ?? currentDeparture,
                            ),
                        }}
                    />
                </p>
            </div>
        );
    }

    return null;
}
