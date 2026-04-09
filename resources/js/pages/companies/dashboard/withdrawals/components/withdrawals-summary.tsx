import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import type { WithdrawalsPageProps } from '..';

export default function WithdrawalsSummary() {
  const { stats } = usePageProps<WithdrawalsPageProps>();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Withdrawals</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.total_withdrawals}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Transactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold text-destructive">
            {formatIDR(stats.total_amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Withdrawn</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-primary">
            {formatIDR(stats.completed_amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Paid</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatIDR(stats.pending_amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting</p>
        </CardContent>
      </Card>
    </div>
  );
}
