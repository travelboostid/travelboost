'use client';

import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import BankAccountCard from './components/bank-account-card';
import CreateBankAccountDialog from './components/create-bank-account-dialog';
import { EmptyBankAccounts } from './components/empty-bank-accounts';

export type BankAccountsPageProps = {
    bankAccounts: any[];
    bankAccountProviders: { code: string; name: string }[];
};

export default function BankAccountsPage({ bankAccounts }: any) {
    return (
        <CompanyDashboardLayout
            openMenuIds={['funds']}
            activeMenuIds={[`funds.bank-accounts`]}
            breadcrumb={[{ title: 'Funds' }, { title: 'Bank Accounts' }]}
            applet={
                <CreateBankAccountDialog>
                    <Button>
                        <PlusIcon /> Add Bank Account
                    </Button>
                </CreateBankAccountDialog>
            }
        >
            <Head title="Bank Accounts" />
            <div className="p-4 grid gap-4">
                {/* Accounts List */}
                {bankAccounts.length === 0 ? (
                    <EmptyBankAccounts />
                ) : (
                    <div className="space-y-4">
                        {bankAccounts.map((account: any) => (
                            <BankAccountCard
                                account={account}
                                key={account.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
