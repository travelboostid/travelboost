import { ApiError } from '@/api/api-instance';
import { useCreateAgentSubscriptionPayment } from '@/api/payment/payment';
import {
    ManualPaymentDialog,
    type ManualPaymentData,
} from '@/components/booking/ManualPaymentDialog';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import {
    refreshAgentSubscriptionPage,
    refreshAgentSubscriptionPendingPayment,
} from '@/lib/refresh-agent-subscription-page';
import { cn, formatIDR } from '@/lib/utils';
import { paymentHistory as paymentHistoryRoute } from '@/routes/companies/dashboard/agent-subscriptions';
import { Link, router } from '@inertiajs/react';
import {
    BanknoteIcon,
    CreditCardIcon,
    ExternalLinkIcon,
    PackageIcon,
} from 'lucide-react';
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
    const [paymentTypeDialogOpen, setPaymentTypeDialogOpen] = useState(false);
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);
    const [manualDialogOpen, setManualDialogOpen] = useState(false);
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);

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

    const handleManualSubmit = (data: ManualPaymentData) => {
        if (!data.proofFile || !packageId) return;

        setIsSubmittingManual(true);
        const formData = new FormData();
        formData.append('sender_bank_name', data.senderBankName);
        formData.append('sender_account_number', data.senderAccountNumber);
        formData.append('transfer_amount', String(data.transferAmount));
        formData.append('payment_date', data.paymentDate);
        formData.append('proof', data.proofFile);
        formData.append('package_id', packageId);

        router.post(
            `/companies/${company.username}/dashboard/agent-subscriptions/manual-payment`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setManualDialogOpen(false);
                    refreshAgentSubscriptionPendingPayment();
                    toast.success(
                        'Manual subscription payment request submitted.',
                    );
                },
                onError: (errors) => {
                    toast.error(
                        String(
                            errors.package_id ||
                                errors.transfer_amount ||
                                'Failed to submit manual payment.',
                        ),
                    );
                },
                onFinish: () => setIsSubmittingManual(false),
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
                    <Popover
                        open={paymentTypeDialogOpen}
                        onOpenChange={setPaymentTypeDialogOpen}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                size="lg"
                                className="h-11 w-full gap-2 sm:flex-1"
                                disabled={createPayment.isPending || !packageId}
                            >
                                {createPayment.isPending ? (
                                    <Spinner className="mr-1" />
                                ) : null}
                                <FormattedMessage defaultMessage="Pay Now!" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                            <div className="px-4 py-3 border-b border-border/50">
                                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    <FormattedMessage defaultMessage="Select Payment Method" />
                                </p>
                            </div>
                            <div className="flex flex-col py-2">
                                <button
                                    type="button"
                                    className="flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                        setPaymentTypeDialogOpen(false);
                                        setManualDialogOpen(true);
                                    }}
                                >
                                    <BanknoteIcon className="size-5 mt-0.5 shrink-0 text-emerald-600" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none text-foreground">
                                            <FormattedMessage defaultMessage="Manual Payment" />
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Bank Transfer" />
                                        </p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className="flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                        setPaymentTypeDialogOpen(false);
                                        setMethodDialogOpen(true);
                                    }}
                                >
                                    <CreditCardIcon className="size-5 mt-0.5 shrink-0 text-blue-600" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none text-foreground">
                                            <FormattedMessage defaultMessage="Online Payment" />
                                        </p>
                                        <p className="text-sm text-muted-foreground leading-snug">
                                            <FormattedMessage defaultMessage="Visa, Mastercard, Amex, QRIS, Virtual Account" />
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-11 w-full gap-2 bg-background/80 sm:flex-1"
                        asChild
                    >
                        <Link
                            href={paymentHistoryRoute({
                                company: company.username,
                            })}
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
                usageScope="platform"
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
            <ManualPaymentDialog
                open={manualDialogOpen}
                onClose={() => setManualDialogOpen(false)}
                onSubmit={handleManualSubmit}
                isSubmitting={isSubmittingManual}
                amount={
                    selectedPackage?.price ? Number(selectedPackage.price) : 0
                }
                vendorBank={{
                    bankName: 'BCA',
                    accountName: 'PT Erasoft Teknologi Indonesia',
                    accountNumber: '123456789',
                }}
            />
        </>
    );
}
