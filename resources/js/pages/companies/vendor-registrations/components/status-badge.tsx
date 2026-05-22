import { Badge } from '@/components/ui/badge';
import type { JSX } from 'react';
import { FormattedMessage } from 'react-intl';

export default function StatusBadge({ partnership }: { partnership: any }) {
    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        active: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        suspended: 'bg-gray-100 text-gray-800',
    };
    const statusMap: Record<string, JSX.Element> = {
        pending: <FormattedMessage defaultMessage="Pending" />,
        active: <FormattedMessage defaultMessage="Active" />,
        rejected: <FormattedMessage defaultMessage="Rejected" />,
        suspended: <FormattedMessage defaultMessage="Suspended" />,
    };
    const status = partnership.status || 'unknown';

    const colorClasses = statusColors[status] || 'bg-gray-100 text-gray-800';

    return (
        <Badge className={colorClasses}>
            {statusMap[status] || <FormattedMessage defaultMessage="Unknown" />}
        </Badge>
    );
}
