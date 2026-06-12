import { cancel } from '@/actions/App/Http/Controllers/Companies/Dashboard/PaymentController';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { refreshWalletPage } from '@/lib/refresh-wallet-page';
import { router } from '@inertiajs/react';
import { FormattedMessage } from 'react-intl';

export default function CancelPayment({ payment }: { payment: any }) {
    const { company } = usePageSharedDataProps();
    const handleCancel = () => {
        router.post(
            cancel({ company: company.username, payment: payment.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    refreshWalletPage();
                },
            },
        );
    };
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                    <FormattedMessage defaultMessage="Cancel" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Are you absolutely sure?" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage
                            defaultMessage="This action cannot be undone. This will permanently cancel payment #{paymentId}."
                            values={{ paymentId: payment.id }}
                        />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Close" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>
                        <FormattedMessage defaultMessage="Continue" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
