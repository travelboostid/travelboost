import {
    usePaymentMethods,
    type PaymentMethodUsageScope,
} from '@/api/payment/payment-method';
import { PaymentMethodList } from '@/components/payment/payment-method-list';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { loadMidtransSnapScript } from '@/lib/midtrans-snap';
import { findPaymentMethodById } from '@/lib/payment-method-ui';
import { CreditCardIcon, ShieldCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

type PaymentMethodDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description?: React.ReactNode;
    loading?: boolean;
    onConfirm: (methodId: number) => void;
    title?: string;
    confirmLabel?: string;
    usageScope?: PaymentMethodUsageScope;
};

export function PaymentMethodDialog({
    open,
    onOpenChange,
    description,
    loading = false,
    onConfirm,
    title = 'Choose payment method',
    confirmLabel = 'Continue to payment',
    usageScope = 'booking',
}: PaymentMethodDialogProps) {
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(
        null,
    );
    const paymentMethods = usePaymentMethods(usageScope);
    const methods = paymentMethods.data ?? [];
    const selectedMethod = findPaymentMethodById(methods, selectedMethodId);

    useEffect(() => {
        if (!open || usageScope !== 'platform') {
            return;
        }

        void loadMidtransSnapScript().catch(() => {
            // Snap preload is best-effort; failures are surfaced when payment opens.
        });
    }, [open, usageScope]);

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setSelectedMethodId(null);
        }
    };

    const handleConfirm = () => {
        if (selectedMethodId === null || loading) {
            return;
        }

        onConfirm(selectedMethodId);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="flex max-h-[min(92vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <AlertDialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <CreditCardIcon className="size-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <AlertDialogTitle className="text-lg leading-snug">
                                {title}
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
                                    {description ?? (
                                        <p>
                                            Pick how you want to pay. You will
                                            see transfer or scan instructions on
                                            the next step.
                                        </p>
                                    )}
                                </div>
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <PaymentMethodList
                        selectedMethodId={selectedMethodId}
                        onSelect={setSelectedMethodId}
                        usageScope={usageScope}
                    />
                </div>

                <AlertDialogFooter className="flex-col gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-col sm:justify-start">
                    {selectedMethod ? (
                        <div className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm">
                            <p className="text-xs text-muted-foreground">
                                Selected method
                            </p>
                            <p className="font-medium text-foreground">
                                {selectedMethod.name}
                            </p>
                        </div>
                    ) : (
                        <p className="w-full text-center text-xs text-muted-foreground">
                            Select a payment method to continue.
                        </p>
                    )}

                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-stretch">
                        <AlertDialogCancel className="mt-0 h-11 w-full sm:flex-1">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            size="lg"
                            className="h-11 w-full sm:flex-1"
                            disabled={loading || selectedMethodId === null}
                            onClick={handleConfirm}
                        >
                            {loading ? <Spinner /> : null}
                            {confirmLabel}
                        </Button>
                    </div>

                    <p className="flex w-full items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                        <ShieldCheckIcon className="size-3.5 shrink-0" />
                        Payments are processed securely by our payment partners.
                    </p>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
