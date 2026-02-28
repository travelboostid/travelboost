import type { PaymentResource } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import dayjs from 'dayjs';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import CancelPayment from './cancel-payment';

// Simple status badge with shadcn theme colors
function PaymentStatus({ status }: { status: string }) {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      className:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className: 'bg-muted text-muted-foreground hover:bg-muted/80',
    },
  };

  const {
    label,
    icon: Icon,
    className,
  } = config[status as keyof typeof config] || {
    label: status,
    icon: Clock,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge className={`gap-1.5 px-3 py-1 ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Badge>
  );
}

// Simple payment icon with theme colors
function PaymentTypeIcon({ type }: { type: string }) {
  const config = {
    'wallet-topup': { icon: Wallet, className: 'bg-primary/10 text-primary' },
    payment: {
      icon: CreditCard,
      className: 'bg-secondary/10 text-secondary-foreground',
    },
    refund: { icon: Receipt, className: 'bg-muted text-muted-foreground' },
  };

  const { icon: Icon, className } = config[type as keyof typeof config] || {
    icon: CreditCard,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <div className={`p-2.5 rounded-full ${className}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

export default function PaymentCard({ payment }: { payment: PaymentResource }) {
  const paymentType = useMemo(() => {
    const types: Record<string, string> = {
      'wallet-topup': 'Wallet Top-up',
      payment: 'Payment',
      refund: 'Refund',
    };
    return types[payment.payable_type] || 'Unknown Payment';
  }, [payment.payable_type]);

  return (
    <Item variant="outline" className="hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 p-4">
        <PaymentTypeIcon type={payment.payable_type} />
        <ItemContent>
          <div className="flex items-center gap-3">
            <ItemTitle className="font-semibold">
              {formatIDR(payment.amount)}
            </ItemTitle>
            <span className="text-xs text-muted-foreground">
              {dayjs(payment.created_at).format('MMM DD, YYYY')}
            </span>
          </div>
          <ItemDescription className="flex items-center gap-2">
            <span>{paymentType}</span>
            {payment.reference && (
              <>
                <span>•</span>
                <span className="text-xs font-mono">
                  Ref: {payment.reference}
                </span>
              </>
            )}
          </ItemDescription>
        </ItemContent>
      </div>
      <ItemActions className="pr-4">
        <PaymentStatus status={payment.status || 'completed'} />
        {payment.status === 'pending' && (
          <CancelPayment payment={payment}>
            <Button variant={'destructive'}>Cancel</Button>
          </CancelPayment>
        )}
      </ItemActions>
    </Item>
  );
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
