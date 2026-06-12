import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { WalletOption } from '@/components/wallet/wallet-selector-applet';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { formatIDR } from '@/lib/utils';
import { index as walletsIndex } from '@/routes/companies/dashboard/wallets';
import { Link } from '@inertiajs/react';
import { ArrowRightIcon, WalletIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type CurrentWalletCardProps = {
    wallet: WalletOption;
};

export default function CurrentWalletCard({ wallet }: CurrentWalletCardProps) {
    const { company } = usePageSharedDataProps();

    return (
        <Card className="overflow-hidden border-0 bg-linear-to-br from-primary/10 via-card to-card shadow-sm ring-1 ring-primary/10">
            <CardHeader className="space-y-4 pb-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                            <WalletIcon className="size-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-lg font-semibold tracking-tight">
                                    {wallet.name}
                                </CardTitle>
                                {wallet.is_default ? (
                                    <Badge
                                        variant="outline"
                                        className="border-primary/30 bg-primary/5 text-primary"
                                    >
                                        <FormattedMessage defaultMessage="Default" />
                                    </Badge>
                                ) : null}
                            </div>
                            {wallet.description ? (
                                <CardDescription className="text-sm leading-relaxed">
                                    {wallet.description}
                                </CardDescription>
                            ) : (
                                <CardDescription className="text-sm">
                                    <FormattedMessage defaultMessage="Viewing activity for this wallet." />
                                </CardDescription>
                            )}
                            <p className="pt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                                {formatIDR(wallet.balance)}
                            </p>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                <FormattedMessage defaultMessage="Available balance" />
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0 gap-1.5 bg-background/80"
                    >
                        <Link
                            href={walletsIndex.url(
                                { company: company.username },
                                { query: { wallet: wallet.slug } },
                            )}
                        >
                            <FormattedMessage defaultMessage="Wallet overview" />
                            <ArrowRightIcon className="size-4" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="border-t border-primary/10 bg-background/40 pt-4 pb-4">
                <p className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Income, expenses, and transfers below are scoped to this wallet only." />
                </p>
            </CardContent>
        </Card>
    );
}
