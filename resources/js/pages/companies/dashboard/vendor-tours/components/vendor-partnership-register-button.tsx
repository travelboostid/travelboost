import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { register } from '@/routes/companies/dashboard/vendor-registrations';
import { router } from '@inertiajs/react';

import { useStartPrivateChat } from '@/components/chat/state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { NotebookPenIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

type VendorPartnershipRegistrationButtonProps = {
    vendor: any;
    partnership: any;
};

export default function VendorPartnershipRegistrationButton({
    vendor,
    partnership,
}: VendorPartnershipRegistrationButtonProps) {
    const { company } = usePageSharedDataProps();
    const [showRegistrationDetails, setShowRegistrationDetails] =
        useState(false);
    const startPrivateChat = useStartPrivateChat();

    const handleRegister = () => {
        router.post(
            register({
                company: company.username,
            }),
            { vendor_id: vendor.id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // optional: toast
                },
            },
        );
    };

    const handleFollowup = () => {
        startPrivateChat({
            type: 'company',
            id: vendor.id,
        });
        setShowRegistrationDetails(false);
    };

    if (company.username === vendor.username) {
        return null;
    }

    return (
        <>
            {!partnership && (
                <Button onClick={handleRegister}>
                    <FormattedMessage defaultMessage="Registration to Vendor" />
                </Button>
            )}
            {partnership?.status === 'pending' && (
                <Button onClick={() => setShowRegistrationDetails(true)}>
                    <FormattedMessage defaultMessage="Waiting Approval" />
                </Button>
            )}
            {partnership?.status === 'active' && (
                <Button disabled>
                    <FormattedMessage defaultMessage="Registered" />
                </Button>
            )}
            {partnership?.status === 'rejected' && (
                <Button
                    onClick={() => setShowRegistrationDetails(true)}
                    variant="destructive"
                >
                    <FormattedMessage defaultMessage="Registration Rejected" />
                </Button>
            )}
            {partnership?.status === 'suspended' && (
                <Button
                    onClick={() => setShowRegistrationDetails(true)}
                    variant="destructive"
                >
                    <FormattedMessage defaultMessage="Registration Suspended" />
                </Button>
            )}
            <AlertDialog
                open={showRegistrationDetails}
                onOpenChange={setShowRegistrationDetails}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            <FormattedMessage defaultMessage="Registration Details" />
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <div>
                                <FormattedMessage
                                    defaultMessage="Your registration status is currently {status}"
                                    values={{
                                        status: (
                                            <strong>
                                                {partnership?.status}
                                            </strong>
                                        ),
                                    }}
                                />
                            </div>
                            {partnership?.note && (
                                <>
                                    <div>
                                        <FormattedMessage defaultMessage="The vendor left a note for you regarding your current registration status:" />
                                    </div>
                                    <Alert className="max-w-md">
                                        <NotebookPenIcon />
                                        <AlertTitle>
                                            <FormattedMessage defaultMessage="Note" />
                                        </AlertTitle>
                                        <AlertDescription>
                                            {partnership.note}
                                        </AlertDescription>
                                    </Alert>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setShowRegistrationDetails(false)}
                        >
                            <FormattedMessage defaultMessage="Close" />
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleFollowup}>
                            <FormattedMessage defaultMessage="Follow up" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
