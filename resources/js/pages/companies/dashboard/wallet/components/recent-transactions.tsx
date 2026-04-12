import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { formatIDR } from '@/lib/utils';
import { index } from '@/routes/company/wallet-transaction';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowDownLeft, ArrowRightIcon, ArrowUpRight } from 'lucide-react';
import type { WalletPageProps } from '..';
import EmptyRecentTransactions from './empty-recent-transactions';
dayjs.extend(relativeTime);

function TransactionItem({ transaction }: any) {
  const Icon = transaction.amount > 0 ? ArrowUpRight : ArrowDownLeft;
  const isIncome = transaction.amount > 0;

  return (
    <div
      key={transaction.id}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${isIncome ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {transaction.meta?.description || '-'}
          </p>
          <p className="text-xs text-muted-foreground">
            {dayjs(transaction.created_at).fromNow()}
          </p>
        </div>
      </div>
      <p
        className={`font-semibold text-sm ${isIncome ? 'text-primary' : 'text-destructive'}`}
      >
        {isIncome ? '+' : '-'}
        {formatIDR(Math.abs(transaction.amount))}
      </p>
    </div>
  );
}

export default function RecentTransactions() {
  const { company } = usePageSharedDataProps();
  const { transactions } = usePageProps<WalletPageProps>();

  return (
    <Card className="bg-linear-to-t from-secondary/5 to-card shadow-xs dark:bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length === 0 && <EmptyRecentTransactions />}
          {transactions.map((trx: any) => (
            <TransactionItem transaction={trx} />
          ))}
        </div>

        <Link href={index({ company: company.username })}>
          {' '}
          {/* Assuming this route exists */}
          <Button variant="outline" className="w-full mt-4">
            See More Transactions <ArrowRightIcon />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
