import {
    usePaymentMethods,
    type PaymentMethodResource,
} from '@/api/payment/payment-method';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    groupPaymentMethodsByCategory,
    paymentMethodCategoryIcon,
    paymentMethodProviderLabel,
} from '@/lib/payment-method-ui';
import { cn } from '@/lib/utils';
import { CheckCircle2Icon, CircleAlertIcon } from 'lucide-react';
import { createElement } from 'react';

type PaymentMethodListProps = {
    selectedMethodId: number | null;
    onSelect: (methodId: number) => void;
};

function PaymentMethodOption({
    method,
    selected,
    onSelect,
}: {
    method: PaymentMethodResource;
    selected: boolean;
    onSelect: (methodId: number) => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                'group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all',
                selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30',
            )}
            onClick={() => onSelect(method.id)}
        >
            <div
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
                    selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                )}
            >
                {createElement(paymentMethodCategoryIcon(method.category), {
                    className: 'size-4',
                })}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{method.name}</p>
                    <Badge variant="outline" className="text-[10px] uppercase">
                        {paymentMethodProviderLabel(method.provider)}
                    </Badge>
                </div>
                {method.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {method.description}
                    </p>
                ) : null}
            </div>

            <div className="pt-0.5">
                {selected ? (
                    <CheckCircle2Icon className="size-5 text-primary" />
                ) : (
                    <span className="block size-5 rounded-full border-2 border-muted-foreground/30" />
                )}
            </div>
        </button>
    );
}

function PaymentMethodListSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <div className="space-y-2">
                        {Array.from({ length: 2 }).map((__, itemIndex) => (
                            <Skeleton
                                key={itemIndex}
                                className="h-[76px] w-full rounded-xl"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function PaymentMethodList({
    selectedMethodId,
    onSelect,
}: PaymentMethodListProps) {
    const paymentMethods = usePaymentMethods();
    const methods = paymentMethods.data ?? [];

    if (paymentMethods.isLoading) {
        return <PaymentMethodListSkeleton />;
    }

    if (paymentMethods.isError) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center">
                <CircleAlertIcon className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                    Could not load payment methods
                </p>
                <p className="text-sm text-muted-foreground">
                    Please refresh and try again.
                </p>
            </div>
        );
    }

    if (methods.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center">
                <CircleAlertIcon className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                    No payment methods available
                </p>
                <p className="text-sm text-muted-foreground">
                    Online payment is temporarily unavailable. Try again later
                    or contact support.
                </p>
            </div>
        );
    }

    const groups = groupPaymentMethodsByCategory(methods);

    return (
        <div className="space-y-5">
            {groups.map((group) => (
                <section key={group.category} className="space-y-2.5">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {group.label}
                    </h3>
                    <div className="grid gap-2">
                        {group.methods.map((method) => (
                            <PaymentMethodOption
                                key={method.id}
                                method={method}
                                selected={selectedMethodId === method.id}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
