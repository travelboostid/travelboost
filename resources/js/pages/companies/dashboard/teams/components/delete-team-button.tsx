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
import { destroy } from '@/routes/companies/dashboard/teams';
import { useForm } from '@inertiajs/react';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export default function DeleteTeamButton({
    team,
    disabled = false,
}: {
    team: any;
    disabled?: boolean;
}) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm();
    const shouldDisable = disabled || team.is_owner;

    const handleDelete = () => {
        form.delete(destroy({ company: company.username, team: team.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                        <Button
                            disabled={shouldDisable}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Delete team member',
                            })}
                        >
                            <Trash2Icon className="size-4" />
                        </Button>
                    </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <FormattedMessage defaultMessage="Delete team member" />
                </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Delete team member?" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <FormattedMessage defaultMessage="This will remove the team member from this company immediately." />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <FormattedMessage defaultMessage="Cancel" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                        <FormattedMessage defaultMessage="Delete" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
