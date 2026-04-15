import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { register } from '@/routes/company/vendor-registrations';
import { router } from '@inertiajs/react';

import { useFloatingChatWidgetContext } from '@/components/chat/state';
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

type VendorPartnershipRegistrationButtonProps = {
  vendor: any;
  partnership: any;
};

export default function VendorPartnershipRegistrationButton({
  vendor,
  partnership,
}: VendorPartnershipRegistrationButtonProps) {
  const { company } = usePageSharedDataProps();
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const floatingChat = useFloatingChatWidgetContext();

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
    floatingChat.startPrivateChat({
      type: 'company',
      id: vendor.id,
    });
    setShowRegistrationDetails(false);
  };

  return (
    <>
      {!partnership && <Button onClick={handleRegister}>Register</Button>}
      {partnership?.status === 'pending' && (
        <Button onClick={() => setShowRegistrationDetails(true)}>
          Waiting Approval
        </Button>
      )}
      {partnership?.status === 'active' && <Button disabled>Registered</Button>}
      {partnership?.status === 'rejected' && (
        <Button
          onClick={() => setShowRegistrationDetails(true)}
          variant="destructive"
        >
          Registration Rejected
        </Button>
      )}
      {partnership?.status === 'suspended' && (
        <Button
          onClick={() => setShowRegistrationDetails(true)}
          variant="destructive"
        >
          Registration Suspended
        </Button>
      )}
      <AlertDialog
        open={showRegistrationDetails}
        onOpenChange={setShowRegistrationDetails}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registration Details</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Your registration status is currently{' '}
                <strong>{partnership?.status}</strong>
              </div>
              {partnership?.note && (
                <>
                  <div>
                    The vendor left a note for you regarding your current
                    registration status:
                  </div>
                  <Alert className="max-w-md">
                    <NotebookPenIcon />
                    <AlertTitle>Note</AlertTitle>
                    <AlertDescription>{partnership.note}</AlertDescription>
                  </Alert>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowRegistrationDetails(false)}
            >
              Close
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFollowup}>
              Followup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
