import { ApiError } from '@/api/api-instance';
import { useCreateAiCreditTopupPayment } from '@/api/payment/payment';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { useState } from 'react';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const MIN_AMOUNT = 100_000;

export default function AiCreditsTopup() {
    const [amount, setAmount] = useState<number | null>(null);
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);
    const isValidAmount = amount !== null && amount >= MIN_AMOUNT;
    const { company } = usePageSharedDataProps();
    const topup = useCreateAiCreditTopupPayment();

    const handlePay = (methodId: number) => {
        if (!isValidAmount || topup.isPending) {
            return;
        }

        topup.mutate(
            {
                data: {
                    amount,
                    company_id: company.id,
                    payment_method_id: methodId,
                },
            },
            {
                onSuccess: (payment) => {
                    setMethodDialogOpen(false);
                    setAmount(null);
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
            <Card>
                <CardHeader>
                    <CardTitle>Top up AI credits</CardTitle>
                    <CardDescription>
                        Top up your AI credits for your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button
                        disabled={!isValidAmount}
                        onClick={() => setMethodDialogOpen(true)}
                        className="w-full"
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>

            <PaymentMethodDialog
                open={methodDialogOpen}
                onOpenChange={setMethodDialogOpen}
                description={`Select how you want to pay Rp ${amount?.toLocaleString('id-ID') ?? '0'}`}
                loading={topup.isPending}
                onConfirm={handlePay}
            />
        </>
    );
}
