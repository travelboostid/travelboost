import { formatIDR } from '@/constants/booking';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    CalendarClockIcon,
    CreditCardIcon,
    FileCheckIcon,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import type { FollowupSummary, PageProps } from '../booking-index-types';

export function FollowupSummarySkeleton() {
    return (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="h-[4.25rem] animate-pulse rounded-md border border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/60"
                />
            ))}
        </div>
    );
}

function FollowupSummaryCards({
    summary,
    companyUsername,
}: {
    summary: FollowupSummary;
    companyUsername: string;
}) {
    const intl = useIntl();
    const activeFollowup =
        typeof window === 'undefined'
            ? ''
            : (new URLSearchParams(window.location.search).get('followup') ??
              '');

    const applyFollowupFilter = (followup: string) => {
        const params = new URLSearchParams(window.location.search);
        params.delete('page');
        params.delete('status');

        if (activeFollowup === followup) {
            params.delete('followup');
        } else {
            params.set('followup', followup);
        }

        const query = params.toString();
        router.get(
            `/companies/${companyUsername}/dashboard/bookings${query ? `?${query}` : ''}`,
            {},
            {
                preserveState: true,
            },
        );
    };

    const items = [
        {
            label: intl.formatMessage({ defaultMessage: 'Payment overdue' }),
            value: summary.payment_overdue,
            amount: summary.payment_overdue_amount,
            followup: 'payment_overdue',
            icon: AlertTriangleIcon,
            className:
                'border-red-100 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300',
        },
        {
            label: intl.formatMessage({ defaultMessage: 'Payment due soon' }),
            value: summary.payment_due_soon,
            amount: summary.payment_due_soon_amount,
            followup: 'payment_due_soon',
            icon: CreditCardIcon,
            className:
                'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
        },
        {
            label: intl.formatMessage({ defaultMessage: 'Docs incomplete' }),
            value: summary.documents_incomplete,
            amount: null,
            followup: 'documents_incomplete',
            icon: FileCheckIcon,
            className:
                'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200',
        },
        {
            label: intl.formatMessage({ defaultMessage: 'Docs due soon' }),
            value: summary.documents_due_soon,
            amount: null,
            followup: 'documents_due_soon',
            icon: CalendarClockIcon,
            className:
                'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300',
        },
    ];

    return (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeFollowup === item.followup;

                return (
                    <button
                        type="button"
                        key={item.label}
                        onClick={() => applyFollowupFilter(item.followup)}
                        className={cn(
                            'flex items-center justify-between rounded-md border px-2.5 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:shadow-none',
                            item.className,
                            isActive &&
                                'ring-2 ring-primary/35 ring-offset-1 ring-offset-background',
                        )}
                    >
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider">
                                {item.label}
                            </p>
                            <p className="mt-0.5 text-lg font-bold tabular-nums">
                                {item.value}
                            </p>
                            {item.amount !== null && item.amount > 0 && (
                                <p className="mt-0.5 text-[10px] font-semibold tabular-nums opacity-85">
                                    {formatIDR(item.amount)}
                                </p>
                            )}
                        </div>
                        <Icon className="size-4 opacity-80" />
                    </button>
                );
            })}
        </div>
    );
}

export function BookingIndexFollowupSummary() {
    const { followupSummary } = usePage<PageProps>().props;
    const { company } = usePageSharedDataProps();

    if (!followupSummary) {
        return null;
    }

    return (
        <FollowupSummaryCards
            summary={followupSummary}
            companyUsername={company.username}
        />
    );
}
