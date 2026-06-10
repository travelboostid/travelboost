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
import { useState } from 'react';

type PaymentMethodDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description?: React.ReactNode;
    loading?: boolean;
    onConfirm: (methodId: number) => void;
};

export function PaymentMethodDialog({
    open,
    onOpenChange,
    description,
    loading = false,
    onConfirm,
}: PaymentMethodDialogProps) {
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(
        null,
    );

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setSelectedMethodId(null);
        }
    };

    const handlePay = () => {
        if (selectedMethodId === null || loading) {
            return;
        }

        onConfirm(selectedMethodId);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="flex max-h-[min(85vh,720px)] flex-col gap-4 overflow-hidden sm:max-w-sm">
                <AlertDialogHeader className="shrink-0">
                    <AlertDialogTitle>Choose payment method</AlertDialogTitle>
                    {description ? (
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <PaymentMethodList
                        selectedMethodId={selectedMethodId}
                        onSelect={setSelectedMethodId}
                    />
                </div>

                <AlertDialogFooter className="shrink-0">
                    <AlertDialogCancel disabled={loading}>
                        Cancel
                    </AlertDialogCancel>

                    <Button
                        disabled={loading || selectedMethodId === null}
                        onClick={handlePay}
                    >
                        {loading && <Spinner />} Pay
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
