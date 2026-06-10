import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { JSX } from 'react';
import { FormattedMessage } from 'react-intl';

export default function StatusBadge({ partnership }: { partnership: any }) {
    const status = partnership.status || 'unknown';

    const statusConfig: Record<
        string,
        { label: JSX.Element; className: string }
    > = {
        pending: {
            label: <FormattedMessage defaultMessage="Pending" />,
            className:
                'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
        },
        active: {
            label: <FormattedMessage defaultMessage="Active" />,
            className:
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
        },
        rejected: {
            label: <FormattedMessage defaultMessage="Rejected" />,
            className:
                'border-destructive/30 bg-destructive/10 text-destructive',
        },
        suspended: {
            label: <FormattedMessage defaultMessage="Suspended" />,
            className: 'border-border bg-muted text-muted-foreground',
        },
    };

    const config = statusConfig[status] ?? {
        label: <FormattedMessage defaultMessage="Unknown" />,
        className: 'border-border bg-muted text-muted-foreground',
    };

    return (
        <Badge variant="outline" className={cn('capitalize', config.className)}>
            {config.label}
        </Badge>
    );
}
