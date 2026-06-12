import { Button } from '@/components/ui/button';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { refreshPageAfterPayment } from '@/lib/refresh-after-payment';
import { FormattedMessage } from 'react-intl';

export default function ContinuePayment({ payment }: { payment: any }) {
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
                    refreshPageAfterPayment();
                },
            },
        );
    };

    return (
        <Button size="sm" variant="default" onClick={handlePay}>
            <FormattedMessage defaultMessage="Continue Payment" />
        </Button>
    );
}
