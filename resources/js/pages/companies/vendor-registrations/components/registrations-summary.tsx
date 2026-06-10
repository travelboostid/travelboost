import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    BanIcon,
    Building2Icon,
    CheckCircle2Icon,
    Clock3Icon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type RegistrationsSummaryProps = {
    total: number;
    pending: number;
    active: number;
    rejected: number;
    suspended: number;
};

function StatCard({
    label,
    value,
    tone,
    icon: Icon,
}: {
    label: React.ReactNode;
    value: number;
    tone: 'default' | 'pending' | 'active' | 'rejected' | 'muted';
    icon: typeof Building2Icon;
}) {
    return (
        <Card className="overflow-hidden border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-5">
                <div
                    className={cn(
                        'flex size-9 items-center justify-center rounded-xl',
                        tone === 'active' &&
                            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                        tone === 'pending' &&
                            'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                        tone === 'rejected' &&
                            'bg-destructive/10 text-destructive',
                        tone === 'default' && 'bg-primary/10 text-primary',
                        tone === 'muted' && 'bg-muted text-muted-foreground',
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

export default function RegistrationsSummary({
    total,
    pending,
    active,
    rejected,
    suspended,
}: RegistrationsSummaryProps) {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
                label={<FormattedMessage defaultMessage="Total" />}
                value={total}
                tone="default"
                icon={Building2Icon}
            />
            <StatCard
                label={<FormattedMessage defaultMessage="Pending" />}
                value={pending}
                tone="pending"
                icon={Clock3Icon}
            />
            <StatCard
                label={<FormattedMessage defaultMessage="Active" />}
                value={active}
                tone="active"
                icon={CheckCircle2Icon}
            />
            <StatCard
                label={<FormattedMessage defaultMessage="Rejected" />}
                value={rejected}
                tone="rejected"
                icon={BanIcon}
            />
            <StatCard
                label={<FormattedMessage defaultMessage="Suspended" />}
                value={suspended}
                tone="muted"
                icon={BanIcon}
            />
        </div>
    );
}
