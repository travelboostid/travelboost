import { ApiError } from '@/api/api-instance';
import { useCreateAiCreditTopupPayment } from '@/api/payment/payment';
import {
    ManualPaymentDialog,
    type ManualPaymentData,
} from '@/components/booking/ManualPaymentDialog';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import {
    refreshChatbotPage,
    refreshChatbotPendingTopup,
} from '@/lib/refresh-chatbot-page';
import { cn, formatIDR } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ArrowRightIcon, PlusIcon, SparklesIcon } from 'lucide-react';
import { cloneElement, isValidElement, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import type { ChatbotPageProps } from '..';
import PendingTopupConfirmDialog from './pending-topup-confirm-dialog';

const PRESET_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const MIN_AMOUNT = 100_000;

type AiCreditsTopupDialogProps = {
    children: React.ReactNode;
};

function openAiCreditTopupPayment(
    payment: Parameters<typeof openOnlinePayment>[0],
): void {
    openOnlinePayment(payment, {
        onComplete: () => {
            refreshChatbotPage();
        },
        onPaid: () => {
            refreshChatbotPage();
        },
    });
}

export function AiCreditsTopupDialog({ children }: AiCreditsTopupDialogProps) {
    const { pendingTopup } = usePageProps<ChatbotPageProps>();
    const [pendingConfirmOpen, setPendingConfirmOpen] = useState(false);
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);
    const [manualDialogOpen, setManualDialogOpen] = useState(false);
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);
    const [amount, setAmount] = useState<number | null>(null);
    const isValidAmount = amount !== null && amount >= MIN_AMOUNT;
    const { company } = usePageSharedDataProps();
    const topup = useCreateAiCreditTopupPayment();

    const resetAmountDialog = () => {
        setAmount(null);
    };

    const handleAmountDialogOpenChange = (nextOpen: boolean) => {
        setAmountDialogOpen(nextOpen);

        if (!nextOpen) {
            resetAmountDialog();
        }
    };

    const handleTopupTrigger = () => {
        if (pendingTopup) {
            setPendingConfirmOpen(true);
            return;
        }

        setAmountDialogOpen(true);
    };

    const handleContinueToMethods = () => {
        if (!isValidAmount) {
            return;
        }

        if (pendingTopup) {
            setAmountDialogOpen(false);
            setPendingConfirmOpen(true);
            return;
        }

        setAmountDialogOpen(false);
        setMethodDialogOpen(true);
    };

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
                    resetAmountDialog();
                    refreshChatbotPendingTopup();
                    openAiCreditTopupPayment(payment.data);
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
        if (!data.proofFile) return;

        setIsSubmittingManual(true);
        const formData = new FormData();
        formData.append('sender_bank_name', data.senderBankName);
        formData.append('sender_account_number', data.senderAccountNumber);
        formData.append('transfer_amount', String(data.transferAmount));
        formData.append('payment_date', data.paymentDate);
        formData.append('proof', data.proofFile);

        router.post(
            `/companies/${company.username}/dashboard/chatbot/manual-topup`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setManualDialogOpen(false);
                    resetAmountDialog();
                    refreshChatbotPendingTopup();
                    toast.success('Manual top-up request submitted.');
                },
                onError: (errors) => {
                    toast.error(
                        String(
                            errors.amount ||
                                errors.transfer_amount ||
                                'Failed to submit manual top-up.',
                        ),
                    );
                },
                onFinish: () => setIsSubmittingManual(false),
            },
        );
    };

    const trigger = isValidElement(children)
        ? cloneElement(
              children as React.ReactElement<{
                  onClick?: (event: React.MouseEvent) => void;
              }>,
              {
                  onClick: (event: React.MouseEvent) => {
                      (
                          children as React.ReactElement<{
                              onClick?: (event: React.MouseEvent) => void;
                          }>
                      ).props.onClick?.(event);
                      handleTopupTrigger();
                  },
              },
          )
        : children;

    return (
        <>
            {trigger}

            {pendingTopup ? (
                <PendingTopupConfirmDialog
                    open={pendingConfirmOpen}
                    onOpenChange={setPendingConfirmOpen}
                    pendingTopup={pendingTopup}
                    onStartNew={() => setAmountDialogOpen(true)}
                />
            ) : null}

            <Dialog
                open={amountDialogOpen}
                onOpenChange={handleAmountDialogOpenChange}
            >
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                    <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <SparklesIcon className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-lg">
                                    <FormattedMessage defaultMessage="Top up AI credits" />
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-relaxed">
                                    <FormattedMessage defaultMessage="Add credits to power your AI chatbot. Minimum top-up is Rp 100.000." />
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 px-6 py-5">
                        <div className="space-y-2.5">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <FormattedMessage defaultMessage="Quick amounts" />
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {PRESET_AMOUNTS.map((preset) => {
                                    const selected = amount === preset;

                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            className={cn(
                                                'rounded-xl border px-3 py-3 text-left transition-all',
                                                selected
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                    : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30',
                                            )}
                                            onClick={() => setAmount(preset)}
                                        >
                                            <p className="text-sm font-semibold tabular-nums text-foreground">
                                                {formatIDR(preset)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ai-custom-amount">
                                <FormattedMessage defaultMessage="Custom amount" />
                            </Label>
                            <Input
                                id="ai-custom-amount"
                                type="number"
                                min={MIN_AMOUNT}
                                step={1000}
                                placeholder="100000"
                                value={amount ?? ''}
                                onChange={(event) =>
                                    setAmount(
                                        event.target.value
                                            ? Number(event.target.value)
                                            : null,
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="Enter at least Rp 100.000" />
                            </p>
                        </div>

                        {isValidAmount ? (
                            <div className="rounded-xl border bg-muted/20 px-4 py-3">
                                <p className="text-xs text-muted-foreground">
                                    <FormattedMessage defaultMessage="You will top up" />
                                </p>
                                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                                    {formatIDR(amount)}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        <div className="flex w-full flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="w-full gap-2 sm:w-1/2"
                                disabled={!isValidAmount}
                                onClick={() => {
                                    if (pendingTopup) {
                                        setAmountDialogOpen(false);
                                        setPendingConfirmOpen(true);
                                    } else {
                                        setAmountDialogOpen(false);
                                        setManualDialogOpen(true);
                                    }
                                }}
                            >
                                <FormattedMessage defaultMessage="Manual Bank Transfer" />
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                className="w-full gap-2 sm:w-1/2"
                                disabled={!isValidAmount}
                                onClick={handleContinueToMethods}
                            >
                                <FormattedMessage defaultMessage="Online Payment" />
                                <ArrowRightIcon className="size-4" />
                            </Button>
                        </div>
                        <p className="flex w-full items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                            <PlusIcon className="size-3.5" />
                            <FormattedMessage defaultMessage="Credits are added after payment is confirmed" />
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PaymentMethodDialog
                open={methodDialogOpen}
                onOpenChange={setMethodDialogOpen}
                usageScope="platform"
                title="Top up AI credits"
                confirmLabel="Pay now"
                description={
                    isValidAmount ? (
                        <FormattedMessage
                            defaultMessage="Select how you want to pay {amount}."
                            values={{ amount: formatIDR(amount!) }}
                        />
                    ) : undefined
                }
                loading={topup.isPending}
                onConfirm={handlePay}
            />
            <ManualPaymentDialog
                open={manualDialogOpen}
                onClose={() => setManualDialogOpen(false)}
                onSubmit={handleManualSubmit}
                isSubmitting={isSubmittingManual}
                amount={amount ?? 0}
                vendorBank={{
                    bankName: 'BCA',
                    accountName: 'PT Erasoft Teknologi Indonesia',
                    accountNumber: '123456789',
                }}
            />
        </>
    );
}
