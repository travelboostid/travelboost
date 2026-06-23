import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export type ActionRequiredCounts = {
    cancellations: number;
    refunds: number;
    reschedules: number;
    restores: number;
    total: number;
};

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
    countKey: keyof Omit<ActionRequiredCounts, 'total'>;
    icon: LucideIcon;
};
