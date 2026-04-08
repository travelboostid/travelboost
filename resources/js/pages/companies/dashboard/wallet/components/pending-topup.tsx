import { useGetPayments } from '@/api/payment/payment';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { ShieldAlertIcon } from 'lucide-react';
import CancelPayment from '../../payments/components/cancel-payment';
import ContinuePayment from './continue-payment';

export default function PendingTopup() {
  const { data, refetch } = useGetPayments();
  const pendingTopup = data?.data.find(
    (payment) => payment.status === 'pending',
  );

  const handlePay = () => {
    const snapToken = (pendingTopup?.payload as any)?.snap_token as string;
    (window as any).snap.pay(snapToken, {
      onSuccess: () => refetch(),
      onError: () => refetch(),
      onClose: () => refetch(),
    });
  };
  return pendingTopup ? (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <ShieldAlertIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>You have unpaid topups</ItemTitle>
        <ItemDescription>
          Please review and complete your pending wallet topups.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <CancelPayment payment={pendingTopup} />
        <ContinuePayment payment={pendingTopup} />
      </ItemActions>
    </Item>
  ) : null;
}
