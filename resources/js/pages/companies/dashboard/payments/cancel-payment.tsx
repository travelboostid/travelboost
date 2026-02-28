import { cancel } from '@/actions/App/Http/Controllers/Companies/Dashboard/PaymentController';
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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';

export default function CancelPayment({
  payment,
  children,
}: {
  payment: any;
  children?: any;
}) {
  const { company } = usePageSharedDataProps();
  const handleCancel = () => {
    router.put(
      cancel({ company: company.username, payment: payment.id }),
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          // optional: toast / notification
          console.log('Payment cancelled');
        },
      },
    );
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently cancel payment #
            {payment.id}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
