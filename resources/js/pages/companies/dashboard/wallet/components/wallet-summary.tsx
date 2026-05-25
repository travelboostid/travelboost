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
import { formatIDR } from '@/lib/utils';
import {
    IconPercentage0,
    IconTrendingDown,
    IconTrendingUp,
} from '@tabler/icons-react';
import { Plus, Repeat2 } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { WalletPageProps } from '..';
import { TopupDialog } from './topup-dialog';
import { WithdrawDialog } from './withdraw-dialog';

export default function WalletSummary() {
    const { balance, income, expenses, net_change } =
        usePageProps<WalletPageProps>();

    return (
        <div className="grid grid-cols-3 gap-4">
            <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
                <CardHeader className="flex-1">
                    <CardDescription className="flex-none">
                        <FormattedMessage defaultMessage="Total Balance" />
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
                <CardFooter className="flex gap-3 flex-wrap">
                    <TopupDialog>
                        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground flex-1 min-w-32">
                            <Plus className="w-4 h-4" />
                            <FormattedMessage defaultMessage="Topup" />
                        </Button>
                    </TopupDialog>
                    <WithdrawDialog>
                        <Button
                            variant="outline"
                            className="gap-2 flex-1 min-w-32 bg-transparent"
                        >
                            <Repeat2 className="w-4 h-4" />
                            <FormattedMessage defaultMessage="Withdraw" />
                        </Button>
                    </WithdrawDialog>
                </CardFooter>
            </Card>
            <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
                <CardContent>
                    <p className="text-xs text-muted-foreground mb-1">
                        <FormattedMessage defaultMessage="Income This Month" />
                    </p>
                    <p className="text-2xl font-bold text-primary">
                        +{formatIDR(income.this_month)}
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-linear-to-t from-destructive/5 to-card shadow-xs dark:bg-card">
                <CardContent>
                    <p className="text-xs text-muted-foreground mb-1">
                        <FormattedMessage defaultMessage="Expenses This Month" />
                    </p>
                    <p className="text-2xl font-bold text-destructive">
                        -{formatIDR(expenses.this_month)}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
