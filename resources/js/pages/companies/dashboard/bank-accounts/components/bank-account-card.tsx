'use client';

import type { BankAccountResource } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Edit2, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import type { BankAccountsPageProps } from '..';
import DeleteBankAccountDialog from './delete-bank-account-dialog';
import UpdateBankAccountDialog from './update-bank-account-dialog';
dayjs.extend(relativeTime);

type BankAccountCardProps = {
    account: BankAccountResource;
};

export default function BankAccountCard({ account }: BankAccountCardProps) {
    const { bankAccountProviders } = usePageProps<BankAccountsPageProps>();
    const bankName =
        bankAccountProviders.find(
            (provider) => provider.code === account.provider,
        )?.name || account.provider;
    const statusBadge = useMemo(() => {
        const components = {
            pending: (
                <Badge
                    variant="ghost"
                    className="text-sm bg-orange-100 text-orange-700"
                >
                    Unverified
                </Badge>
            ),
            verified: (
                <Badge
                    variant="ghost"
                    className="text-sm bg-blue-100 text-blue-700"
                >
                    Verified
                </Badge>
            ),
            rejected: (
                <Badge
                    variant="ghost"
                    className="text-sm bg-destructive/10 text-destructive"
                >
                    Rejected
                </Badge>
            ),
            unknown: (
                <Badge
                    variant="ghost"
                    className="text-sm bg-muted/10 text-muted-foreground"
                >
                    Unknown
                </Badge>
            ),
        };
        return (
            components[account.status as keyof typeof components] ||
            components['unknown']
        );
    }, [account.status]);

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
                                {bankName}
                            </h3>
                            {statusBadge}
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
                                <p className="text-xs text-muted-foreground mb-1">
                                    Branch
                                </p>
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
