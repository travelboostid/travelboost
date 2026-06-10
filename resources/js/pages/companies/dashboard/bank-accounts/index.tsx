import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { LandmarkIcon, PlusIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import BankAccountCard from './components/bank-account-card';
import CreateBankAccountDialog from './components/create-bank-account-dialog';
import { EmptyBankAccounts } from './components/empty-bank-accounts';

export type BankAccountsPageProps = {
    bankAccounts: Array<Record<string, unknown>>;
    bankAccountProviders: { code: string; name: string }[];
};

export default function BankAccountsPage({
    bankAccounts,
}: BankAccountsPageProps) {
    const verifiedCount = bankAccounts.filter(
        (account) => account.status === 'verified',
    ).length;

    return (
        <CompanyDashboardLayout
            openMenuIds={['funds']}
            activeMenuIds={['funds.bank-accounts']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Bank Accounts' }]}
        >
            <Head title="Bank Accounts" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <LandmarkIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Bank accounts" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="{count} accounts · {verified} verified"
                                    values={{
                                        count: bankAccounts.length,
                                        verified: verifiedCount,
                                    }}
                                />
                            </p>
                        </div>
                    </div>

                    <CreateBankAccountDialog>
                        <Button size="lg" className="w-full gap-2 sm:w-auto">
                            <PlusIcon className="size-4" />
                            <FormattedMessage defaultMessage="Add account" />
                        </Button>
                    </CreateBankAccountDialog>
                </header>

                {bankAccounts.length === 0 ? (
                    <EmptyBankAccounts />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {bankAccounts.map((account) => (
                            <BankAccountCard
                                account={account as never}
                                key={String(account.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
