import {
    setMidtransPublicConfig,
    type MidtransPublicConfig,
} from '@/lib/midtrans-snap';

type PageProps = {
    midtrans?: MidtransPublicConfig;
};

export function syncMidtransPublicConfig(props: unknown): void {
    setMidtransPublicConfig((props as PageProps).midtrans);
}
