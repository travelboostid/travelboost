import type { PaymentResource } from '@/api/model/paymentResource';
import dayjs from 'dayjs';

export type PaymentInstructionPayload = {
    instruction_type?: string | null;
    order_id?: string | null;
    merchant_ref_no?: string | null;
    plink_ref_no?: string | null;
    va_number?: string | null;
    bank?: string | null;
    bill_key?: string | null;
    biller_code?: string | null;
    payment_code?: string | null;
    store?: string | null;
    qr_url?: string | null;
    qr_data?: string | null;
    redirect_url?: string | null;
    payment_page_url?: string | null;
    transaction_status?: string | null;
    charge_expires_at?: string | null;
};

export type PaymentInstructionKind =
    | 'va'
    | 'mandiri_bill'
    | 'qris'
    | 'cstore'
    | 'redirect'
    | 'external_page'
    | 'unknown';

export function paymentInstructionPayload(
    payment: Pick<PaymentResource, 'payload'>,
): PaymentInstructionPayload {
    return (payment.payload ?? {}) as PaymentInstructionPayload;
}

export function hasMidtransPaymentInstructions(
    payload: PaymentInstructionPayload,
): boolean {
    if (payload.instruction_type) {
        return payload.instruction_type !== 'unknown';
    }

    return Boolean(
        payload.va_number ||
        payload.qr_url ||
        payload.qr_data ||
        payload.redirect_url,
    );
}

export function hasPrismaLinkPaymentInstructions(
    payload: PaymentInstructionPayload,
): boolean {
    if (payload.instruction_type && payload.instruction_type !== 'unknown') {
        return true;
    }

    return Boolean(
        payload.va_number ||
        payload.qr_url ||
        payload.qr_data ||
        payload.redirect_url ||
        payload.bill_key ||
        payload.payment_code ||
        payload.plink_ref_no ||
        payload.payment_page_url,
    );
}

export function hasQrisInstructionPayload(
    payload?: PaymentInstructionPayload | null,
): boolean {
    const instructions = payload ?? {};

    return Boolean(instructions.qr_data || instructions.qr_url);
}

export function resolveQrisQrData(
    payload?: PaymentInstructionPayload | null,
): string | null {
    const value = payload?.qr_data;

    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    return value.trim();
}

export function resolveQrisQrImageUrl(
    payload?: PaymentInstructionPayload | null,
): string | null {
    const value = payload?.qr_url;

    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    return value.trim();
}

export function isPendingOnlinePayment(
    provider?: string | null,
    status?: string | null,
    paymentId?: number | string | null,
): boolean {
    return Boolean(
        paymentId &&
        (provider === 'prismalink' || provider === 'midtrans') &&
        ['pending', 'unpaid'].includes(String(status ?? '')),
    );
}

export function hasOnlinePaymentInstructions(
    provider?: string | null,
    payload?: PaymentInstructionPayload | null,
): boolean {
    const instructions = payload ?? {};

    if (provider === 'prismalink') {
        return hasPrismaLinkPaymentInstructions(instructions);
    }

    if (provider === 'midtrans') {
        return hasMidtransPaymentInstructions(instructions);
    }

    return false;
}

export function formatBankLabel(bank?: string | null): string {
    if (!bank) {
        return 'Bank';
    }

    const labels: Record<string, string> = {
        bca: 'BCA',
        bni: 'BNI',
        bri: 'BRI',
        mandiri: 'Mandiri',
        permata: 'Permata',
        cimb: 'CIMB Niaga',
        danamon: 'Danamon',
    };

    const normalized = bank.toLowerCase();

    return labels[normalized] ?? bank.replace(/_/g, ' ').toUpperCase();
}

export function resolveInstructionKind(
    provider?: string | null,
    payload?: PaymentInstructionPayload | null,
): PaymentInstructionKind {
    const instructions = payload ?? {};

    if (
        provider === 'prismalink' &&
        instructions.payment_page_url &&
        !hasPrismaLinkPaymentInstructions(instructions)
    ) {
        return 'external_page';
    }

    if (hasQrisInstructionPayload(instructions)) {
        return 'qris';
    }

    switch (instructions.instruction_type) {
        case 'va':
            return 'va';
        case 'mandiri_bill':
            return 'mandiri_bill';
        case 'qris':
            return 'qris';
        case 'cstore':
            return 'cstore';
        case 'redirect':
            return 'redirect';
        default:
            return 'unknown';
    }
}

export function instructionKindLabel(kind: PaymentInstructionKind): string {
    return {
        va: 'Virtual Account',
        mandiri_bill: 'Mandiri Bill Payment',
        qris: 'QRIS',
        cstore: 'Convenience Store',
        redirect: 'Card Payment',
        external_page: 'Online Payment',
        unknown: 'Online Payment',
    }[kind];
}

export function instructionSteps(kind: PaymentInstructionKind): string[] {
    switch (kind) {
        case 'va':
            return [
                'Open your mobile banking or ATM app.',
                'Choose transfer to Virtual Account (VA).',
                'Enter the VA number shown below.',
                'Transfer the exact amount, then confirm payment.',
            ];
        case 'mandiri_bill':
            return [
                "Open Livin' by Mandiri, ATM Mandiri, or internet banking.",
                'Choose Bayar/Beli and enter the biller code.',
                'Enter the bill key and confirm the amount.',
            ];
        case 'qris':
            return [
                'Open your e-wallet or mobile banking app.',
                'Scan the QR code below.',
                'Confirm the amount and complete payment.',
            ];
        case 'cstore':
            return [
                'Go to the selected convenience store.',
                'Tell the cashier you want to pay with the payment code.',
                'Pay the exact amount before the code expires.',
            ];
        case 'redirect':
            return [
                'Continue to the secure payment page.',
                'Enter your card details and complete 3D Secure if asked.',
            ];
        case 'external_page':
            return [
                'You will be redirected to the payment provider page.',
                'Complete payment there, then return here if needed.',
            ];
        default:
            return [
                'Follow the payment details below to complete your payment.',
            ];
    }
}

export function formatPaymentAmount(amount?: number | null): string | null {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
        return null;
    }

    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function formatPaymentExpiry(expiresAt?: string | null): string | null {
    if (!expiresAt) {
        return null;
    }

    const expiry = dayjs(expiresAt);

    if (!expiry.isValid()) {
        return null;
    }

    if (expiry.isBefore(dayjs())) {
        return 'Expired';
    }

    return `Expires ${expiry.format('DD MMM YYYY, HH:mm')}`;
}

export function buildPaymentDetailsText(
    amount: number | null | undefined,
    payload: PaymentInstructionPayload,
    kind: PaymentInstructionKind,
): string {
    const lines = [
        'Payment details',
        amount ? `Amount: ${formatPaymentAmount(amount)}` : null,
        kind === 'va' ? `Bank: ${formatBankLabel(payload.bank)}` : null,
        payload.va_number ? `VA: ${payload.va_number}` : null,
        payload.biller_code ? `Biller code: ${payload.biller_code}` : null,
        payload.bill_key ? `Bill key: ${payload.bill_key}` : null,
        payload.payment_code ? `Payment code: ${payload.payment_code}` : null,
        payload.store ? `Store: ${payload.store}` : null,
        payload.order_id ? `Order ID: ${payload.order_id}` : null,
    ].filter((line): line is string => Boolean(line));

    return lines.join('\n');
}
