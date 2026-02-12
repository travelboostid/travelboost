import { useGetWithdrawals } from '@/api/withdrawal/withdrawal';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { ShieldAlertIcon } from 'lucide-react';

export default function PendingWithdrawal() {
  const { data } = useGetWithdrawals({ status: 'pending' });
  const pendingWithdrawal = data?.data?.[0];
  const handleCancel = () => {};

  return pendingWithdrawal ? (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <ShieldAlertIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>You have pending withdrawals</ItemTitle>
        <ItemDescription>
          Please wait patiently to have your withdrawal done
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </ItemActions>
    </Item>
  ) : null;
}
