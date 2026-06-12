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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { resendInvitation } from '@/routes/companies/dashboard/teams';
import { useForm } from '@inertiajs/react';
import { RepeatIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export default function ResendInvitationButton({ team }: { team: any }) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm();

    const handleResend = () => {
        form.post(
            resendInvitation({ company: company.username, team: team.id }).url,
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
            <AlertDialogTrigger>
                <Tooltip>
                    <TooltipTrigger>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Resend Invitation',
                            })}
                        >
                            <RepeatIcon className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <FormattedMessage defaultMessage="Resend Invitation" />
                    </TooltipContent>
                </Tooltip>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Resend Invitation?" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage defaultMessage="This will resend the invitation to the recipient. Make sure they check their inbox and spam folder." />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Cancel" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleResend}>
                        <FormattedMessage defaultMessage="Resend" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
