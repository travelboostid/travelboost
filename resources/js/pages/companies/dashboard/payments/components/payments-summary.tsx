import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import { useMemo } from 'react';
import type { PaymentsPageProps } from '..';

// Simplified summary cards with theme colors
export default function PaymentsSummary() {
  const { payments } = usePageProps<PaymentsPageProps>();
  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter((p) => p.status === 'completed').length;
    const pending = payments.filter((p) => p.status === 'pending').length;
    return { total, completed, pending };
  }, [payments]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-primary">
            {formatIDR(stats.total)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {payments.length} transactions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-primary">{stats.completed}</p>
          <p className="text-xs text-muted-foreground mt-1">Payments</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {formatIDR(payments.length ? stats.total / payments.length : 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
        </CardContent>
      </Card>
    </div>
  );
}
