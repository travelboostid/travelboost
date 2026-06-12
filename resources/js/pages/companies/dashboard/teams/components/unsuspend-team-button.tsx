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
import { update } from '@/routes/companies/dashboard/teams';
import { useForm } from '@inertiajs/react';
import { UserCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export default function UnsuspendTeamButton({ team }: { team: any }) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm({
        status: 'active',
    });

    const handleUnsuspend = () => {
        form.put(update({ company: company.username, team: team.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
            },
        });
    };
    const shouldDisabled = team.is_owner;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger disabled={shouldDisabled}>
                <Tooltip>
                    <TooltipTrigger>
                        <Button
                            disabled={shouldDisabled}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Unsuspend',
                            })}
                        >
                            <UserCheckIcon className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <FormattedMessage defaultMessage="Unsuspend" />
                    </TooltipContent>
                </Tooltip>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Unsuspend user?" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage defaultMessage="Are you sure you want to unsuspend this user? They will be able to access all company resources. You can suspend them again at any time by clicking the suspend button." />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Cancel" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnsuspend}>
                        <FormattedMessage defaultMessage="Unsuspend" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
