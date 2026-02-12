import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Head, Link } from '@inertiajs/react';
import {
  IconPercentage0,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ArrowDownLeft,
  ArrowRightIcon,
  ArrowUpRight,
  Plus,
  Repeat2,
  Send,
} from 'lucide-react';
import PendingTopup from './pending-topup';
import { TopupDialog } from './topup-dialog';
import { WithdrawDialog } from './withdraw-dialog';
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

export default function WalletPage({
  balance,
  income,
  expenses,
  net_change,
  transactions,
}: any) {
  return (
    <DashboardLayout
      activeMenuIds={[`funds.wallets`]}
      openMenuIds={['funds']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Wallet' },
      ]}
    >
      <Head title="My Wallet" />
      <div className="max-w-6xl mx-auto grid gap-4 p-4">
        {/* Balance and Summary Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2 row-span-2 bg-linear-to-t from-primary/5 to-card flex flex-col pb-0">
            <CardHeader className="flex-1">
              <CardDescription className="flex-none">
                Total Balance
              </CardDescription>
              <CardTitle className="text-4xl font-semibold tabular-nums">
                {formatIDR(balance)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {net_change.growth_pct === 0 && <IconPercentage0 />}
                  {net_change.growth_pct > 0 && <IconTrendingUp />}
                  {net_change.growth_pct < 0 && <IconTrendingDown />}
                  {net_change.growth_pct}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="mb-6 flex gap-3 flex-wrap">
              <TopupDialog>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground flex-1 min-w-32">
                  <Plus className="w-4 h-4" />
                  Topup
                </Button>
              </TopupDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 flex-1 min-w-32 bg-transparent"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This feature currently unavailable. Cooming soon!</p>
                </TooltipContent>
              </Tooltip>
              <WithdrawDialog>
                <Button
                  variant="outline"
                  className="gap-2 flex-1 min-w-32 bg-transparent"
                >
                  <Repeat2 className="w-4 h-4" />
                  Withdraw
                </Button>
              </WithdrawDialog>
            </CardFooter>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent>
              <p className="text-xs text-muted-foreground mb-1">
                Income This Month
              </p>
              <p className="text-2xl font-bold text-primary">
                +{formatIDR(income.this_month)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent>
              <p className="text-xs text-muted-foreground mb-1">
                Expenses This Month
              </p>
              <p className="text-2xl font-bold text-destructive">
                -{formatIDR(expenses.this_month)}
              </p>
            </CardContent>
          </Card>
        </div>

        <PendingTopup />

        {/* Recent Transactions Card */}
        <Card className="border-0 shadow">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((trx: any) => (
                <TransactionItem transaction={trx} />
              ))}
            </div>

            <Link href="/dashboard/funds/wallet-transactions">
              <Button variant="outline" className="w-full mt-4">
                See More Transactions <ArrowRightIcon />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
