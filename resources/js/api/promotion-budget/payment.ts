import { apiInstance } from '@/api/api-instance';
import type { PaymentResource } from '@/api/model';

export type CreatePromotionBudgetTopupPaymentBody = {
    company_id: number;
    amount: number;
    payment_method_id: number;
};

export function createPromotionBudgetTopupPayment(
    body: CreatePromotionBudgetTopupPaymentBody,
) {
    return apiInstance<{ data: PaymentResource }>({
        url: '/payments/create-promotion-budget-topup-payment',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
    });
}
