import { OnlinePaymentDialogFromPayment } from '@/components/payment/online-payment-dialog';
import {
    ONLINE_PAYMENT_OPEN_EVENT,
    type OnlinePaymentOpenDetail,
} from '@/lib/open-online-payment';
import type { PaymentStatusSyncResult } from '@/lib/payment-status';
import { useEffect, useRef, useState } from 'react';

export function OnlinePaymentHost() {
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState<OnlinePaymentOpenDetail | null>(null);
    const wasOpenRef = useRef(false);

    useEffect(() => {
        const handleOpen = (event: Event) => {
            const customEvent = event as CustomEvent<OnlinePaymentOpenDetail>;

            setDetail(customEvent.detail);
            setOpen(true);
        };

        window.addEventListener(ONLINE_PAYMENT_OPEN_EVENT, handleOpen);

        return () => {
            window.removeEventListener(ONLINE_PAYMENT_OPEN_EVENT, handleOpen);
        };
    }, []);

    useEffect(() => {
        wasOpenRef.current = open;
    }, [open]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen && wasOpenRef.current) {
            detail?.callbacks?.onComplete?.();
            setDetail(null);
        }
    };

    const handlePaid = () => {
        detail?.callbacks?.onPaid?.();
    };

    const handlePaidStatusChange = (result: PaymentStatusSyncResult) => {
        detail?.callbacks?.onPaid?.(result);
    };

    const payment = detail?.payment;

    if (!payment) {
        return null;
    }

    return (
        <OnlinePaymentDialogFromPayment
            open={open}
            onOpenChange={handleOpenChange}
            payment={payment}
            statusCheck={detail?.statusCheck}
            onContinue={handlePaid}
            onPaid={handlePaidStatusChange}
            onDone={handlePaid}
            reloadOnPaid={detail?.callbacks?.reloadOnPaid}
            continueLabel="I've paid"
        />
    );
}
