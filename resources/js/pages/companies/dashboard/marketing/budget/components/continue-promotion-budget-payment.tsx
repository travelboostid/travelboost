import { Button } from '@/components/ui/button';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { refreshPromotionBudgetPage } from '@/lib/refresh-promotion-budget-page';
import { FormattedMessage } from 'react-intl';

type ContinuePromotionBudgetPaymentProps = {
    payment: {
        id?: number | string;
        status?: string;
        provider?: string;
        amount?: number;
        payload?: Record<string, unknown>;
    };
    children?: React.ReactNode;
};

export default function ContinuePromotionBudgetPayment({
    payment,
    children,
}: ContinuePromotionBudgetPaymentProps) {
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
                    refreshPromotionBudgetPage();
                },
                onPaid: () => {
                    refreshPromotionBudgetPage();
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
