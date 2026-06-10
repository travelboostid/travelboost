import { router } from '@inertiajs/react';

type RefreshPageAfterPaymentOptions = {
    preserveScroll?: boolean;
    only?: string[];
};

export function refreshPageAfterPayment(
    options: RefreshPageAfterPaymentOptions = {},
): void {
    const { preserveScroll = true, only } = options;

    router.reload({
        preserveScroll,
        ...(only && only.length > 0 ? { only } : {}),
    });
}
