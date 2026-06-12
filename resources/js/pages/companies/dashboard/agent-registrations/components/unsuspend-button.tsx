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
import { update } from '@/routes/companies/dashboard/agent-registrations';
import { useForm } from '@inertiajs/react';
import { UserCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

export default function UnsuspendButton({
    registration,
}: {
    registration: any;
}) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm({
        status: 'active',
        note: '',
    });
    const handleApprove = () => {
        form.put(
            update({
                company: company.username,
                agent_registration: registration.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                },
            },
        );
    };
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button size="icon" className="text-primary" variant="outline">
                    <UserCheckIcon />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Unsuspend Registration" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage defaultMessage="This will unsuspend the registration and allow the agent to access your tours. The agent will be notified about the change. Are you sure you want to proceed?" />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Cancel" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove}>
                        <FormattedMessage defaultMessage="Unsuspend" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
