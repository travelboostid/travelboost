import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    waitingListStatusBadgeClass,
    waitingListStatusLabel,
} from '@/lib/waiting-list-status';

type WaitingListStatusBadgeProps = {
    status: string;
    className?: string;
};

export function WaitingListStatusBadge({
    status,
    className,
}: WaitingListStatusBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'capitalize tabular-nums',
                waitingListStatusBadgeClass(status),
                className,
            )}
        >
            {waitingListStatusLabel(status)}
        </Badge>
    );
}
