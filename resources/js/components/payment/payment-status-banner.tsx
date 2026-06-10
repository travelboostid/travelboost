import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    paymentStatusLabel,
    paymentStatusNotice,
    type PaymentStatusNotice,
} from '@/lib/payment-status';
import { cn } from '@/lib/utils';
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    CircleAlertIcon,
    InfoIcon,
    RefreshCwIcon,
} from 'lucide-react';

type PaymentStatusBannerProps = {
    status: string;
    changed?: boolean;
    transactionStatus?: string | null;
    isChecking?: boolean;
    lastCheckedAt?: Date | null;
    onCheckStatus?: () => void;
    notice?: PaymentStatusNotice | null;
};

function toneClasses(tone: PaymentStatusNotice['tone']): string {
    switch (tone) {
        case 'success':
            return 'border-emerald-500/25 bg-emerald-500/5 text-emerald-900 dark:text-emerald-300';
        case 'warning':
            return 'border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-300';
        case 'danger':
            return 'border-destructive/25 bg-destructive/5 text-destructive';
        default:
            return 'border-primary/20 bg-primary/5 text-foreground';
    }
}

function StatusToneIcon({
    tone,
    className,
}: {
    tone: PaymentStatusNotice['tone'];
    className?: string;
}) {
    switch (tone) {
        case 'success':
            return <CheckCircle2Icon className={className} />;
        case 'warning':
            return <AlertCircleIcon className={className} />;
        case 'danger':
            return <CircleAlertIcon className={className} />;
        default:
            return <InfoIcon className={className} />;
    }
}

function formatLastChecked(at: Date): string {
    return at.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export function PaymentStatusBanner({
    status,
    changed = false,
    transactionStatus,
    isChecking = false,
    lastCheckedAt,
    onCheckStatus,
    notice,
}: PaymentStatusBannerProps) {
    const resolvedNotice = notice ??
        paymentStatusNotice(status, changed) ?? {
            tone: 'info' as const,
            title: 'Waiting for payment',
            body: 'We are checking with the provider automatically. You can also refresh manually after paying.',
        };

    return (
        <div className="space-y-3">
            <div
                className={cn(
                    'rounded-xl border px-3 py-3 text-sm',
                    toneClasses(resolvedNotice.tone),
                )}
            >
                <div className="flex items-start gap-2.5">
                    <StatusToneIcon
                        tone={resolvedNotice.tone}
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                                {resolvedNotice.title}
                            </p>
                            <Badge variant="outline" className="capitalize">
                                {paymentStatusLabel(status)}
                            </Badge>
                            {transactionStatus ? (
                                <Badge
                                    variant="secondary"
                                    className="capitalize"
                                >
                                    {transactionStatus}
                                </Badge>
                            ) : null}
                        </div>
                        <p className="leading-relaxed text-muted-foreground">
                            {resolvedNotice.body}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                    {lastCheckedAt
                        ? `Last checked ${formatLastChecked(lastCheckedAt)}`
                        : 'Status has not been checked yet'}
                </p>
                {onCheckStatus ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={isChecking}
                        onClick={onCheckStatus}
                    >
                        {isChecking ? (
                            <Spinner />
                        ) : (
                            <RefreshCwIcon className="size-3.5" />
                        )}
                        Check status
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
