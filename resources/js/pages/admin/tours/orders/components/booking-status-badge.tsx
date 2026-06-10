import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
    reserved:
        'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    'booking reserved':
        'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    'manual reserved':
        'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    'awaiting payment':
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'waiting payment approval':
        'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    'down payment':
        'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    'full payment':
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'waiting list':
        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    refunded:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    expired: 'bg-muted text-muted-foreground',
};

export function BookingStatusBadge({ status }: { status: string }) {
    const normalized = status?.toLowerCase() ?? '';

    return (
        <Badge
            variant="outline"
            className={cn(
                'border-transparent capitalize',
                STATUS_STYLES[normalized] ?? 'bg-muted text-muted-foreground',
            )}
        >
            {status}
        </Badge>
    );
}
