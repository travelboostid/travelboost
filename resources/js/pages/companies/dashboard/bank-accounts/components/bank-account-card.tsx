import type { BankAccountResource } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    Building2Icon,
    CheckCircle2Icon,
    Clock3Icon,
    PencilIcon,
    StarIcon,
    Trash2Icon,
    XCircleIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { BankAccountsPageProps } from '..';
import DeleteBankAccountDialog from './delete-bank-account-dialog';
import UpdateBankAccountDialog from './update-bank-account-dialog';

dayjs.extend(relativeTime);

type BankAccountCardProps = {
    account: BankAccountResource;
};

function statusConfig(status: string) {
    switch (status) {
        case 'verified':
            return {
                label: 'Verified',
                icon: CheckCircle2Icon,
                className:
                    'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
            };
        case 'rejected':
            return {
                label: 'Rejected',
                icon: XCircleIcon,
                className:
                    'border-destructive/30 bg-destructive/5 text-destructive',
            };
        default:
            return {
                label: 'Pending verification',
                icon: Clock3Icon,
                className:
                    'border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300',
            };
    }
}

export default function BankAccountCard({ account }: BankAccountCardProps) {
    const { bankAccountProviders } = usePageProps<BankAccountsPageProps>();
    const bankName =
        bankAccountProviders.find(
            (provider) => provider.code === account.provider,
        )?.name || account.provider;
    const status = statusConfig(String(account.status));
    const StatusIcon = status.icon;
    const canEdit = account.status !== 'verified';

    return (
        <Card className="overflow-hidden border shadow-sm">
            <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Building2Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-semibold text-foreground">
                                    {bankName}
                                </h3>
                                {account.is_default ? (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        <StarIcon className="size-3 fill-current" />
                                        <FormattedMessage defaultMessage="Default" />
                                    </Badge>
                                ) : null}
                            </div>
                            <p className="mt-1 font-mono text-sm text-muted-foreground">
                                {account.account_number}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn('shrink-0 gap-1', status.className)}
                    >
                        <StatusIcon className="size-3" />
                        {status.label}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground">
                            <FormattedMessage defaultMessage="Account holder" />
                        </p>
                        <p className="mt-0.5 font-medium text-foreground">
                            {account.account_name}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                        <p className="text-xs text-muted-foreground">
                            <FormattedMessage defaultMessage="Branch" />
                        </p>
                        <p className="mt-0.5 font-medium text-foreground">
                            {account.branch || '—'}
                        </p>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    <FormattedMessage
                        defaultMessage="Added {time}"
                        values={{
                            time: dayjs(account.created_at).fromNow(),
                        }}
                    />
                </p>
            </CardContent>

            <CardFooter className="flex gap-2 border-t bg-muted/10 px-5 py-3">
                {canEdit ? (
                    <UpdateBankAccountDialog bankAccount={account}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <PencilIcon className="size-3.5" />
                            <FormattedMessage defaultMessage="Edit" />
                        </Button>
                    </UpdateBankAccountDialog>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled
                    >
                        <PencilIcon className="size-3.5" />
                        <FormattedMessage defaultMessage="Verified" />
                    </Button>
                )}
                <DeleteBankAccountDialog bankAccount={account}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto gap-1.5 text-destructive hover:text-destructive"
                    >
                        <Trash2Icon className="size-3.5" />
                        <FormattedMessage defaultMessage="Delete" />
                    </Button>
                </DeleteBankAccountDialog>
            </CardFooter>
        </Card>
    );
}
