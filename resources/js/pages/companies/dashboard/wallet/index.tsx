import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import WalletSelectorApplet, {
    type WalletOption,
} from '@/components/wallet/wallet-selector-applet';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { index as walletsIndex } from '@/routes/companies/dashboard/wallets';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { WalletIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import PendingTopup from './components/pending-topup';
import RecentTransactions from './components/recent-transactions';
import WalletSummary from './components/wallet-summary';

dayjs.extend(relativeTime);

export type WalletPageProps = {
    balance: number;
    income: {
        this_month: number;
        last_month: number;
        growth_pct?: number;
    };
    expenses: {
        this_month: number;
        last_month: number;
        growth_pct?: number;
    };
    net_change: {
        this_month: number;
        last_month: number;
        growth_pct: number;
    };
    transactions: Array<{
        id: number;
        type: string;
        amount: number;
        confirmed: boolean;
        meta?: { description?: string };
        created_at: string;
    }>;
    wallet: WalletOption;
    wallets: WalletOption[];
    pendingTopup: Record<string, unknown> | null;
};

export default function WalletPage() {
    const { company } = usePageSharedDataProps();
    const { wallet, wallets } = usePageProps<WalletPageProps>();

    return (
        <CompanyDashboardLayout
            activeMenuIds={['funds.wallets']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Wallet' }]}
            applet={
                <WalletSelectorApplet
                    wallets={wallets}
                    selectedSlug={wallet.slug}
                    href={walletsIndex({ company: company.username })}
                />
            }
        >
            <Head title="Wallet" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <WalletIcon className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    <FormattedMessage defaultMessage="Wallet" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage defaultMessage="Manage your balance, top up funds, and track recent activity." />
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <PendingTopup />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] xl:items-start">
                    <WalletSummary />
                    <RecentTransactions />
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
