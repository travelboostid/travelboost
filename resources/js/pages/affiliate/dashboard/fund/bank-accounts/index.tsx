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
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
    }
  };

  return (
    <Card
      className={`border-border shadow-sm transition-all hover:shadow-md ${account.is_default ? 'ring-2 ring-primary/30' : ''}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {account.provider}
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border">
                {getStatusIcon(account.status)}
                <span
                  className={`text-xs font-semibold capitalize ${getStatusColor(account.status)} px-2 py-0.5 rounded-full`}
                >
                  {account.status}
                </span>
              </div>
              {account.is_default && (
                <span className="text-xs font-bold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                  Default
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Account Holder
                </p>
                <p className="font-semibold text-foreground">
                  {account.account_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Account Number
                </p>
                <p className="font-semibold text-foreground">
                  {account.account_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Branch</p>
                <p className="font-semibold text-foreground">
                  {account.branch || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date Added</p>
                <p className="font-medium text-foreground/80">
                  {dayjs(account.created_at).fromNow()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {account.status === 'verified' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-muted-foreground/50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            ) : (
              <UpdateBankAccountDialog bankAccount={account}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </UpdateBankAccountDialog>
            )}
            <DeleteBankAccountDialog bankAccount={account}>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
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
    >
      <Head title="Bank Accounts" />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bank Accounts
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage bank accounts for your commission withdrawals.
            </p>
          </div>
          <CreateBankAccountDialog>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <PlusIcon className="w-4 h-4 mr-2" /> Add Bank Account
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
