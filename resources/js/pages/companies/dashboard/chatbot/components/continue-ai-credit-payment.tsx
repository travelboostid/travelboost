import { Button } from '@/components/ui/button';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { refreshChatbotPage } from '@/lib/refresh-chatbot-page';
import { FormattedMessage } from 'react-intl';

type ContinueAiCreditPaymentProps = {
    payment: {
        id?: number | string;
        status?: string;
        provider?: string;
        amount?: number;
        payload?: Record<string, unknown>;
    };
    children?: React.ReactNode;
};

export default function ContinueAiCreditPayment({
    payment,
    children,
}: ContinueAiCreditPaymentProps) {
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
                    refreshChatbotPage();
                },
                onPaid: () => {
                    refreshChatbotPage();
                },
            },
        );
    };

    return (
        <Button size="lg" className="h-11 w-full sm:flex-1" onClick={handlePay}>
            {children ?? <FormattedMessage defaultMessage="Continue payment" />}
        </Button>
    );
}
