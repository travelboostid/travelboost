import type { PaymentResource } from '@/api/model';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';

function PaymentCard({ payment }: { payment: PaymentResource }) {
  const paymentType = useMemo(() => {
    if (payment.payable_type === 'wallet-topup') {
      return 'Wallet Top-up';
    }
    // Add more types as needed
    return 'Unknown Payment Type';
  }, [payment.payable_type]);

  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>{payment.amount}</ItemTitle>
        <ItemDescription>{paymentType}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          size="icon-sm"
          variant="outline"
          className="rounded-full"
          aria-label="Invite"
        >
          <Plus />
        </Button>
      </ItemActions>
    </Item>
  );
}

export default function Payments({
  payments,
}: {
  payments: PaymentResource[];
}) {
  return (
    <DashboardLayout
      activeMenuIds={['wallet.transactions']}
      openMenuIds={['wallet']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Wallet' },
        { title: 'Wallet Transactions' },
      ]}
    >
      <Head title="Wallet Transactions" />
      <div className="max-w-4xl grid gap-8 p-4 mx-auto">
        <section className="grid gap-2">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}

// Helper function
export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
