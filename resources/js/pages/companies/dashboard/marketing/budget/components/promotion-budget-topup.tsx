import { ApiError } from '@/api/api-instance';
import { createPromotionBudgetTopupPayment } from '@/api/promotion-budget/payment';
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
    refreshPromotionBudgetPage,
    refreshPromotionBudgetPendingTopup,
} from '@/lib/refresh-promotion-budget-page';
import { cn, formatIDR } from '@/lib/utils';
import { ArrowRightIcon, MegaphoneIcon, PlusIcon } from 'lucide-react';
import { cloneElement, isValidElement, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import type { PromotionBudgetPageProps } from '..';

const PRESET_AMOUNTS = [500_000, 1_000_000, 2_000_000, 5_000_000];
const MIN_AMOUNT = 100_000;

type PromotionBudgetTopupDialogProps = {
    children: React.ReactNode;
};

function openPromotionBudgetTopupPayment(
    payment: Parameters<typeof openOnlinePayment>[0],
): void {
    openOnlinePayment(payment, {
        onComplete: () => {
            refreshPromotionBudgetPage();
        },
        onPaid: () => {
            refreshPromotionBudgetPage();
        },
    });
}

export function PromotionBudgetTopupDialog({
    children,
}: PromotionBudgetTopupDialogProps) {
    const { pendingTopup } = usePageProps<PromotionBudgetPageProps>();
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);
    const [amount, setAmount] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isValidAmount = amount !== null && amount >= MIN_AMOUNT;
    const { company } = usePageSharedDataProps();

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
            openPromotionBudgetTopupPayment({
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

    const handlePay = async (methodId: number) => {
        if (!isValidAmount || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payment = await createPromotionBudgetTopupPayment({
                amount,
                company_id: company.id,
                payment_method_id: methodId,
            });

            setMethodDialogOpen(false);
            resetAmountDialog();
            refreshPromotionBudgetPendingTopup();
            openPromotionBudgetTopupPayment(payment.data);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : 'Failed to create payment. Please try again.';

            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
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
                                <MegaphoneIcon className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-lg">
                                    <FormattedMessage defaultMessage="Top up promotion budget" />
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-relaxed">
                                    <FormattedMessage defaultMessage="Add funds for ad campaigns across connected platforms. Minimum top-up is Rp 100.000." />
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
                            <Label htmlFor="promotion-budget-custom-amount">
                                <FormattedMessage defaultMessage="Custom amount" />
                            </Label>
                            <Input
                                id="promotion-budget-custom-amount"
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
                            <FormattedMessage defaultMessage="Budget is added after payment is confirmed" />
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PaymentMethodDialog
                open={methodDialogOpen}
                onOpenChange={setMethodDialogOpen}
                title="Top up promotion budget"
                confirmLabel="Pay now"
                description={
                    isValidAmount ? (
                        <FormattedMessage
                            defaultMessage="Select how you want to pay {amount}."
                            values={{ amount: formatIDR(amount!) }}
                        />
                    ) : undefined
                }
                loading={isSubmitting}
                onConfirm={handlePay}
            />
        </>
    );
}
