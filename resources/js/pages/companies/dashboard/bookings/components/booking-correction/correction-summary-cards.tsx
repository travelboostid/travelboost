import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type CorrectionSummaryCardsProps = {
    counts: {
        cancellations: number;
        refunds: number;
        reschedules: number;
        restores: number;
        total: number;
    };
    canReviewRequests: boolean;
};

const summaryItems = [
    {
        key: 'cancellations',
        labelId: 'companies.dashboard.bookingCorrection.summary.cancellations',
        defaultLabel: 'Cancellations',
    },
    {
        key: 'refunds',
        labelId: 'companies.dashboard.bookingCorrection.summary.refunds',
        defaultLabel: 'Refunds',
    },
    {
        key: 'reschedules',
        labelId: 'companies.dashboard.bookingCorrection.summary.reschedules',
        defaultLabel: 'Reschedules',
    },
    {
        key: 'restores',
        labelId: 'companies.dashboard.bookingCorrection.summary.reactivations',
        defaultLabel: 'Reactivations',
    },
] as const;

export default function CorrectionSummaryCards({
    counts,
    canReviewRequests,
}: CorrectionSummaryCardsProps) {
    if (!canReviewRequests || counts.total === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        <FormattedMessage
                            id="companies.dashboard.bookingCorrection.summary.title"
                            defaultMessage="{count} pending request(s)"
                            values={{ count: counts.total }}
                        />
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <FormattedMessage
                            id="companies.dashboard.bookingCorrection.summary.subtitle"
                            defaultMessage="Review and approve agent correction requests."
                        />
                    </p>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {summaryItems.map((item) => (
                    <div
                        key={item.key}
                        className="rounded-lg border bg-muted/30 px-3 py-2"
                    >
                        <p className="text-[0.68rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            <FormattedMessage
                                id={item.labelId}
                                defaultMessage={item.defaultLabel}
                            />
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            {counts[item.key]}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function actionBadgeClassName(action: string) {
    return cn(
        'capitalize',
        action === 'cancel' &&
            'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
        action === 'refund' &&
            'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300',
        action === 'reschedule' &&
            'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
        action === 'restore' &&
            'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    );
}

export type TabDefinition = {
    value: string;
    id: string;
    defaultMessage: string;
    countKey: keyof CorrectionSummaryCardsProps['counts'];
    icon: LucideIcon;
};
