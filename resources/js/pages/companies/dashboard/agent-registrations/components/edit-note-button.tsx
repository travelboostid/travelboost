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
import { Textarea } from '@/components/ui/textarea';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/companies/dashboard/agent-registrations';
import { useForm } from '@inertiajs/react';
import { NotebookPenIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export default function EditNoteButton({
    registration,
}: {
    registration: any;
}) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm({
        note: registration.note || '',
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
                <Button size="icon">
                    <NotebookPenIcon />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Edit Note" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage defaultMessage="Leave a note about the current status of the registration. The agent will be notified so they can contact you to resolve any issues." />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    cols={5}
                    placeholder={intl.formatMessage({
                        defaultMessage: 'Write a note for the agent',
                    })}
                    value={form.data.note}
                    onChange={(e) => form.setData('note', e.target.value)}
                    className="w-full"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Cancel" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove}>
                        <FormattedMessage defaultMessage="Update Note" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
