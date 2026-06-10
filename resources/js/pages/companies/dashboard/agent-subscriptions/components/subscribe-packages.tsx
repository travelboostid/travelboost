import { ApiError } from '@/api/api-instance';
import { useCreateAgentSubscriptionPayment } from '@/api/payment/payment';
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
import { Spinner } from '@/components/ui/spinner';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import {
    refreshAgentSubscriptionPage,
    refreshAgentSubscriptionPendingPayment,
} from '@/lib/refresh-agent-subscription-page';
import { cn, formatIDR } from '@/lib/utils';
import { index as paymentsIndex } from '@/routes/companies/dashboard/payments';
import { Link } from '@inertiajs/react';
import { ArrowRightIcon, ExternalLinkIcon, PackageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import type { AgentSubscriptionPageProps } from '..';

function openSubscriptionPayment(
    payment: Parameters<typeof openOnlinePayment>[0],
): void {
    openOnlinePayment(payment, {
        onComplete: () => {
            refreshAgentSubscriptionPage();
        },
        onPaid: () => {
            refreshAgentSubscriptionPage();
        },
    });
}

export default function SubscribePackages() {
    const { agentSubscription, agentSubscriptionPackages } =
        usePageProps<AgentSubscriptionPageProps>();
    const { company } = usePageSharedDataProps();
    const createPayment = useCreateAgentSubscriptionPayment();

    const availablePackages = agentSubscriptionPackages.filter(
        (pkg) => Number(pkg.price) > 0,
    );

    const [packageId, setPackageId] = useState<string>('');
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);

    const selectedPackage = availablePackages.find(
        (pkg) => pkg.id.toString() === packageId,
    );

    const isRenewal = Boolean(agentSubscription);
    const title = isRenewal ? (
        <FormattedMessage defaultMessage="Renew subscription" />
    ) : (
        <FormattedMessage defaultMessage="Choose a plan" />
    );
    const description = isRenewal ? (
        <FormattedMessage defaultMessage="Select a package to extend your subscription and keep your agent account active." />
    ) : (
        <FormattedMessage defaultMessage="Pick the plan that fits your business and proceed to payment." />
    );

    useEffect(() => {
        if (availablePackages.length > 0 && !packageId) {
            const currentPackageId = agentSubscription?.package?.id?.toString();
            const defaultPackage = availablePackages.find(
                (pkg) => pkg.id.toString() === currentPackageId,
            );

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPackageId(
                (defaultPackage ?? availablePackages[0]).id.toString(),
            );
        }
    }, [agentSubscription?.package?.id, availablePackages, packageId]);

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
                    refreshAgentSubscriptionPendingPayment();
                    openSubscriptionPayment(payment.data);
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

    if (availablePackages.length === 0) {
        return (
            <Card className="flex h-full flex-col shadow-sm">
                <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                    <PackageIcon className="size-10 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">
                        <FormattedMessage defaultMessage="No plans available" />
                    </p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        <FormattedMessage defaultMessage="Subscription packages are not available right now. Please contact support." />
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="flex h-full flex-col shadow-sm">
                <CardHeader className="gap-3 border-b pb-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <PackageIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-base">{title}</CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                                {description}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                    <div className="grid gap-3">
                        {availablePackages.map((pkg) => {
                            const selected = packageId === pkg.id.toString();

                            return (
                                <button
                                    key={pkg.id}
                                    type="button"
                                    className={cn(
                                        'rounded-xl border p-4 text-left transition-all',
                                        selected
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                            : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30',
                                    )}
                                    onClick={() =>
                                        setPackageId(pkg.id.toString())
                                    }
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-1">
                                            <p className="font-semibold text-foreground">
                                                {pkg.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                <FormattedMessage
                                                    defaultMessage="{months, plural, one {# month} other {# months}}"
                                                    values={{
                                                        months: pkg.duration_months,
                                                    }}
                                                />
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-right text-lg font-bold tabular-nums text-foreground">
                                            {formatIDR(pkg.price)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selectedPackage ? (
                        <div className="rounded-xl border bg-muted/20 px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="You will pay" />
                            </p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                                {formatIDR(selectedPackage.price)}
                            </p>
                        </div>
                    ) : null}
                </CardContent>

                <CardFooter className="mt-auto flex flex-col gap-2 border-t bg-muted/20 pt-4 sm:flex-row">
                    <Button
                        size="lg"
                        className="h-11 w-full gap-2 sm:flex-1"
                        disabled={createPayment.isPending || !packageId}
                        onClick={() => setMethodDialogOpen(true)}
                    >
                        {createPayment.isPending ? (
                            <Spinner className="mr-1" />
                        ) : null}
                        <FormattedMessage defaultMessage="Choose payment method" />
                        <ArrowRightIcon className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-11 w-full gap-2 bg-background/80 sm:flex-1"
                        asChild
                    >
                        <Link
                            href={`${paymentsIndex({ company: company.username })}?type=agent-subscription-payment`}
                        >
                            <FormattedMessage defaultMessage="View payment history" />
                            <ExternalLinkIcon className="size-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            <PaymentMethodDialog
                open={methodDialogOpen}
                onOpenChange={setMethodDialogOpen}
                title={isRenewal ? 'Renew subscription' : 'Subscribe to a plan'}
                confirmLabel="Pay now"
                description={
                    selectedPackage ? (
                        <FormattedMessage
                            defaultMessage="Select how you want to pay {amount} for {plan}."
                            values={{
                                amount: formatIDR(selectedPackage.price),
                                plan: selectedPackage.name,
                            }}
                        />
                    ) : undefined
                }
                loading={createPayment.isPending}
                onConfirm={handlePay}
            />
        </>
    );
}
