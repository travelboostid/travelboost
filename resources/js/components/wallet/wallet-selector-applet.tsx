import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { formatIDR } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { WalletIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export type WalletOption = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    balance: number;
    is_default: boolean;
};

type WalletSelectorAppletProps = {
    wallets: WalletOption[];
    selectedSlug: string;
    href: string;
    queryParams?: Record<string, string>;
};

const DEFAULT_WALLET_SLUG = 'main';

function buildWalletQueryParams(
    slug: string,
    extra: Record<string, string> = {},
): Record<string, string> {
    const params = { ...extra };

    if (slug !== DEFAULT_WALLET_SLUG) {
        params.wallet = slug;
    }

    return params;
}

export default function WalletSelectorApplet({
    wallets,
    selectedSlug,
    href,
    queryParams = {},
}: WalletSelectorAppletProps) {
    const { company } = usePageSharedDataProps();

    if (wallets.length <= 1) {
        return null;
    }

    const handleWalletChange = (slug: string) => {
        if (slug === selectedSlug) {
            return;
        }

        router.get(href, buildWalletQueryParams(slug, queryParams), {
            preserveState: true,
            replace: true,
        });
    };

    const selectedWallet =
        wallets.find((wallet) => wallet.slug === selectedSlug) ?? wallets[0];

    return (
        <Select value={selectedSlug} onValueChange={handleWalletChange}>
            <SelectTrigger
                className="h-9 w-[min(100vw-8rem,14rem)] gap-2 border-dashed bg-background/80 px-2.5 text-xs shadow-none sm:w-52"
                aria-label={`${company.name} wallet`}
            >
                <WalletIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <SelectValue>
                    <span className="truncate font-medium">
                        {selectedWallet.name}
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
                {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.slug}>
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate font-medium">
                                {wallet.name}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {formatIDR(wallet.balance)}
                                {wallet.is_default ? (
                                    <>
                                        {' '}
                                        ·{' '}
                                        <FormattedMessage defaultMessage="Default" />
                                    </>
                                ) : null}
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export { buildWalletQueryParams, DEFAULT_WALLET_SLUG };
