import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  CheckCircle,
  Clock,
  Edit2,
  PlusIcon,
  Trash2,
  XCircle,
} from 'lucide-react';
import CreateBankAccountDialog from './components/create-bank-account-dialog';
import DeleteBankAccountDialog from './components/delete-bank-account-dialog';
import { EmptyBankAccounts } from './components/empty-bank-accounts';
import UpdateBankAccountDialog from './components/update-bank-account-dialog';

dayjs.extend(relativeTime);

function BankAccountCard({ account }: { account: any }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-300';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
    }
  };

  return (
    <Card
      className={`border-border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800 ${account.is_default ? 'ring-2 ring-primary/30' : ''}`}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-foreground">
                {account.provider}
              </h3>
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800/70">
                {getStatusIcon(account.status)}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${getStatusColor(account.status)}`}
                >
                  {account.status}
                </span>
              </div>
              {account.is_default && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                  Default
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Account Holder
                </p>
                <p className="font-semibold text-foreground">
                  {account.account_name}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Account Number
                </p>
                <p className="font-semibold text-foreground">
                  {account.account_number}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Branch</p>
                <p className="font-semibold text-foreground">
                  {account.branch || '-'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Date Added</p>
                <p className="font-medium text-foreground/80">
                  {dayjs(account.created_at).fromNow()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 lg:justify-start">
            {account.status === 'verified' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-muted-foreground/50"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            ) : (
              <UpdateBankAccountDialog bankAccount={account}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </UpdateBankAccountDialog>
            )}
            <DeleteBankAccountDialog bankAccount={account}>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteBankAccountDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BankAccountsPage({ bank_accounts }: any) {
  return (
    <AffiliateDashboardLayout
      openMenuIds={['fund']}
      activeMenuIds={['fund.bank-accounts']}
      breadcrumb={[
        { title: 'Fund', url: '#' },
        {
          title: 'Bank Accounts',
          url: '/affiliate/dashboard/fund/bank-accounts',
        },
      ]}
      containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
    >
      <Head title="Bank Accounts" />
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bank Accounts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage bank accounts for your commission withdrawals.
            </p>
          </div>
          <CreateBankAccountDialog>
            <Button className="shadow-sm">
              <PlusIcon className="mr-2 h-4 w-4" /> Add Bank Account
            </Button>
          </CreateBankAccountDialog>
        </div>

        {bank_accounts.length === 0 ? (
          <EmptyBankAccounts />
        ) : (
          <div className="space-y-4">
            {bank_accounts.map((account: any) => (
              <BankAccountCard account={account} key={account.id} />
            ))}
          </div>
        )}
      </div>
    </AffiliateDashboardLayout>
  );
}
