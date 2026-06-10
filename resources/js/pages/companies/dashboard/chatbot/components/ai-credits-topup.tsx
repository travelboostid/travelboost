import { ApiError } from '@/api/api-instance';
import { useCreateAiCreditTopupPayment } from '@/api/payment/payment';
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
import { ArrowRightIcon, PlusIcon, SparklesIcon } from 'lucide-react';
import { cloneElement, isValidElement, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import type { ChatbotPageProps } from '..';

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
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);
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
            openAiCreditTopupPayment({
                id: pendingTopup.id as number | string | undefined,
                status: pendingTopup.status as string | undefined,
                provider: pendingTopup.provider as string | undefined,
                amount: pendingTopup.amount as number | undefined,
                payload: pendingTopup.payload as
                    | Record<string, unknown>
                    | undefined,
            });

            return;
        }

        setAmountDialogOpen(true);
    };

    const handleContinueToMethods = () => {
        if (!isValidAmount) {
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
                        <Button
                            type="button"
                            size="lg"
                            className="w-full gap-2"
                            disabled={!isValidAmount}
                            onClick={handleContinueToMethods}
                        >
                            <FormattedMessage defaultMessage="Choose payment method" />
                            <ArrowRightIcon className="size-4" />
                        </Button>
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
        </>
    );
}
