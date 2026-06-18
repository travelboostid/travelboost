import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { formatIDR } from '@/lib/utils';
import { index as paymentsIndex } from '@/routes/companies/dashboard/payments';
import { Link } from '@inertiajs/react';
import {
    ExternalLinkIcon,
    MegaphoneIcon,
    PlusIcon,
    WalletIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { PromotionBudgetPageProps } from '..';
import { PromotionBudgetTopupDialog } from './promotion-budget-topup';

export default function PromotionBudgetSummary() {
    const { budget } = usePageProps<PromotionBudgetPageProps>();
    const { company } = usePageSharedDataProps();

    const balance = Number(budget?.balance ?? 0);

    return (
        <Card className="flex h-full flex-col overflow-hidden border-0 bg-linear-to-br from-orange-500/10 via-card to-card shadow-sm ring-1 ring-orange-500/10">
            <CardHeader className="flex-1 space-y-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                    <Badge variant="secondary" className="gap-1">
                        <WalletIcon className="size-3.5" />
                        <FormattedMessage defaultMessage="Promotion budget" />
                    </Badge>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                            <MegaphoneIcon className="size-5" />
                        </div>
                        <div>
                            <CardDescription className="text-xs font-medium tracking-wide uppercase">
                                <FormattedMessage defaultMessage="Available budget" />
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                                {formatIDR(balance)}
                            </CardTitle>
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        <FormattedMessage defaultMessage="Top up a shared promotion budget for future Google and Meta campaigns. Ad platform connections are coming soon." />
                    </p>
                </div>
            </CardHeader>

            <CardFooter className="mt-auto flex flex-col gap-2 border-t border-orange-500/10 bg-background/40 pt-4 sm:flex-row">
                <PromotionBudgetTopupDialog>
                    <Button size="lg" className="h-11 w-full gap-2 sm:flex-1">
                        <PlusIcon className="size-4" />
                        <FormattedMessage defaultMessage="Top up budget" />
                    </Button>
                </PromotionBudgetTopupDialog>
                <Button
                    variant="outline"
                    size="lg"
                    className="h-11 w-full gap-2 bg-background/80 sm:flex-1"
                    asChild
                >
                    <Link
                        href={`${paymentsIndex({ company: company.username })}?type=promotion-budget-topup-payment`}
                    >
                        <FormattedMessage defaultMessage="Payment history" />
                        <ExternalLinkIcon className="size-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
