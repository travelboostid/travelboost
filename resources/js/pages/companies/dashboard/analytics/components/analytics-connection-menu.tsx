import { disconnect } from '@/actions/App/Http/Controllers/Companies/Dashboard/GoogleAccountController';
import { unlinkConnection } from '@/actions/App/Http/Controllers/Companies/Dashboard/GoogleAnalyticsController';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import usePageProps from '@/hooks/use-page-props';
import { useForm } from '@inertiajs/react';
import { Link2OffIcon, MoreHorizontalIcon, UnplugIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';

type ConfirmAction = 'property' | 'google' | null;

export function AnalyticsConnectionMenu() {
    const { company, account, analytics } = usePageProps<AnalyticsPageProps>();
    const form = useForm({});
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

    const handleConfirm = () => {
        if (confirmAction === 'property') {
            form.delete(unlinkConnection(company.username).url);
            return;
        }

        if (confirmAction === 'google') {
            form.delete(disconnect(company.username).url);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        <MoreHorizontalIcon />
                        <FormattedMessage defaultMessage="Manage connection" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                        onSelect={() => setConfirmAction('property')}
                    >
                        <Link2OffIcon />
                        <FormattedMessage defaultMessage="Change property" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setConfirmAction('google')}
                    >
                        <UnplugIcon />
                        <FormattedMessage defaultMessage="Disconnect Google account" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
                open={confirmAction !== null}
                onOpenChange={(open) => {
                    if (!open && !form.processing) {
                        setConfirmAction(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction === 'property' ? (
                                <FormattedMessage defaultMessage="Change Analytics property?" />
                            ) : (
                                <FormattedMessage defaultMessage="Disconnect Google account?" />
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction === 'property' ? (
                                <FormattedMessage
                                    defaultMessage="This removes the linked GA4 property ({measurementId}). You can choose a different property or data stream right after."
                                    values={{
                                        measurementId:
                                            analytics?.measurement_id ?? 'GA4',
                                    }}
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="This disconnects {email} from Analytics. Tracking on your public pages stops until you sign in with Google again."
                                    values={{
                                        email: account?.email ?? 'Google',
                                    }}
                                />
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={form.processing}>
                            <FormattedMessage defaultMessage="Cancel" />
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                handleConfirm();
                            }}
                            disabled={form.processing}
                            className={
                                confirmAction === 'google'
                                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600'
                                    : undefined
                            }
                        >
                            {form.processing ? (
                                <Spinner className="mr-2 size-4" />
                            ) : null}
                            {confirmAction === 'property' ? (
                                <FormattedMessage defaultMessage="Change property" />
                            ) : (
                                <FormattedMessage defaultMessage="Disconnect" />
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
