import { Badge } from '@/components/ui/badge';
import { cn, formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    ArrowDownRightIcon,
    Building2Icon,
    CheckCircle2Icon,
    Clock3Icon,
    LandmarkIcon,
    XCircleIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import CancelWithdrawalDialog from './cancel-withdrawal-dialog';

dayjs.extend(relativeTime);

type Withdrawal = {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    wallet?: { name?: string } | null;
    bank_account?: {
        account_number?: string;
        provider?: string;
        account_name?: string;
    } | null;
};

function statusConfig(status: string) {
    switch (status) {
        case 'paid':
            return {
                label: 'Paid',
                icon: CheckCircle2Icon,
                className:
                    'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
            };
        case 'processing':
            return {
                label: 'Processing',
                icon: Clock3Icon,
                className:
                    'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300',
            };
        case 'rejected':
        case 'cancelled':
            return {
                label: status === 'rejected' ? 'Rejected' : 'Cancelled',
                icon: XCircleIcon,
                className:
                    'border-destructive/30 bg-destructive/5 text-destructive',
            };
        default:
            return {
                label: 'Pending',
                icon: Clock3Icon,
                className:
                    'border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300',
            };
    }
}

export default function WithdrawalCard({
    withdrawal,
}: {
    withdrawal: Withdrawal;
}) {
    const status = statusConfig(withdrawal.status);
    const StatusIcon = status.icon;
    const walletName = withdrawal.wallet?.name ?? 'Wallet';
    const accountNumber = withdrawal.bank_account?.account_number ?? '—';
    const provider = withdrawal.bank_account?.provider ?? '';

    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-background/60 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <ArrowDownRightIcon className="size-4" />
                </div>
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold tabular-nums text-destructive">
                            {formatIDR(withdrawal.amount)}
                        </p>
                        <Badge
                            variant="outline"
                            className={cn('gap-1', status.className)}
                        >
                            <StatusIcon className="size-3" />
                            {status.label}
                        </Badge>
                    </div>
                    <p className="text-sm text-foreground">
                        <FormattedMessage
                            defaultMessage="{wallet} → {account}"
                            values={{
                                wallet: walletName,
                                account: accountNumber,
                            }}
                        />
                    </p>
                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <LandmarkIcon className="size-3" />
                        {provider}
                        {withdrawal.bank_account?.account_name ? (
                            <>
                                <span className="text-muted-foreground/50">
                                    ·
                                </span>
                                <Building2Icon className="size-3" />
                                {withdrawal.bank_account.account_name}
                            </>
                        ) : null}
                        <span className="text-muted-foreground/50">·</span>
                        {dayjs(withdrawal.created_at).format(
                            'DD MMM YYYY, HH:mm',
                        )}
                        <span className="text-muted-foreground/50">·</span>
                        {dayjs(withdrawal.created_at).fromNow()}
                    </p>
                </div>
            </div>

            {withdrawal.status === 'pending' ? (
                <div className="flex shrink-0 sm:justify-end">
                    <CancelWithdrawalDialog withdrawal={withdrawal} />
                </div>
            ) : null}
        </div>
    );
}
