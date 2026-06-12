import type { PaymentMethodResource } from '@/api/payment/payment-method';
import type { LucideIcon } from 'lucide-react';
import {
    Building2Icon,
    CreditCardIcon,
    QrCodeIcon,
    StoreIcon,
    WalletIcon,
} from 'lucide-react';

export const PAYMENT_METHOD_CATEGORY_ORDER = [
    'banktransfer',
    'qris',
    'creditcard',
    'conveniencestore',
] as const;

export type PaymentMethodCategoryKey =
    (typeof PAYMENT_METHOD_CATEGORY_ORDER)[number];

const CATEGORY_LABELS: Record<PaymentMethodCategoryKey, string> = {
    banktransfer: 'Bank transfer',
    qris: 'QRIS',
    creditcard: 'Credit & debit card',
    conveniencestore: 'Convenience store',
};

const CATEGORY_ICONS: Record<PaymentMethodCategoryKey, LucideIcon> = {
    banktransfer: Building2Icon,
    qris: QrCodeIcon,
    creditcard: CreditCardIcon,
    conveniencestore: StoreIcon,
};

export function paymentMethodCategoryLabel(
    category: string | null | undefined,
): string {
    if (!category) {
        return 'Other methods';
    }

    if (category in CATEGORY_LABELS) {
        return CATEGORY_LABELS[category as PaymentMethodCategoryKey];
    }

    return category.replace(/_/g, ' ');
}

export function paymentMethodCategoryIcon(
    category: string | null | undefined,
): LucideIcon {
    if (category && category in CATEGORY_ICONS) {
        return CATEGORY_ICONS[category as PaymentMethodCategoryKey];
    }

    return WalletIcon;
}

export function paymentMethodProviderLabel(provider: string): string {
    return provider === 'prismalink' ? 'PrismaLink' : 'Midtrans';
}

export function groupPaymentMethodsByCategory(
    methods: PaymentMethodResource[],
): Array<{
    category: string;
    label: string;
    methods: PaymentMethodResource[];
}> {
    const grouped = new Map<string, PaymentMethodResource[]>();
    const list = Array.isArray(methods) ? methods : [];

    for (const method of list) {
        const category = method.category ?? 'other';
        const existing = grouped.get(category) ?? [];
        existing.push(method);
        grouped.set(category, existing);
    }

    const orderedCategories = [
        ...PAYMENT_METHOD_CATEGORY_ORDER.filter((category) =>
            grouped.has(category),
        ),
        ...[...grouped.keys()].filter(
            (category) =>
                !PAYMENT_METHOD_CATEGORY_ORDER.includes(
                    category as PaymentMethodCategoryKey,
                ),
        ),
    ];

    return orderedCategories.map((category) => ({
        category,
        label: paymentMethodCategoryLabel(category),
        methods: grouped.get(category) ?? [],
    }));
}

export function findPaymentMethodById(
    methods: PaymentMethodResource[],
    methodId: number | null,
): PaymentMethodResource | null {
    if (methodId === null) {
        return null;
    }

    return Array.isArray(methods)
        ? (methods.find((method) => method.id === methodId) ?? null)
        : null;
}
