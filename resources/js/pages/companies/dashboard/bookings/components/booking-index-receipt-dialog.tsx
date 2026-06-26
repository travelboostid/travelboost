import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatIDR } from '@/constants/booking';
import dayjs from 'dayjs';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
import type { PaymentDetail } from '../booking-index-types';

function receiptPaymentTime(payment: PaymentDetail): string {
    if (!payment.payment_date) {
        return '—';
    }

    return dayjs(payment.payment_date).format(
        payment.receipt?.type === 'online'
            ? 'DD MMM YYYY HH:mm:ss'
            : 'DD MMM YYYY',
    );
}

function receiptRowsForPayment(
    payment: PaymentDetail,
    intl: IntlShape,
): string[][] {
    if (!payment.receipt) {
        return [];
    }

    return [
        [
            intl.formatMessage({ defaultMessage: 'Type' }),
            payment.receipt.type.toUpperCase(),
        ],
        [
            intl.formatMessage({ defaultMessage: 'Method' }),
            payment.method_label,
        ],
        [
            intl.formatMessage({ defaultMessage: 'Receiver' }),
            payment.receiver_label,
        ],
        [
            intl.formatMessage({ defaultMessage: 'Amount' }),
            formatIDR(payment.amount),
        ],
        [
            intl.formatMessage({ defaultMessage: 'Payment Time' }),
            receiptPaymentTime(payment),
        ],
    ];
}

export function BookingIndexReceiptDialog({
    payment,
    onOpenChange,
}: {
    payment: PaymentDetail | null;
    onOpenChange: (open: boolean) => void;
}) {
    const intl = useIntl();
    const receipt = payment?.receipt ?? null;
    const receiptRows = payment ? receiptRowsForPayment(payment, intl) : [];
    const receiptGroup =
        payment?.receipt_group?.filter((section) => section.detail.receipt) ??
        [];
    const hasReceiptGroup = receiptGroup.length > 0;

    return (
        <Dialog open={payment !== null} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        <FormattedMessage defaultMessage="Payment Receipt" />
                    </DialogTitle>
                    <DialogDescription>
                        <FormattedMessage defaultMessage="Transaction details for this booking payment." />
                    </DialogDescription>
                </DialogHeader>

                {hasReceiptGroup ? (
                    <div className="space-y-4 text-sm">
                        {receiptGroup.map((section) => {
                            const sectionReceipt = section.detail.receipt;
                            const sectionRows = receiptRowsForPayment(
                                section.detail,
                                intl,
                            );

                            return (
                                <div
                                    key={section.title}
                                    className="space-y-3 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b pb-2">
                                        <span className="font-semibold">
                                            {section.title}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="uppercase"
                                        >
                                            {sectionReceipt?.type ??
                                                intl.formatMessage({
                                                    defaultMessage: 'receipt',
                                                })}
                                        </Badge>
                                    </div>

                                    {sectionRows.map(([label, value]) => (
                                        <div
                                            key={`${section.title}-${label}`}
                                            className="flex justify-between gap-4"
                                        >
                                            <span className="text-muted-foreground">
                                                {label}
                                            </span>
                                            <span className="text-right font-semibold">
                                                {value}
                                            </span>
                                        </div>
                                    ))}

                                    {sectionReceipt?.type === 'manual' &&
                                        sectionReceipt.url && (
                                            <a
                                                href={sectionReceipt.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex text-sm font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                                            >
                                                <FormattedMessage defaultMessage="Open uploaded receipt" />
                                            </a>
                                        )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    payment &&
                    receipt && (
                        <div className="space-y-3 text-sm">
                            {receiptRows.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between gap-4"
                                >
                                    <span className="text-muted-foreground">
                                        {label}
                                    </span>
                                    <span className="text-right font-semibold">
                                        {value}
                                    </span>
                                </div>
                            ))}

                            {receipt.type === 'manual' && receipt.url && (
                                <a
                                    href={receipt.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex text-sm font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                                >
                                    <FormattedMessage defaultMessage="Open uploaded receipt" />
                                </a>
                            )}
                        </div>
                    )
                )}
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
