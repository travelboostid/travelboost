import { ApiError } from '@/api/api-instance';
import { useCreateAgentSubscriptionPayment } from '@/api/payment/payment';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import usePageProps from '@/hooks/use-page-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AgentSubscriptionPageProps } from '..';

export default function ExtendSubscriptionCard() {
    const { company, agentSubscriptionPackages } =
        usePageProps<AgentSubscriptionPageProps>();
    const createPayment = useCreateAgentSubscriptionPayment();

    const availablePackages = agentSubscriptionPackages.filter(
        (pkg) => Number(pkg.price) > 0,
    );

    const [packageId, setPackageId] = useState<string>('');
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);

    const selectedPackage = availablePackages.find(
        (pkg) => pkg.id.toString() === packageId,
    );

    useEffect(() => {
        if (availablePackages.length > 0 && !packageId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPackageId(availablePackages[0].id.toString());
        }
    }, [availablePackages, packageId]);

    const handlePay = (methodId: number) => {
        if (!packageId) {
            return;
        }

        createPayment.mutate(
            {
                data: {
                    package_id: +packageId,
                    company_id: company.id,
                    payment_method_id: methodId,
                },
            },
            {
                onSuccess: (payment) => {
                    setMethodDialogOpen(false);
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
            <Card className="mt-6 border-slate-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle>Extend Subscription</CardTitle>
                    <CardDescription>
                        Choose a package to extend your subscription and
                        continue enjoying our services without interruption.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={packageId}
                        onValueChange={setPackageId}
                        className="grid gap-4"
                    >
                        {availablePackages.map((pkg) => (
                            <FieldLabel
                                htmlFor={`${pkg.name}-plan`}
                                key={pkg.id}
                                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                                    packageId === pkg.id.toString()
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200 hover:border-primary/50'
                                }`}
                            >
                                <Field
                                    orientation="horizontal"
                                    className="flex w-full items-center justify-between"
                                >
                                    <FieldContent>
                                        <FieldTitle className="text-lg font-bold text-slate-900">
                                            {pkg.name}
                                        </FieldTitle>
                                        <FieldDescription className="text-sm font-medium text-slate-600">
                                            Rp{' '}
                                            {Number(pkg.price).toLocaleString(
                                                'id-ID',
                                            )}
                                            ,- / {pkg.duration_months} Months
                                        </FieldDescription>
                                    </FieldContent>
                                    <RadioGroupItem
                                        value={pkg.id.toString()}
                                        id={`${pkg.name}-plan`}
                                    />
                                </Field>
                            </FieldLabel>
                        ))}
                    </RadioGroup>
                </CardContent>
                <CardFooter>
                    <CardAction>
                        <Button
                            className="w-full py-6 text-base font-bold"
                            onClick={() => setMethodDialogOpen(true)}
                            disabled={createPayment.isPending || !packageId}
                        >
                            {createPayment.isPending && (
                                <Spinner className="mr-2" />
                            )}
                            Proceed to Payment
                        </Button>
                    </CardAction>
                </CardFooter>
            </Card>

            <PaymentMethodDialog
                open={methodDialogOpen}
                onOpenChange={setMethodDialogOpen}
                description={
                    selectedPackage
                        ? `Select how you want to pay Rp ${Number(selectedPackage.price).toLocaleString('id-ID')} for ${selectedPackage.name}`
                        : 'Select how you want to pay for your subscription'
                }
                loading={createPayment.isPending}
                onConfirm={handlePay}
            />
        </>
    );
}
