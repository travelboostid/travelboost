import { OnlinePaymentInstructions } from '@/components/payment/online-payment-instructions';
import { PaymentStatusBanner } from '@/components/payment/payment-status-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePaymentStatusPolling } from '@/hooks/use-payment-status-polling';
import {
    instructionKindLabel,
    paymentInstructionPayload,
    resolveInstructionKind,
    type PaymentInstructionPayload,
} from '@/lib/payment-instructions';
import {
    isTerminalPaymentStatus,
    type PaymentStatusCheckConfig,
    type PaymentStatusSyncResult,
} from '@/lib/payment-status';
import { refreshPageAfterPayment } from '@/lib/refresh-after-payment';
import { Clock3Icon, WalletIcon } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

type OnlinePaymentDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    provider?: string | null;
    amount?: number | null;
    payload?: PaymentInstructionPayload | Record<string, unknown> | null;
    paymentId?: number | string | null;
    status?: string | null;
    statusCheck?: PaymentStatusCheckConfig;
    onContinue?: () => void;
    onStatusChange?: (result: PaymentStatusSyncResult) => void;
    onPaid?: () => void;
    reloadOnPaid?: boolean;
    continueLabel?: string;
    title?: string;
    description?: string;
};

export function OnlinePaymentDialog({
    open,
    onOpenChange,
    provider,
    amount,
    payload,
    paymentId,
    status,
    statusCheck,
    onContinue,
    onStatusChange,
    onPaid,
    reloadOnPaid = true,
    continueLabel = "I've paid",
    title = 'Complete your payment',
    description = 'Transfer the exact amount using the details below. Payment is confirmed automatically once received.',
}: OnlinePaymentDialogProps) {
    const normalizedPayload = (payload ?? {}) as PaymentInstructionPayload;
    const kind = resolveInstructionKind(provider, normalizedPayload);
    const kindLabel = instructionKindLabel(kind);
    const showConfirmAction =
        typeof onContinue === 'function' && kind !== 'external_page';
    const hasReloadedAfterPaid = useRef(false);
    const ignoreOutsideDismissRef = useRef(false);

    useEffect(() => {
        if (!open) {
            ignoreOutsideDismissRef.current = false;

            return;
        }

        ignoreOutsideDismissRef.current = true;

        const timeoutId = window.setTimeout(() => {
            ignoreOutsideDismissRef.current = false;
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [open]);

    const handlePaid = useCallback(() => {
        onPaid?.();

        if (reloadOnPaid && !hasReloadedAfterPaid.current) {
            hasReloadedAfterPaid.current = true;
            refreshPageAfterPayment();
        }
    }, [onPaid, reloadOnPaid]);

    useEffect(() => {
        if (!open) {
            hasReloadedAfterPaid.current = false;
        }
    }, [open]);

    const {
        status: liveStatus,
        transactionStatus,
        isChecking,
        lastCheckedAt,
        notice,
        payment: syncedPayment,
        checkStatus,
    } = usePaymentStatusPolling({
        open,
        paymentId,
        initialStatus: status,
        statusCheck,
        onStatusChange,
        onPaid: handlePaid,
    });

    const displayPayload = (syncedPayment?.payload ??
        normalizedPayload) as PaymentInstructionPayload;
    const isPaid = liveStatus === 'paid';
    const showManualConfirm = showConfirmAction && !isPaid;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[min(92vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
                onInteractOutside={(event) => {
                    if (ignoreOutsideDismissRef.current) {
                        event.preventDefault();
                    }
                }}
                onPointerDownOutside={(event) => {
                    if (ignoreOutsideDismissRef.current) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <WalletIcon className="size-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <DialogTitle className="text-lg leading-snug">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-[52px]">
                        <Badge variant="secondary">{kindLabel}</Badge>
                        {provider ? (
                            <Badge variant="outline" className="capitalize">
                                {provider}
                            </Badge>
                        ) : null}
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    {paymentId ? (
                        <PaymentStatusBanner
                            status={liveStatus}
                            transactionStatus={transactionStatus}
                            isChecking={isChecking}
                            lastCheckedAt={lastCheckedAt}
                            notice={notice}
                            onCheckStatus={() => {
                                void checkStatus();
                            }}
                        />
                    ) : null}

                    <OnlinePaymentInstructions
                        provider={provider}
                        amount={amount}
                        payload={displayPayload}
                        status={liveStatus}
                    />
                </div>

                {showManualConfirm || isPaid ? (
                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        {showManualConfirm ? (
                            <>
                                <p className="flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                                    <Clock3Icon className="size-3.5 shrink-0" />
                                    {isTerminalPaymentStatus(liveStatus)
                                        ? 'This payment attempt is no longer active.'
                                        : 'Status updates automatically every 10 seconds after you pay.'}
                                </p>
                                <Button
                                    type="button"
                                    className="w-full"
                                    size="lg"
                                    onClick={onContinue}
                                >
                                    {continueLabel}
                                </Button>
                            </>
                        ) : isPaid ? (
                            <Button
                                type="button"
                                className="w-full"
                                size="lg"
                                onClick={() => onOpenChange(false)}
                            >
                                Done
                            </Button>
                        ) : null}
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

export function OnlinePaymentDialogFromPayment({
    open,
    onOpenChange,
    payment,
    statusCheck,
    onContinue,
    onStatusChange,
    onPaid,
    reloadOnPaid,
    continueLabel,
    title,
    description,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: {
        id?: number | string | null;
        status?: string | null;
        provider?: string | null;
        amount?: number | null;
        payload?: PaymentInstructionPayload | null;
    };
    statusCheck?: PaymentStatusCheckConfig;
    onContinue?: () => void;
    onStatusChange?: (result: PaymentStatusSyncResult) => void;
    onPaid?: () => void;
    reloadOnPaid?: boolean;
    continueLabel?: string;
    title?: string;
    description?: string;
}) {
    return (
        <OnlinePaymentDialog
            open={open}
            onOpenChange={onOpenChange}
            paymentId={payment.id}
            status={payment.status}
            statusCheck={statusCheck}
            provider={payment.provider}
            amount={payment.amount}
            payload={paymentInstructionPayload(payment)}
            onContinue={onContinue}
            onStatusChange={onStatusChange}
            onPaid={onPaid}
            reloadOnPaid={reloadOnPaid}
            continueLabel={continueLabel}
            title={title}
            description={description}
        />
    );
}
