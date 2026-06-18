import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FormattedMessage } from 'react-intl';

type CampaignStatus = 'active' | 'paused' | 'ended' | 'failed' | string;

const statusStyles: Record<string, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
    paused: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
    ended: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400',
    failed: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
};

function statusLabel(status: CampaignStatus) {
    switch (status) {
        case 'active':
            return <FormattedMessage defaultMessage="Active" />;
        case 'paused':
            return <FormattedMessage defaultMessage="Paused" />;
        case 'ended':
            return <FormattedMessage defaultMessage="Ended" />;
        case 'failed':
            return <FormattedMessage defaultMessage="Failed" />;
        default:
            return status;
    }
}

export default function CampaignStatusBadge({
    status,
    className,
}: {
    status: CampaignStatus;
    className?: string;
}) {
    return (
        <Badge
            variant="outline"
            className={cn(
                statusStyles[status] ?? statusStyles.ended,
                className,
            )}
        >
            {statusLabel(status)}
        </Badge>
    );
}
