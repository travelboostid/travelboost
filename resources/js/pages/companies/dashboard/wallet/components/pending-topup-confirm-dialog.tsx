import { cancel } from '@/actions/App/Http/Controllers/Companies/Dashboard/PaymentController';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { openOnlinePayment } from '@/lib/open-online-payment';
import {
    refreshWalletPage,
    refreshWalletPendingTopup,
} from '@/lib/refresh-wallet-page';
import { formatIDR } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Clock3Icon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import type { WalletPageProps } from '..';

type PendingTopupConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingTopup: NonNullable<WalletPageProps['pendingTopup']>;
    onStartNew: () => void;
};

function openWalletTopupPayment(
    payment: NonNullable<WalletPageProps['pendingTopup']>,
): void {
    openOnlinePayment(
        {
            id: payment.id as number | string | undefined,
            status: payment.status as string | undefined,
            provider: payment.provider as string | undefined,
            amount: payment.amount as number | undefined,
            payload: payment.payload as Record<string, unknown> | undefined,
        },
        {
            onComplete: () => {
                refreshWalletPage();
            },
            onPaid: () => {
                refreshWalletPage();
            },
        },
    );
}

export default function PendingTopupConfirmDialog({
    open,
    onOpenChange,
    pendingTopup,
    onStartNew,
}: PendingTopupConfirmDialogProps) {
    const { company } = usePageSharedDataProps();
    const [cancelling, setCancelling] = useState(false);
    const amount =
        typeof pendingTopup.amount === 'number' ? pendingTopup.amount : null;

    const handleContinue = () => {
        onOpenChange(false);

        // Wait for the alert dialog to finish closing before opening payment.
        window.setTimeout(() => {
            openWalletTopupPayment(pendingTopup);
        }, 100);
    };

    const handleCancelAndStartNew = () => {
        if (!pendingTopup.id || cancelling) {
            return;
        }

        setCancelling(true);

        router.post(
            cancel({
                company: company.username,
                payment: pendingTopup.id as number,
            }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    refreshWalletPendingTopup();
                    onOpenChange(false);
                    onStartNew();
                },
                onFinish: () => {
                    setCancelling(false);
                },
            },
        );
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <Clock3Icon className="size-5" />
                        </div>
                        <div className="space-y-2">
                            <AlertDialogTitle>
                                <FormattedMessage defaultMessage="Pending top-up in progress" />
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm leading-relaxed">
                                {amount !== null ? (
                                    <FormattedMessage
                                        defaultMessage="You already have a pending wallet top-up of {amount}. Continue that payment or cancel it to start a new one."
                                        values={{ amount: formatIDR(amount) }}
                                    />
                                ) : (
                                    <FormattedMessage defaultMessage="You already have a pending wallet top-up. Continue that payment or cancel it to start a new one." />
                                )}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={handleContinue}
                    >
                        <FormattedMessage defaultMessage="Continue payment" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full"
                        disabled={cancelling}
                        onClick={handleCancelAndStartNew}
                    >
                        {cancelling ? <Spinner className="mr-2" /> : null}
                        <FormattedMessage defaultMessage="Cancel and start new" />
                    </Button>
                    <AlertDialogCancel className="mt-0 w-full">
                        <FormattedMessage defaultMessage="Not now" />
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
