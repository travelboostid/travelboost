import { disconnect } from '@/actions/App/Http/Controllers/Companies/Dashboard/FacebookAccountController';
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
import { Spinner } from '@/components/ui/spinner';
import usePageProps from '@/hooks/use-page-props';
import { useForm } from '@inertiajs/react';
import { UnplugIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

type DisconnectFacebookAccountButtonProps = {
    email?: string | null;
    name?: string | null;
    hasPixel: boolean;
};

export function DisconnectFacebookAccountButton({
    email,
    name,
    hasPixel,
}: DisconnectFacebookAccountButtonProps) {
    const { company } = usePageProps();
    const form = useForm({});
    const [open, setOpen] = useState(false);

    const handleDisconnect = () => {
        form.delete(disconnect(company.username).url, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <UnplugIcon />
                    <FormattedMessage defaultMessage="Unlink account" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <FormattedMessage defaultMessage="Unlink Facebook account?" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {hasPixel ? (
                            <FormattedMessage
                                defaultMessage="This disconnects {account} and removes the linked Meta Pixel. Tracking on your public pages stops until you connect again."
                                values={{
                                    account: (
                                        <span className="font-medium text-foreground">
                                            {email ?? name ?? 'Facebook'}
                                        </span>
                                    ),
                                }}
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="This disconnects {account} from your company. You can link Facebook again anytime from Analytics or this page."
                                values={{
                                    account: (
                                        <span className="font-medium text-foreground">
                                            {email ?? name ?? 'Facebook'}
                                        </span>
                                    ),
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
                            handleDisconnect();
                        }}
                        disabled={form.processing}
                        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                    >
                        {form.processing ? (
                            <Spinner className="mr-2 size-4" />
                        ) : null}
                        <FormattedMessage defaultMessage="Unlink account" />
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
