import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

type PaymentQrCodeProps = {
    value: string;
    size?: number;
    className?: string;
};

export function PaymentQrCode({
    value,
    size = 256,
    className,
}: PaymentQrCodeProps) {
    return (
        <div
            className={cn(
                'inline-flex rounded-md bg-white p-3 shadow-sm ring-1 ring-border/60',
                className,
            )}
        >
            <QRCodeSVG
                value={value}
                size={size}
                level="M"
                marginSize={2}
                role="img"
                aria-label="QRIS payment code"
            />
        </div>
    );
}
