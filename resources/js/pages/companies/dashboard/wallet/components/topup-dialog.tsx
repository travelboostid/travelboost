import { ApiError } from '@/api/api-instance';
import { useCreateTopupPayment } from '@/api/payment/payment';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { useState } from 'react';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const MIN_AMOUNT = 100_000;

type TopupDialogProps = {
    children: React.ReactNode;
};

export function TopupDialog({ children }: TopupDialogProps) {
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);
    const [amount, setAmount] = useState<number | null>(null);
    const isValidAmount = amount !== null && amount >= MIN_AMOUNT;
    const { company } = usePageSharedDataProps();
    const topup = useCreateTopupPayment();

    const resetAmountDialog = () => {
        setAmount(null);
    };

    const handleAmountDialogOpenChange = (nextOpen: boolean) => {
        setAmountDialogOpen(nextOpen);

        if (!nextOpen) {
            resetAmountDialog();
        }
    };

    const handleContinueToMethods = () => {
        if (!isValidAmount) {
            return;
        }

        setAmountDialogOpen(false);
        setMethodDialogOpen(true);
    };

    const handleTopup = (methodId: number) => {
        if (!isValidAmount || topup.isPending) {
            return;
        }

        topup.mutate(
            {
                data: {
                    amount,
                    owner_type: 'company',
                    owner_id: company.id,
                    payment_method_id: methodId,
                },
            },
            {
                onSuccess: (payment) => {
                    setMethodDialogOpen(false);
                    resetAmountDialog();
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

    return (
        <>
            <AlertDialog
                open={amountDialogOpen}
                onOpenChange={handleAmountDialogOpenChange}
            >
                <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

                <AlertDialogContent className="sm:max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Top up wallet</AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose an amount or enter a custom value (minimum Rp
                            100.000)
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="grid grid-cols-2 gap-2">
                        {PRESET_AMOUNTS.map((preset) => (
                            <Button
                                key={preset}
                                type="button"
                                variant={
                                    amount === preset ? 'default' : 'outline'
                                }
                                onClick={() => setAmount(preset)}
                            >
                                Rp {preset.toLocaleString('id-ID')}
                            </Button>
                        ))}
                    </div>

                    <FieldGroup className="mt-4">
                        <Field>
                            <Label htmlFor="custom-amount">Custom amount</Label>
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

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <Button
                            disabled={!isValidAmount}
                            onClick={handleContinueToMethods}
                        >
                            Continue
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PaymentMethodDialog
                open={methodDialogOpen}
                onOpenChange={setMethodDialogOpen}
                description={`Select how you want to pay Rp ${amount?.toLocaleString('id-ID') ?? '0'}`}
                loading={topup.isPending}
                onConfirm={handleTopup}
            />
        </>
    );
}
