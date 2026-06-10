import { ApiError } from '@/api/api-instance';
import { useCreateTopupPayment } from '@/api/payment/payment';
import {
    usePaymentMethods,
    type PaymentMethodResource,
} from '@/api/payment/payment-method';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const MIN_AMOUNT = 100_000;

type TopupDialogProps = {
    children: React.ReactNode;
};

type Step = 'amount' | 'method';

export function TopupDialog({ children }: TopupDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('amount');
    const [amount, setAmount] = useState<number | null>(null);
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(
        null,
    );
    const isValidAmount = amount !== null && amount >= MIN_AMOUNT;
    const { company } = usePageSharedDataProps();
    const topup = useCreateTopupPayment();
    const paymentMethods = usePaymentMethods();

    const resetDialog = () => {
        setStep('amount');
        setAmount(null);
        setSelectedMethodId(null);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            resetDialog();
        }
    };

    const handleContinueToMethods = () => {
        if (!isValidAmount) {
            return;
        }

        setStep('method');
    };

    const handleTopup = () => {
        if (!isValidAmount || selectedMethodId === null || topup.isPending) {
            return;
        }

        topup.mutate(
            {
                data: {
                    amount,
                    owner_type: 'company',
                    owner_id: company.id,
                    payment_method_id: selectedMethodId,
                },
            },
            {
                onSuccess: (payment) => {
                    setOpen(false);
                    resetDialog();
                    openOnlinePayment(payment.data);
                },
                onError: (error) => {
                    const message =
                        error instanceof ApiError
                            ? error.message
                            : 'Failed to create payment. Please try again.';

                    toast.error(message);
                },
            },
        );
    };

    const loading = topup.isPending;
    const methods = paymentMethods.data?.data ?? [];

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

            <AlertDialogContent className="flex max-h-[min(85vh,720px)] flex-col gap-4 overflow-hidden sm:max-w-sm">
                {step === 'amount' ? (
                    <>
                        <AlertDialogHeader className="shrink-0">
                            <AlertDialogTitle>Top up wallet</AlertDialogTitle>
                            <AlertDialogDescription>
                                Choose an amount or enter a custom value
                                (minimum Rp 100.000)
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="grid grid-cols-2 gap-2">
                            {PRESET_AMOUNTS.map((preset) => (
                                <Button
                                    key={preset}
                                    type="button"
                                    variant={
                                        amount === preset
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setAmount(preset)}
                                >
                                    Rp {preset.toLocaleString('id-ID')}
                                </Button>
                            ))}
                        </div>

                        <FieldGroup className="mt-4">
                            <Field>
                                <Label htmlFor="custom-amount">
                                    Custom amount
                                </Label>
                                <Input
                                    id="custom-amount"
                                    type="number"
                                    min={MIN_AMOUNT}
                                    placeholder="Minimum 100000"
                                    value={amount ?? ''}
                                    onChange={(e) =>
                                        setAmount(
                                            e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                        )
                                    }
                                />
                            </Field>
                        </FieldGroup>

                        <AlertDialogFooter className="shrink-0">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>

                            <Button
                                disabled={!isValidAmount}
                                onClick={handleContinueToMethods}
                            >
                                Continue
                            </Button>
                        </AlertDialogFooter>
                    </>
                ) : (
                    <>
                        <AlertDialogHeader className="shrink-0">
                            <AlertDialogTitle>
                                Choose payment method
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Select how you want to pay Rp{' '}
                                {amount?.toLocaleString('id-ID') ?? '0'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                            {paymentMethods.isLoading ? (
                                <div className="flex justify-center py-6">
                                    <Spinner />
                                </div>
                            ) : methods.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No payment methods are available right now.
                                </p>
                            ) : (
                                <div className="grid gap-2">
                                    {methods.map(
                                        (method: PaymentMethodResource) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                className={cn(
                                                    'rounded-lg border p-3 text-left transition-colors',
                                                    selectedMethodId ===
                                                        method.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:bg-muted/50',
                                                )}
                                                onClick={() =>
                                                    setSelectedMethodId(
                                                        method.id,
                                                    )
                                                }
                                            >
                                                <p className="font-medium">
                                                    {method.name}
                                                </p>
                                                {method.description ? (
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {method.description}
                                                    </p>
                                                ) : null}
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        <AlertDialogFooter className="shrink-0">
                            <Button
                                variant="outline"
                                onClick={() => setStep('amount')}
                            >
                                Back
                            </Button>

                            <Button
                                disabled={
                                    loading ||
                                    selectedMethodId === null ||
                                    methods.length === 0
                                }
                                onClick={handleTopup}
                            >
                                {loading && <Spinner />} Pay
                            </Button>
                        </AlertDialogFooter>
                    </>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
