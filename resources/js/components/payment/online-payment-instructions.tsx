import { PaymentQrCode } from '@/components/payment/payment-qr-code';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/constants/booking';
import { loadMidtransSnapScript, openMidtransSnap } from '@/lib/midtrans-snap';
import {
    buildPaymentDetailsText,
    formatBankLabel,
    formatPaymentAmount,
    formatPaymentExpiry,
    hasQrisInstructionPayload,
    instructionKindLabel,
    instructionSteps,
    resolveInstructionKind,
    resolveQrisQrData,
    resolveQrisQrImageUrl,
    type PaymentInstructionPayload,
} from '@/lib/payment-instructions';
import { cn } from '@/lib/utils';
import {
    Building2Icon,
    CheckCircle2Icon,
    CopyIcon,
    ExternalLinkIcon,
    ListOrderedIcon,
    QrCodeIcon,
    StoreIcon,
} from 'lucide-react';
import { toast } from 'sonner';

type OnlinePaymentInstructionsProps = {
    provider?: string | null;
    amount?: number | null;
    payload?: PaymentInstructionPayload | null;
    status?: string | null;
};

async function copyText(value: string, label: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);
    } catch {
        toast.error(`Could not copy ${label.toLowerCase()}`);
    }
}

function PaymentAmountCard({
    amount,
    expiresAt,
}: {
    amount?: number | null;
    expiresAt?: string | null;
}) {
    const formattedAmount = formatPaymentAmount(amount);
    const expiryLabel = formatPaymentExpiry(expiresAt);
    const isExpired = expiryLabel === 'Expired';

    if (!formattedAmount) {
        return null;
    }

    return (
        <div className="rounded-xl border border-primary/15 bg-linear-to-br from-primary/5 via-background to-background p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Amount to pay
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                {formattedAmount}
            </p>
            {expiryLabel ? (
                <p
                    className={cn(
                        'mt-2 text-xs font-medium',
                        isExpired
                            ? 'text-destructive'
                            : 'text-amber-700 dark:text-amber-400',
                    )}
                >
                    {expiryLabel}
                </p>
            ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                    Transfer this exact amount before the payment expires.
                </p>
            )}
        </div>
    );
}

function InstructionSteps({ steps }: { steps: string[] }) {
    return (
        <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <ListOrderedIcon className="size-4 text-primary" />
                How to pay
            </div>
            <ol className="space-y-2.5">
                {steps.map((step, index) => (
                    <li
                        key={step}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}

function CopyableField({
    label,
    value,
    highlight = false,
    mono = true,
}: {
    label: string;
    value?: string | null;
    highlight?: boolean;
    mono?: boolean;
}) {
    if (!value) {
        return null;
    }

    return (
        <div
            className={cn(
                'rounded-xl border p-4',
                highlight ? 'border-primary/25 bg-primary/5' : 'bg-muted/20',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <Button
                    type="button"
                    size="sm"
                    variant={highlight ? 'default' : 'outline'}
                    className="h-8 shrink-0 gap-1.5 px-3"
                    onClick={() => copyText(value, label)}
                >
                    <CopyIcon className="size-3.5" />
                    Copy
                </Button>
            </div>
            <p
                className={cn(
                    'mt-2 break-all',
                    mono
                        ? 'font-mono text-base font-semibold'
                        : 'text-sm font-medium',
                    highlight && 'text-lg',
                )}
            >
                {value}
            </p>
        </div>
    );
}

function PaymentDetailsGrid({
    amount,
    payload,
    kind,
}: {
    amount?: number | null;
    payload: PaymentInstructionPayload;
    kind: ReturnType<typeof resolveInstructionKind>;
}) {
    const details = [
        kind === 'va'
            ? {
                  label: 'Bank',
                  value: formatBankLabel(payload.bank),
                  icon: Building2Icon,
              }
            : null,
        kind === 'mandiri_bill'
            ? {
                  label: 'Biller code',
                  value: payload.biller_code,
                  icon: Building2Icon,
              }
            : null,
        kind === 'cstore'
            ? {
                  label: 'Store',
                  value: payload.store,
                  icon: StoreIcon,
              }
            : null,
    ].filter(
        (
            item,
        ): item is {
            label: string;
            value: string | null | undefined;
            icon: typeof Building2Icon;
        } => item !== null,
    );

    return (
        <div className="space-y-3">
            {details.map((item) =>
                item.value ? (
                    <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5"
                    >
                        <item.icon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                                {item.label}
                            </p>
                            <p className="text-sm font-medium">{item.value}</p>
                        </div>
                    </div>
                ) : null,
            )}

            {kind === 'va' ? (
                <CopyableField
                    label="Virtual account number"
                    value={payload.va_number}
                    highlight
                />
            ) : null}

            {kind === 'mandiri_bill' ? (
                <CopyableField
                    label="Bill key"
                    value={payload.bill_key}
                    highlight
                />
            ) : null}

            {kind === 'cstore' ? (
                <CopyableField
                    label="Payment code"
                    value={payload.payment_code}
                    highlight
                />
            ) : null}

            {payload.order_id ? (
                <CopyableField
                    label="Order reference"
                    value={payload.order_id}
                    mono
                />
            ) : null}

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                    copyText(
                        buildPaymentDetailsText(amount, payload, kind),
                        'Payment details',
                    )
                }
            >
                <CopyIcon className="size-4" />
                Copy all details
            </Button>
        </div>
    );
}

export function OnlinePaymentInstructions({
    provider,
    amount,
    payload,
    status,
}: OnlinePaymentInstructionsProps) {
    const instructions = payload ?? {};
    const kind = resolveInstructionKind(provider, instructions);
    const steps = instructionSteps(kind);

    if (
        kind === 'external_page' &&
        provider === 'prismalink' &&
        instructions.payment_page_url
    ) {
        return (
            <div className="space-y-4">
                <PaymentAmountCard
                    amount={amount}
                    expiresAt={instructions.charge_expires_at}
                />
                <InstructionSteps steps={steps} />
                <Button asChild className="h-11 w-full" size="lg">
                    <a
                        href={instructions.payment_page_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Continue to payment page
                        <ExternalLinkIcon className="size-4" />
                    </a>
                </Button>
            </div>
        );
    }

    if (kind === 'redirect' && instructions.redirect_url) {
        return (
            <div className="space-y-4">
                <PaymentAmountCard
                    amount={amount}
                    expiresAt={instructions.charge_expires_at}
                />
                <InstructionSteps steps={steps} />
                <Button asChild className="h-11 w-full" size="lg">
                    <a
                        href={instructions.redirect_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Continue to secure payment
                        <ExternalLinkIcon className="size-4" />
                    </a>
                </Button>
            </div>
        );
    }

    if (
        kind === 'snap' &&
        typeof instructions.snap_token === 'string' &&
        instructions.snap_token.trim() !== ''
    ) {
        const snapToken = instructions.snap_token.trim();

        return (
            <div className="space-y-4">
                <PaymentAmountCard
                    amount={amount}
                    expiresAt={
                        instructions.snap_token_expires_at ??
                        instructions.charge_expires_at
                    }
                />
                <InstructionSteps steps={steps} />
                <Button
                    type="button"
                    className="h-11 w-full"
                    size="lg"
                    onClick={() => {
                        void loadMidtransSnapScript()
                            .then(() => {
                                openMidtransSnap(snapToken, {
                                    onError: () => {
                                        toast.error(
                                            'Midtrans could not open the payment page. Please try again.',
                                        );
                                    },
                                });
                            })
                            .catch((error: unknown) => {
                                toast.error(
                                    error instanceof Error
                                        ? error.message
                                        : 'Failed to load Midtrans Snap.',
                                );
                            });
                    }}
                >
                    Open Midtrans payment
                    <ExternalLinkIcon className="size-4" />
                </Button>
            </div>
        );
    }

    if (kind === 'qris' && hasQrisInstructionPayload(instructions)) {
        const qrData = resolveQrisQrData(instructions);
        const qrImageUrl = resolveQrisQrImageUrl(instructions);

        return (
            <div className="space-y-4">
                <PaymentAmountCard
                    amount={amount}
                    expiresAt={instructions.charge_expires_at}
                />
                <InstructionSteps steps={steps} />
                <div className="overflow-hidden rounded-xl border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                        <QrCodeIcon className="size-4 text-primary" />
                        Scan to pay
                    </div>
                    <div className="flex justify-center">
                        {qrData ? (
                            <PaymentQrCode value={qrData} size={240} />
                        ) : qrImageUrl ? (
                            <img
                                src={qrImageUrl}
                                alt="QRIS payment code"
                                className="max-h-64 w-auto rounded-md bg-white p-3 shadow-sm ring-1 ring-border/60"
                            />
                        ) : null}
                    </div>
                </div>
                {amount ? (
                    <p className="text-center text-sm text-muted-foreground">
                        Pay exactly {formatIDR(amount)}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PaymentAmountCard
                amount={amount}
                expiresAt={instructions.charge_expires_at}
            />

            {status !== 'paid' ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2Icon className="size-4 shrink-0" />
                    <span>
                        Waiting for{' '}
                        <span className="font-medium">
                            {instructionKindLabel(kind)}
                        </span>{' '}
                        payment
                    </span>
                    {instructions.transaction_status ? (
                        <Badge variant="outline" className="ml-auto capitalize">
                            {instructions.transaction_status}
                        </Badge>
                    ) : null}
                </div>
            ) : null}

            <InstructionSteps steps={steps} />
            <PaymentDetailsGrid
                amount={amount}
                payload={instructions}
                kind={kind}
            />
        </div>
    );
}

export function OnlinePaymentInstructionsFromPayment({
    payment,
}: {
    payment: {
        provider?: string | null;
        amount?: number | null;
        payload?: PaymentInstructionPayload | null;
    };
}) {
    return (
        <OnlinePaymentInstructions
            provider={payment.provider}
            amount={payment.amount}
            payload={payment.payload ?? undefined}
        />
    );
}
