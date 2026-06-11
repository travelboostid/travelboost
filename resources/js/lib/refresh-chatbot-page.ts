import { refreshPageAfterPayment } from '@/lib/refresh-after-payment';

const CHATBOT_PAGE_PROPS = [
    'pendingTopup',
    'credit',
    'dailyStats',
    'usageCostToday',
    'usageCostIn30Days',
] as const;

export function refreshChatbotPage(): void {
    refreshPageAfterPayment({
        only: [...CHATBOT_PAGE_PROPS],
    });
}

export function refreshChatbotPendingTopup(): void {
    refreshPageAfterPayment({
        only: ['pendingTopup'],
    });
}
