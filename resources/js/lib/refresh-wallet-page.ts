import { refreshPageAfterPayment } from '@/lib/refresh-after-payment';

const WALLET_PAGE_PROPS = [
    'pendingTopup',
    'balance',
    'income',
    'expenses',
    'net_change',
    'transactions',
] as const;

export function refreshWalletPage(): void {
    refreshPageAfterPayment({
        only: [...WALLET_PAGE_PROPS],
    });
}

export function refreshWalletPendingTopup(): void {
    refreshPageAfterPayment({
        only: ['pendingTopup'],
    });
}
