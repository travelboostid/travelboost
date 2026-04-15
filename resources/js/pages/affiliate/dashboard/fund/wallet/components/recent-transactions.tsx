import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { IconFolderCode } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowDownLeft, ArrowRightIcon, ArrowUpRight } from 'lucide-react';
import type { WalletPageProps } from '../index';

dayjs.extend(relativeTime);

function EmptyRecentTransactions() {
  return (
    <Empty className="p-4 border-none shadow-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Wallet Transactions</EmptyTitle>
        <EmptyDescription>
          You have not made any wallet transactions in the current period.
          Transactions will appear here once they are made.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function TransactionItem({ transaction }: any) {
  const isIncome = transaction.amount > 0;
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

  return (
    <div
      key={transaction.id}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {transaction.meta?.description || 'Wallet Transaction'}
          </p>
          <p className="text-xs text-muted-foreground">
            {dayjs(transaction.created_at).fromNow()}
          </p>
        </div>
      </div>
      <p
        className={`font-semibold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}
      >
        {isIncome ? '+' : '-'}
        {formatIDR(Math.abs(transaction.amount))}
      </p>
    </div>
  );
}

export default function RecentTransactions() {
  const { transactions } = usePageProps<WalletPageProps>();

  return (
    <Card className="bg-linear-to-t from-secondary/5 to-card shadow-xs dark:bg-card border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {transactions.length === 0 && <EmptyRecentTransactions />}
          {transactions.map((trx: any) => (
            <TransactionItem key={trx.id} transaction={trx} />
          ))}
        </div>

        <Link href="/affiliate/dashboard/fund/transactions">
          <Button variant="outline" className="w-full mt-4 bg-transparent">
            See More Transactions <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
