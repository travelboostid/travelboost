import { refreshPageAfterPayment } from '@/lib/refresh-after-payment';

const AGENT_SUBSCRIPTION_PAGE_PROPS = [
    'pendingPayment',
    'agentSubscription',
    'agentSubscriptionPackages',
] as const;

export function refreshAgentSubscriptionPage(): void {
    refreshPageAfterPayment({
        only: [...AGENT_SUBSCRIPTION_PAGE_PROPS],
    });
}

export function refreshAgentSubscriptionPendingPayment(): void {
    refreshPageAfterPayment({
        only: ['pendingPayment'],
    });
}
