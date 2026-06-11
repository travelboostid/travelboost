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
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import { cancel } from '@/routes/companies/dashboard/withdrawals';
import { router } from '@inertiajs/react';
import { FormattedMessage } from 'react-intl';
import type { WithdrawalsPageProps } from '..';

type CancelWithdrawalDialogProps = {
    withdrawal: {
        id: number;
        amount: number;
    };
};

export default function CancelWithdrawalDialog({
    withdrawal,
}: CancelWithdrawalDialogProps) {
    const { company } = usePageProps<WithdrawalsPageProps>();

    const handleCancel = () => {
        router.post(
            cancel({ company: company.username, withdrawal: withdrawal.id })
                .url,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FormattedMessage defaultMessage="Cancel request" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Cancel withdrawal?" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage
                            defaultMessage="This will cancel your pending withdrawal of {amount}. You can submit a new request later."
                            values={{ amount: formatIDR(withdrawal.amount) }}
                        />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Keep request" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>
                        <FormattedMessage defaultMessage="Cancel withdrawal" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
