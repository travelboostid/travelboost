import type { PaymentResource } from '@/api/model/paymentResource';
import type { PaymentStatus } from '@/api/model/paymentStatus';
import {
    checkPaymentStatus,
    isTerminalPaymentStatus,
    PAYMENT_STATUS_POLL_INTERVAL_MS,
    paymentStatusNotice,
    type PaymentStatusCheckConfig,
    type PaymentStatusNotice,
    type PaymentStatusSyncResult,
} from '@/lib/payment-status';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type UsePaymentStatusPollingOptions = {
    open: boolean;
    paymentId?: number | string | null;
    initialStatus?: PaymentStatus | string | null;
    statusCheck?: PaymentStatusCheckConfig;
    onStatusChange?: (result: PaymentStatusSyncResult) => void;
    onPaid?: (result: PaymentStatusSyncResult) => void;
};

export function usePaymentStatusPolling({
    open,
    paymentId,
    initialStatus = 'pending',
    statusCheck,
    onStatusChange,
    onPaid,
}: UsePaymentStatusPollingOptions) {
    const [status, setStatus] = useState(String(initialStatus ?? 'pending'));
    const [transactionStatus, setTransactionStatus] = useState<string | null>(
        null,
    );
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
    const [notice, setNotice] = useState<PaymentStatusNotice | null>(null);
    const [payment, setPayment] = useState<PaymentResource | null>(null);
    const hasAnnouncedPaid = useRef(false);
    const inFlight = useRef(false);

    const runCheck = useCallback(
        async (options?: { announce?: boolean }) => {
            if (!paymentId || inFlight.current) {
                return;
            }

            inFlight.current = true;
            setIsChecking(true);

            try {
                const result = await checkPaymentStatus(paymentId, statusCheck);
                const nextStatus = String(result.status);
                let changed = result.changed;

                setPayment(result.payment);
                setStatus((previousStatus) => {
                    changed = changed || nextStatus !== previousStatus;

                    return nextStatus;
                });
                setTransactionStatus(result.transactionStatus ?? null);
                setLastCheckedAt(new Date());
                setNotice(paymentStatusNotice(nextStatus, changed));

                if (changed || nextStatus === 'paid' || options?.announce) {
                    onStatusChange?.(result);
                }

                if (nextStatus === 'paid' && !hasAnnouncedPaid.current) {
                    hasAnnouncedPaid.current = true;

                    if (options?.announce !== false) {
                        toast.success('Payment received');
                    }

                    onPaid?.(result);
                }
            } catch {
                setNotice({
                    tone: 'warning',
                    title: 'Could not check status',
                    body: 'Please try again in a moment.',
                });
            } finally {
                inFlight.current = false;
                setIsChecking(false);
            }
        },
        [onPaid, onStatusChange, paymentId, statusCheck],
    );

    useEffect(() => {
        if (!open) {
            hasAnnouncedPaid.current = false;
            return;
        }

        if (initialStatus) {
            setStatus(String(initialStatus));
        }
    }, [initialStatus, open]);

    useEffect(() => {
        if (!open || !paymentId) {
            return;
        }

        void runCheck({ announce: false });

        if (isTerminalPaymentStatus(status)) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void runCheck({ announce: false });
        }, PAYMENT_STATUS_POLL_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [open, paymentId, runCheck, status]);

    return {
        status,
        transactionStatus,
        isChecking,
        lastCheckedAt,
        notice,
        payment,
        checkStatus: () => runCheck({ announce: true }),
    };
}
