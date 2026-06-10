import { Button } from '@/components/ui/button';
import { openOnlinePayment } from '@/lib/open-online-payment';

export default function ContinuePayment({ payment }: { payment: any }) {
    const handlePay = () => {
        openOnlinePayment({
            provider: payment?.provider,
            payload: payment?.payload,
        });
    };

    return (
        <Button size="sm" variant="default" onClick={handlePay}>
            Continue Payment
        </Button>
    );
}
