import { useCreateAgentSubscriptionPayment } from '@/api/payment/payment';
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
import { useEffect, useState } from 'react';
import type { AgentSubscriptionPageProps } from '..';

export default function ExtendSubscriptionCard() {
    const { company, agentSubscriptionPackages } =
        usePageProps<AgentSubscriptionPageProps>();
    const createPayment = useCreateAgentSubscriptionPayment();

    const availablePackages = agentSubscriptionPackages.filter(
        (pkg) => Number(pkg.price) > 0,
    );

    const [packageId, setPackageId] = useState<string>('');

    useEffect(() => {
        if (availablePackages.length > 0 && !packageId) {
            setPackageId(availablePackages[0].id.toString());
        }
    }, [availablePackages, packageId]);

    const handlePay = () => {
        if (!packageId) return;
        createPayment.mutate(
            {
                data: {
                    package_id: +packageId,
                    company_id: company.id,
                },
            },
            {
                onSuccess: (payment) => {
                    const snapToken = (payment.data.payload as any)
                        ?.snap_token as string;
                    (window as any).snap.pay(snapToken, {
                        onSuccess: () => window.location.reload(),
                        onError: () => window.location.reload(),
                        onClose: () => window.location.reload(),
                    });
                },
            },
        );
    };

    return (
        <Card className="mt-6 border-slate-200 bg-white shadow-sm">
            <CardHeader>
                <CardTitle>Extend Subscription</CardTitle>
                <CardDescription>
                    Choose a package to extend your subscription and continue
                    enjoying our services without interruption.
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
                        onClick={handlePay}
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
    );
}
