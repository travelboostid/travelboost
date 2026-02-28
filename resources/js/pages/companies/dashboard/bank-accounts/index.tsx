'use client';

import type { BankAccountResource } from '@/api/model';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import CreateBankAccountDialog from './create-bank-account-dialog';
import DeleteBankAccountDialog from './delete-bank-account-dialog';
import { EmptyBankAccounts } from './empty-bank-accounts';
import UpdateBankAccountDialog from './update-bank-account-dialog';
dayjs.extend(relativeTime);

function BankAccountCard({ account }: { account: BankAccountResource }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      verified: 'Verified',
      pending: 'Pending',
      rejected: 'Rejected',
    };
    return labels[status as keyof typeof labels] || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
    }
  };

  return (
    <Card
      key={account.id}
      className="border-0 shadow-md hover:shadow-lg transition-shadow"
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Account Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-foreground">
                {account.provider}
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background">
                {getStatusIcon(account.status)}
                <span
                  className={`text-xs font-medium ${getStatusColor(account.status)} px-2 py-0.5 rounded-full`}
                >
                  {getStatusLabel(account.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Account Holder
                </p>
                <p className="font-medium text-foreground">
                  {account.account_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Account Number
                </p>
                <p className="font-medium text-foreground capitalize">
                  {account.account_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Branch</p>
                <p className="font-medium text-foreground font-mono">
                  {account.branch || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Date Created
                </p>
                <p className="font-medium text-foreground font-mono">
                  {dayjs(account.created_at).fromNow()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {account.status === 'approved' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-muted-foreground"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            ) : (
              <UpdateBankAccountDialog bankAccount={account}>
                <Button variant="ghost" size="sm">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </UpdateBankAccountDialog>
            )}
            <DeleteBankAccountDialog bankAccount={account}>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
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
    <CompanyDashboardLayout
      openMenuIds={['funds']}
      activeMenuIds={[`funds.bank-accounts`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Funds' },
        { title: 'Bank Accounts' },
      ]}
      applet={
        <CreateBankAccountDialog>
          <Button>
            <PlusIcon /> Add Bank Account
          </Button>
        </CreateBankAccountDialog>
      }
    >
      <div className="p-4 grid gap-4">
        {/* Accounts List */}
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
    </CompanyDashboardLayout>
  );
}
