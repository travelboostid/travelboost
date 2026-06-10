import { Button } from '@/components/ui/button';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { refreshAgentSubscriptionPage } from '@/lib/refresh-agent-subscription-page';

type ContinueSubscriptionPaymentProps = {
    payment: {
        id?: number | string;
        status?: string;
        provider?: string;
        amount?: number;
        payload?: Record<string, unknown>;
    };
    children?: React.ReactNode;
};

export default function ContinueSubscriptionPayment({
    payment,
    children = 'Continue payment',
}: ContinueSubscriptionPaymentProps) {
    const handlePay = () => {
        openOnlinePayment(
            {
                id: payment?.id,
                status: payment?.status,
                provider: payment?.provider,
                amount: payment?.amount,
                payload: payment?.payload,
            },
            {
                onComplete: () => {
                    refreshAgentSubscriptionPage();
                },
                onPaid: () => {
                    refreshAgentSubscriptionPage();
                },
            },
        );
    };

    return (
        <Button size="lg" className="h-11 w-full sm:flex-1" onClick={handlePay}>
            {children}
        </Button>
    );
}
