import { destroy } from '@/actions/App/Http/Controllers/Companies/Dashboard/AgentTourController';
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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';

export default function TourDeleteConfirmDialog({ children, tour }: any) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const handleDelete = () => {
        router.delete(
            destroy({ company: company.username, agent_tour: tour.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        intl.formatMessage({
                            defaultMessage: 'Success',
                        }),
                        {
                            position: 'top-center',
                            description: intl.formatMessage({
                                defaultMessage: 'Tour deleted successfully',
                            }),
                        },
                    );
                },
            },
        );
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Are you absolutely sure?" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage defaultMessage="This action cannot be undone. This will permanently delete the tour." />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Cancel" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                        <FormattedMessage defaultMessage="Continue" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
