import { refreshPageAfterPayment } from '@/lib/refresh-after-payment';

const PROMOTION_BUDGET_PAGE_PROPS = [
    'pendingTopup',
    'budget',
    'recentTransactions',
] as const;

export function refreshPromotionBudgetPage(): void {
    refreshPageAfterPayment({
        only: [...PROMOTION_BUDGET_PAGE_PROPS],
    });
}

export function refreshPromotionBudgetPendingTopup(): void {
    refreshPageAfterPayment({
        only: ['pendingTopup'],
    });
}
