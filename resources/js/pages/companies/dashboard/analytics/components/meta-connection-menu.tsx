import { disconnect } from '@/actions/App/Http/Controllers/Companies/Dashboard/FacebookAccountController';
import { unlinkConnection } from '@/actions/App/Http/Controllers/Companies/Dashboard/MetaAnalyticsController';
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
import type { MetaAnalyticsPageProps } from '../meta';

type ConfirmAction = 'pixel' | 'facebook' | null;

export function MetaConnectionMenu() {
    const { company, metaAccount, metaPixel } =
        usePageProps<MetaAnalyticsPageProps>();
    const form = useForm({});
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

    const handleConfirm = () => {
        if (confirmAction === 'pixel') {
            form.delete(unlinkConnection(company.username).url);
            return;
        }

        if (confirmAction === 'facebook') {
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
                        onSelect={() => setConfirmAction('pixel')}
                    >
                        <Link2OffIcon />
                        <FormattedMessage defaultMessage="Change pixel" />
                    </DropdownMenuItem>
                    {metaAccount ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setConfirmAction('facebook')}
                            >
                                <UnplugIcon />
                                <FormattedMessage defaultMessage="Disconnect Facebook account" />
                            </DropdownMenuItem>
                        </>
                    ) : null}
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
                            {confirmAction === 'pixel' ? (
                                <FormattedMessage defaultMessage="Change Meta Pixel?" />
                            ) : (
                                <FormattedMessage defaultMessage="Disconnect Facebook account?" />
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction === 'pixel' ? (
                                <FormattedMessage
                                    defaultMessage="This removes the linked Meta Pixel ({pixelId}). You can choose a different pixel right after."
                                    values={{
                                        pixelId: metaPixel?.pixel_id ?? 'Pixel',
                                    }}
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="This disconnects {email} from Meta. Dashboard insights stop until you sign in with Facebook again."
                                    values={{
                                        email: metaAccount?.email ?? 'Facebook',
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
                                confirmAction === 'facebook'
                                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600'
                                    : undefined
                            }
                        >
                            {form.processing ? (
                                <Spinner className="mr-2 size-4" />
                            ) : null}
                            {confirmAction === 'pixel' ? (
                                <FormattedMessage defaultMessage="Change pixel" />
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
