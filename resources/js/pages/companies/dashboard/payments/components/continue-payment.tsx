import { Button } from '@/components/ui/button';

export default function ContinuePayment({ payment }: { payment: any }) {
  const handlePay = () => {
    const snapToken = (payment?.payload as any)?.snap_token as string;
    (window as any).snap.pay(snapToken, {
      onSuccess: () => window.location.reload(),
      onError: () => window.location.reload(),
      onClose: () => window.location.reload(),
    });
  };
  return (
    <Button size="sm" variant="default" onClick={handlePay}>
      Continue Payment
    </Button>
  );
}
