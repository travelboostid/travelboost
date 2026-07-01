import { Button } from '@/components/ui/button';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { refreshWalletPage } from '@/lib/refresh-wallet-page';
import { FormattedMessage } from 'react-intl';

type ContinuePaymentProps = {
    payment: {
        id?: number | string;
        status?: string;
        provider?: string;
        amount?: number;
        payload?: Record<string, unknown>;
    };
    children?: React.ReactNode;
};

export default function ContinuePayment({
    payment,
    children,
}: ContinuePaymentProps) {
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
                    refreshWalletPage();
                },
                onPaid: () => {
                    refreshWalletPage();
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
