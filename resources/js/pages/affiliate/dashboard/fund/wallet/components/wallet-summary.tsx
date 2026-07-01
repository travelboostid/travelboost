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
import usePageProps from '@/hooks/use-page-props';
import { formatIDRFull } from '@/lib/utils';
import {
    IconPercentage0,
    IconTrendingDown,
    IconTrendingUp,
} from '@tabler/icons-react';
import { Repeat2 } from 'lucide-react';
import type { WalletPageProps } from '../index';
import { WithdrawDialog } from './withdraw-dialog';

export default function WalletSummary() {
    const { balance, income, expenses, net_change } =
        usePageProps<WalletPageProps>();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card flex flex-col justify-between">
                <CardHeader className="flex-1 pb-2">
                    <CardDescription className="flex-none text-sm">
                        Total Balance
                    </CardDescription>
                    <CardTitle className="text-3xl font-semibold tabular-nums mt-1">
                        {formatIDRFull(balance)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="bg-white">
                            {net_change.growth_pct === 0 && (
                                <IconPercentage0 className="w-3.5 h-3.5 mr-1" />
                            )}
                            {net_change.growth_pct > 0 && (
                                <IconTrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            )}
                            {net_change.growth_pct < 0 && (
                                <IconTrendingDown className="w-3.5 h-3.5 mr-1 text-rose-600" />
                            )}
                            {net_change.growth_pct}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="pt-0">
                    <WithdrawDialog>
                        <Button
                            variant="outline"
                            className="w-full gap-2 bg-transparent border-slate-200"
                        >
                            <Repeat2 className="w-4 h-4" />
                            Withdraw
                        </Button>
                    </WithdrawDialog>
                </CardFooter>
            </Card>

            <Card className="shadow-xs dark:bg-card border-slate-200">
                <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">
                        Income This Month
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                        +{formatIDRFull(income.this_month)}
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-xs dark:bg-card border-slate-200">
                <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">
                        Expenses This Month
                    </p>
                    <p className="text-2xl font-bold text-rose-600">
                        -{formatIDRFull(expenses.this_month)}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
