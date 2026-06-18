import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

export type AnalyticsSetupBenefit = {
    icon: LucideIcon;
    title: ReactNode;
    description: ReactNode;
    iconClassName?: string;
};

type AnalyticsSetupLayoutProps = {
    currentStep: 1 | 2;
    icon: LucideIcon;
    iconClassName?: string;
    title: ReactNode;
    description: ReactNode;
    connectedAccountEmail?: string | null;
    connectedAccountLabel?: ReactNode;
    step1Label?: ReactNode;
    step2Label?: ReactNode;
    benefits: AnalyticsSetupBenefit[];
    actions: ReactNode;
    className?: string;
};

function SetupStep({
    step,
    label,
    status,
}: {
    step: number;
    label: ReactNode;
    status: 'complete' | 'current' | 'upcoming';
}) {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
                className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                    status === 'complete' &&
                        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
                    status === 'current' &&
                        'border-primary bg-primary text-primary-foreground',
                    status === 'upcoming' &&
                        'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500',
                )}
            >
                {status === 'complete' ? (
                    <CheckCircle2Icon className="size-4" />
                ) : (
                    step
                )}
            </div>
            <div className="min-w-0 text-left">
                <p
                    className={cn(
                        'text-sm font-medium',
                        status === 'upcoming'
                            ? 'text-muted-foreground'
                            : 'text-foreground',
                    )}
                >
                    {label}
                </p>
                <p className="text-xs text-muted-foreground">
                    {status === 'complete' ? (
                        <FormattedMessage defaultMessage="Done" />
                    ) : status === 'current' ? (
                        <FormattedMessage defaultMessage="Current step" />
                    ) : (
                        <FormattedMessage defaultMessage="Up next" />
                    )}
                </p>
            </div>
        </div>
    );
}

export function AnalyticsSetupLayout({
    currentStep,
    icon: Icon,
    iconClassName,
    title,
    description,
    connectedAccountEmail,
    connectedAccountLabel,
    step1Label = <FormattedMessage defaultMessage="Connect Google" />,
    step2Label = <FormattedMessage defaultMessage="Link Analytics property" />,
    benefits,
    actions,
    className,
}: AnalyticsSetupLayoutProps) {
    return (
        <div className={cn('w-full', className)}>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-800">
                <div className="border-b border-slate-200/80 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <SetupStep
                            step={1}
                            label={step1Label}
                            status={currentStep === 1 ? 'current' : 'complete'}
                        />
                        <div className="hidden h-px min-w-8 flex-1 bg-slate-200 sm:block dark:bg-slate-800" />
                        <SetupStep
                            step={2}
                            label={step2Label}
                            status={
                                currentStep === 1
                                    ? 'upcoming'
                                    : currentStep === 2
                                      ? 'current'
                                      : 'complete'
                            }
                        />
                    </div>
                </div>

                <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div
                                className={cn(
                                    'flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800',
                                    iconClassName,
                                )}
                            >
                                <Icon className="size-7" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    {title}
                                </h2>
                                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                                    {description}
                                </p>
                            </div>

                            {connectedAccountEmail || connectedAccountLabel ? (
                                <Badge
                                    variant="secondary"
                                    className="gap-1.5 px-3 py-1.5 text-xs font-normal"
                                >
                                    <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    {connectedAccountLabel ?? (
                                        <FormattedMessage
                                            defaultMessage="Signed in as {email}"
                                            values={{
                                                email: connectedAccountEmail,
                                            }}
                                        />
                                    )}
                                </Badge>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            {actions}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            <FormattedMessage defaultMessage="What you'll unlock" />
                        </p>
                        <ul className="space-y-3">
                            {benefits.map((benefit, index) => {
                                const BenefitIcon = benefit.icon;

                                return (
                                    <li
                                        key={index}
                                        className="flex gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30"
                                    >
                                        <div
                                            className={cn(
                                                'flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800',
                                                benefit.iconClassName,
                                            )}
                                        >
                                            <BenefitIcon className="size-4" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <p className="text-sm font-semibold text-foreground">
                                                {benefit.title}
                                            </p>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
