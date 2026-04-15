import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import { CoinsIcon } from 'lucide-react';
import CancelPayment from './cancel-payment';
import ContinuePayment from './continue-payment';
const PAYABLE_TYPE_MAP: Record<string, string> = {
  'wallet-topup-payment': 'Wallet Top-up',
  'agent-subscription-payment': 'Agent Subscription Payment',
  refund: 'Refund',
};

export default function PaymentCard({ payment }: { payment: any }) {
  return (
    <Item variant="outline" className="hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 p-4">
        <div className="rounded-full bg-muted text-muted-foreground p-4">
          <CoinsIcon className="w-4 h-4" />
        </div>
        <ItemContent>
          <div className="flex items-center gap-2">
            <ItemTitle className="font-semibold">
              {formatIDR(payment.amount)}
            </ItemTitle>
            <Badge variant="secondary">{payment.status}</Badge>
            <Badge variant="secondary">
              {PAYABLE_TYPE_MAP[payment.payable_type] || 'Unknown Payment'}
            </Badge>
          </div>
          <ItemDescription className="flex items-center gap-2">
            {dayjs(payment.created_at).fromNow()}
          </ItemDescription>
        </ItemContent>
      </div>
      <ItemActions className="pr-4">
        {['unpaid', 'pending'].includes(payment.status) && (
          <ContinuePayment payment={payment} />
        )}
        {payment.status === 'pending' && <CancelPayment payment={payment} />}
      </ItemActions>
    </Item>
  );
}
