import {
    usePaymentMethods,
    type PaymentMethodResource,
} from '@/api/payment/payment-method';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type PaymentMethodListProps = {
    selectedMethodId: number | null;
    onSelect: (methodId: number) => void;
};

export function PaymentMethodList({
    selectedMethodId,
    onSelect,
}: PaymentMethodListProps) {
    const paymentMethods = usePaymentMethods();
    const methods = paymentMethods.data?.data ?? [];

    if (paymentMethods.isLoading) {
        return (
            <div className="flex justify-center py-6">
                <Spinner />
            </div>
        );
    }

    if (methods.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No payment methods are available right now.
            </p>
        );
    }

    return (
        <div className="grid gap-2">
            {methods.map((method: PaymentMethodResource) => (
                <button
                    key={method.id}
                    type="button"
                    className={cn(
                        'rounded-lg border p-3 text-left transition-colors',
                        selectedMethodId === method.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50',
                    )}
                    onClick={() => onSelect(method.id)}
                >
                    <p className="font-medium">{method.name}</p>
                    {method.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {method.description}
                        </p>
                    ) : null}
                </button>
            ))}
        </div>
    );
}
