import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';
import { show as budgetIndex } from '@/routes/companies/dashboard/marketing/budget';
import { Link } from '@inertiajs/react';
import {
    MegaphoneIcon,
    PlusIcon,
    TrendingUpIcon,
    WalletIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type CampaignBudgetHighlightProps = {
    companyUsername: string;
    budgetBalance: number;
    activeCampaignCount: number;
    totalSpend: number;
};

export default function CampaignBudgetHighlight({
    companyUsername,
    budgetBalance,
    activeCampaignCount,
    totalSpend,
}: CampaignBudgetHighlightProps) {
    const isLowBalance = budgetBalance > 0 && budgetBalance < 100_000;

    return (
        <Card className="overflow-hidden border-0 bg-linear-to-br from-primary/10 via-card to-card shadow-sm ring-1 ring-primary/10">
            <CardHeader className="space-y-4 pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Badge variant="secondary" className="gap-1">
                        <WalletIcon className="size-3.5" />
                        <FormattedMessage defaultMessage="Promotion budget" />
                    </Badge>
                    {isLowBalance ? (
                        <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                        >
                            <FormattedMessage defaultMessage="Low balance" />
                        </Badge>
                    ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 sm:col-span-1">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                            <MegaphoneIcon className="size-5" />
                        </div>
                        <div>
                            <CardDescription className="text-xs font-medium tracking-wide uppercase">
                                <FormattedMessage defaultMessage="Available" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                                {formatIDR(budgetBalance)}
                            </CardTitle>
                        </div>
                    </div>

                    <div className="rounded-xl border border-primary/10 bg-background/50 p-4">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            <FormattedMessage defaultMessage="Active campaigns" />
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums">
                            {activeCampaignCount}
                        </p>
                    </div>

                    <div className="rounded-xl border border-primary/10 bg-background/50 p-4">
                        <p className="flex items-center gap-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            <TrendingUpIcon className="size-3.5" />
                            <FormattedMessage defaultMessage="Total spent" />
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums">
                            {formatIDR(totalSpend)}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardFooter className="border-t border-primary/10 bg-background/40 pt-4">
                <Button
                    variant="outline"
                    className="gap-2 bg-background/80"
                    asChild
                >
                    <Link href={budgetIndex(companyUsername).url}>
                        <PlusIcon className="size-4" />
                        <FormattedMessage defaultMessage="Top up budget" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
