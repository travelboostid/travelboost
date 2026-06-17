import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency, PRICE_CATEGORY_LABELS } from '@/constants/booking';
import { cn } from '@/lib/utils';
import type {
    BookingContact,
    BookingPricing,
    GuestEntry,
    VendorInfo,
} from '@/types/booking';
import { calculateAddOnPricing } from '@/utils/booking-calculations';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    BanknoteIcon,
    CreditCardIcon,
    HelpCircleIcon,
    MinusIcon,
    PlusIcon,
    ReceiptIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ManualPaymentDialog,
    type ManualPaymentData,
} from './ManualPaymentDialog';
import type { RoomConfig } from './Step2RoomConfiguration';

// ─── Types ───────────────────────────────────────────────────────────────────────

export type PaymentType = 'down_payment' | 'full_payment';
export type PaymentMethod = 'manual_transfer' | 'midtrans';
export type DownPaymentRule =
    | {
          mode: 'grand_total_percent';
          percent: number;
      }
    | {
          mode: 'per_pax_amount';
          amount: number;
      }
    | null;

export type AddOnItem = {
    key: string;
    label: string;
    unitPrice: number;
    qty: number;
    tooltip?: string;
    hasQty?: boolean;
    isTaxable?: boolean;
};

type ProformaInvoicePreviewConfig = {
    submitUrl: string;
    invoiceType?: string | null;
    statusLabel?: string | null;
};

type Step4Props = {
    contact: BookingContact;
    guests: GuestEntry[];
    rooms: RoomConfig[];
    pricing: BookingPricing;
    vendor: VendorInfo;
    agentName: string;
    onPayNow: (
        paymentType: PaymentType,
        paymentMethod: PaymentMethod,
        addOns: AddOnItem[],
        finalAmount: number,
        manualData?: ManualPaymentData,
    ) => void;
    isSubmitting?: boolean;
    initialAddOns?: AddOnItem[];
    onAddOnsChange?: (addOns: AddOnItem[]) => void;
    minimumDownPaymentPct?: number | null;
    downPaymentRule?: DownPaymentRule;
    minimumVatPct?: number;
    paidAmount?: number;
    remainingBalance?: number;
    grandTotalOverride?: number | null;
    forceBalancePayment?: boolean;
    vendorBankInfo?: {
        bankName: string;
        accountName: string;
        accountNumber: string;
    };
    readOnly?: boolean;
    hidePaymentControls?: boolean;
    preservePaymentPanelColumns?: boolean;
    addOnsReadOnly?: boolean;
    downPaymentAvailable?: boolean;
    fullPaymentAvailable?: boolean;
    paymentUnavailableReason?: string | null;
    paymentErrorMessage?: string | null;
    showProformaInvoiceButton?: boolean;
    proformaInvoiceUrl?: string | null;
    proformaInvoicePreview?: ProformaInvoicePreviewConfig | null;
    manualPaymentAvailable?: boolean;
    onlinePaymentAvailable?: boolean;
    downPaymentPaidAt?: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────────────────

const PAYMENT_UNAVAILABLE_MESSAGE =
    'Payment is temporarily unavailable. Please try again later or contact customer support.';

function formatPaymentDate(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

function formatPercentageValue(value: number): string {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
    }).format(value);
}

export default function Step4BookingSummary({
    contact,
    guests,
    pricing,
    onPayNow,
    isSubmitting = false,
    initialAddOns,
    onAddOnsChange,
    minimumDownPaymentPct,
    downPaymentRule,
    minimumVatPct,
    paidAmount = 0,
    remainingBalance = 0,
    grandTotalOverride = null,
    forceBalancePayment = false,
    vendorBankInfo,
    readOnly = false,
    hidePaymentControls = false,
    preservePaymentPanelColumns = false,
    addOnsReadOnly = false,
    downPaymentAvailable = true,
    fullPaymentAvailable = true,
    paymentUnavailableReason = null,
    paymentErrorMessage = null,
    showProformaInvoiceButton = false,
    proformaInvoiceUrl = null,
    proformaInvoicePreview = null,
    manualPaymentAvailable = true,
    onlinePaymentAvailable = true,
    downPaymentPaidAt = null,
}: Step4Props) {
    const addOnsLocked = readOnly || addOnsReadOnly;

    // ─── Add-ons state ──────────────────────────────────────────────────
    const [addOns, setAddOns] = useState<AddOnItem[]>(initialAddOns ?? []);

    const displayAddOns = useMemo(
        () =>
            addOns.map((addon) =>
                addon.hasQty === false
                    ? { ...addon, qty: guests.length }
                    : addon,
            ),
        [addOns, guests.length],
    );

    useEffect(() => {
        if (!addOnsLocked) {
            onAddOnsChange?.(displayAddOns);
        }
    }, [addOnsLocked, displayAddOns, onAddOnsChange]);

    // ─── Payment state ─────────────────────────────────────────────────
    const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
    const [paymentPopoverOpen, setPaymentPopoverOpen] = useState(false);
    const [manualDialogOpen, setManualDialogOpen] = useState(false);

    // ─── Derived calculations ──────────────────────────────────────────

    const categoryBreakdown = useMemo(() => {
        const map = new Map<
            string,
            {
                name: string;
                qty: number;
                unitPrice: number;
            }
        >();
        for (const g of guests) {
            const cat = g.priceCategory ?? 'Uncategorized';
            const existing = map.get(cat);
            if (existing) {
                existing.qty += 1;
            } else {
                map.set(cat, {
                    name: PRICE_CATEGORY_LABELS[cat] ?? cat,
                    qty: 1,
                    unitPrice: g.originalPrice ?? g.price,
                });
            }
        }
        return Array.from(map.values());
    }, [guests]);

    const visaBreakdown = useMemo(() => {
        const map = new Map<
            string,
            {
                key: string;
                label: string;
                qty: number;
                unitPrice: number;
                isTaxable: boolean;
            }
        >();

        for (const guest of guests) {
            const label = guest.visaTypeDescription?.trim();
            const unitPrice = Number(guest.visaTypePrice ?? 0);

            if (!label) {
                continue;
            }

            const key = [
                guest.visaCategoryItemId ?? label,
                unitPrice,
                guest.visaTypeIsTaxable ? 'taxable' : 'non-taxable',
            ].join(':');
            const existing = map.get(key);

            if (existing) {
                existing.qty += 1;
            } else {
                map.set(key, {
                    key,
                    label,
                    qty: 1,
                    unitPrice,
                    isTaxable: guest.visaTypeIsTaxable,
                });
            }
        }

        return Array.from(map.values());
    }, [guests]);

    const vatPct = minimumVatPct ?? 0;
    const platformFeePerPax =
        pricing.paxCount > 0 ? pricing.platformFee / pricing.paxCount : 0;
    const addOnPricing = useMemo(
        () => calculateAddOnPricing(displayAddOns, vatPct),
        [displayAddOns, vatPct],
    );
    const addOnsTotal = addOnPricing.addOnsTotal;
    const taxableAddOns = useMemo(
        () => displayAddOns.filter((addon) => addon.isTaxable),
        [displayAddOns],
    );
    const nonTaxableAddOns = useMemo(
        () =>
            displayAddOns.filter(
                (addon) => !addon.isTaxable && addon.unitPrice * addon.qty > 0,
            ),
        [displayAddOns],
    );

    // FIX: taxableAddOnsTotal was used but never defined — compute it from taxableAddOns
    const taxableAddOnsTotal = taxableAddOns.reduce(
        (sum, a) => sum + a.unitPrice * a.qty,
        0,
    );

    const taxableVisaBreakdown = useMemo(
        () => visaBreakdown.filter((visa) => visa.isTaxable),
        [visaBreakdown],
    );
    const nonTaxableVisaBreakdown = useMemo(
        () => visaBreakdown.filter((visa) => !visa.isTaxable),
        [visaBreakdown],
    );
    const nonTaxableAddOnsTotal = addOnsTotal - taxableAddOnsTotal;
    const nonTaxableVisaTotal = nonTaxableVisaBreakdown.reduce(
        (sum, visa) => sum + visa.unitPrice * visa.qty,
        0,
    );
    const taxableSubtotal =
        pricing.discountedSubtotal +
        pricing.taxableVisaTotal +
        taxableAddOnsTotal;
    const otherCostsTotal = nonTaxableAddOnsTotal + nonTaxableVisaTotal;
    const totalPpn = pricing.ppn + addOnPricing.addOnsVat;
    const hasGrandTotalOverride =
        grandTotalOverride !== null && grandTotalOverride !== undefined;
    const grandTotal = hasGrandTotalOverride
        ? grandTotalOverride
        : pricing.totalPrice + addOnsTotal + addOnPricing.addOnsVat;
    const effectiveDownPaymentRule =
        downPaymentRule ??
        (minimumDownPaymentPct !== null && minimumDownPaymentPct !== undefined
            ? {
                  mode: 'grand_total_percent' as const,
                  percent: minimumDownPaymentPct,
              }
            : null);
    const dpPct =
        effectiveDownPaymentRule?.mode === 'grand_total_percent'
            ? effectiveDownPaymentRule.percent
            : 0;
    const dpRate = dpPct / 100;
    const perPaxDownPaymentAmount =
        effectiveDownPaymentRule?.mode === 'per_pax_amount'
            ? effectiveDownPaymentRule.amount
            : 0;
    const effectivePaymentType: PaymentType | null = forceBalancePayment
        ? 'full_payment'
        : paymentType;
    const downPaymentAmount =
        effectiveDownPaymentRule?.mode === 'per_pax_amount'
            ? Math.round(perPaxDownPaymentAmount * guests.length)
            : Math.round(grandTotal * dpRate);
    const fullPaymentAmount = grandTotal;
    const payAmount =
        effectivePaymentType === 'full_payment'
            ? forceBalancePayment
                ? remainingBalance
                : fullPaymentAmount
            : effectivePaymentType === 'down_payment'
              ? downPaymentAmount
              : null;
    const displayPaidAmount = Math.max(0, paidAmount);
    const displayRemainingBalance =
        forceBalancePayment || hasGrandTotalOverride
            ? Math.max(0, remainingBalance)
            : Math.max(0, grandTotal - displayPaidAmount);
    const isFullPaymentUnavailable = !fullPaymentAvailable;
    const isCurrentPaymentUnavailable =
        isFullPaymentUnavailable && effectivePaymentType === 'full_payment';
    const arePaymentMethodsUnavailable =
        !manualPaymentAvailable && !onlinePaymentAvailable;
    const isPaymentSelectionMissing = !effectivePaymentType;
    const paymentControlsHidden = readOnly || hidePaymentControls;
    const hasDownPayment = displayPaidAmount > 0 && displayRemainingBalance > 0;
    const isBalancePaymentMode = hasDownPayment || forceBalancePayment;
    const showPaymentOptionSelector =
        !paymentControlsHidden && !isBalancePaymentMode;
    const showPaymentPanelColumns =
        !paymentControlsHidden || preservePaymentPanelColumns;
    const downPaymentPaidDate = formatPaymentDate(downPaymentPaidAt);
    const downPaymentAmountLabel =
        effectiveDownPaymentRule?.mode === 'grand_total_percent'
            ? `DP Amount (${formatPercentageValue(effectiveDownPaymentRule.percent)}%)`
            : effectiveDownPaymentRule?.mode === 'per_pax_amount'
              ? `DP Amount (${formatCurrency(effectiveDownPaymentRule.amount)} / pax)`
              : 'DP Amount';
    const activePaymentAmountLabel = forceBalancePayment
        ? 'Remaining Balance'
        : effectivePaymentType === 'down_payment'
          ? downPaymentAmountLabel
          : effectivePaymentType === 'full_payment'
            ? 'Full Payment Amount'
            : 'Payment Amount';
    const paymentNotice =
        paymentErrorMessage ??
        (isCurrentPaymentUnavailable
            ? (paymentUnavailableReason ?? PAYMENT_UNAVAILABLE_MESSAGE)
            : arePaymentMethodsUnavailable
              ? 'Payment methods are currently unavailable for this tour.'
              : null);
    const paymentDetailsPanel = (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Grand Total
                </p>
                <motion.p
                    key={grandTotal}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="text-right text-2xl font-extrabold text-foreground sm:text-3xl"
                >
                    {formatCurrency(grandTotal)}
                </motion.p>
            </div>
            {hasDownPayment && (
                <div className="space-y-3 border-t border-border/60 pt-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Down Payment
                                </p>
                                {downPaymentPaidDate && (
                                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                                        {downPaymentPaidDate}
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-right text-sm font-bold text-emerald-600">
                            {formatCurrency(displayPaidAmount)}
                        </p>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Remaining Balance
                        </p>
                        <p className="text-right text-sm font-bold text-red-600">
                            {formatCurrency(displayRemainingBalance)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
    const renderPaymentOptionSelector = () =>
        showPaymentOptionSelector ? (
            <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Select Payment Option
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        aria-pressed={paymentType === 'down_payment'}
                        className={cn(
                            'h-10 rounded-md border px-3 text-sm font-medium transition-all',
                            paymentType === 'down_payment'
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-background text-muted-foreground hover:text-foreground',
                            (!downPaymentAvailable || forceBalancePayment) &&
                                'cursor-not-allowed opacity-50',
                        )}
                        onClick={() => {
                            if (downPaymentAvailable && !forceBalancePayment) {
                                setPaymentType('down_payment');
                            }
                        }}
                        disabled={!downPaymentAvailable || forceBalancePayment}
                    >
                        Down Payment
                    </button>
                    <button
                        type="button"
                        aria-pressed={
                            paymentType === 'full_payment' ||
                            forceBalancePayment
                        }
                        className={cn(
                            'h-10 rounded-md border px-3 text-sm font-medium transition-all',
                            paymentType === 'full_payment' ||
                                forceBalancePayment
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-background text-muted-foreground hover:text-foreground',
                            isFullPaymentUnavailable &&
                                'cursor-not-allowed opacity-50',
                        )}
                        onClick={() => {
                            if (!isFullPaymentUnavailable) {
                                setPaymentType('full_payment');
                            }
                        }}
                        disabled={isFullPaymentUnavailable}
                    >
                        Full Payment
                    </button>
                </div>

                {(payAmount !== null || paymentActionButton) && (
                    <div
                        className={cn(
                            'grid gap-2',
                            !hasDownPayment && 'sm:grid-cols-2',
                        )}
                    >
                        {payAmount !== null && (
                            <div className="rounded-lg border bg-background px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    {activePaymentAmountLabel}
                                </p>
                                <p className="mt-0.5 text-base font-bold text-primary">
                                    {formatCurrency(payAmount)}
                                </p>
                            </div>
                        )}
                        {!hasDownPayment && paymentActionButton && (
                            <div
                                className={cn(
                                    'flex items-end justify-end',
                                    payAmount === null && 'sm:col-start-2',
                                )}
                            >
                                {paymentActionButton}
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : null;
    const openProformaInvoicePreview = useCallback(async () => {
        if (
            !proformaInvoicePreview?.submitUrl ||
            typeof document === 'undefined'
        ) {
            return;
        }

        const previewWindow = window.open('', '_blank');
        previewWindow?.document.write(
            '<!doctype html><title>Loading...</title><body style="font-family:sans-serif;padding:24px;">Preparing proforma invoice...</body>',
        );

        const formData = new FormData();

        if (proformaInvoicePreview.invoiceType) {
            formData.append('type', proformaInvoicePreview.invoiceType);
        }

        formData.append(
            'preview_status',
            (proformaInvoicePreview.statusLabel ?? 'unpaid').toLowerCase(),
        );
        formData.append('tax_amount', String(totalPpn));
        formData.append('grand_total', String(grandTotal));
        formData.append('platform_fee', String(pricing.platformFee));

        displayAddOns
            .filter((addon) => addon.qty > 0)
            .forEach((addon, index) => {
                formData.append(`addons[${index}][name]`, addon.label);
                formData.append(
                    `addons[${index}][price]`,
                    String(addon.unitPrice),
                );
                formData.append(`addons[${index}][qty]`, String(addon.qty));
                formData.append(
                    `addons[${index}][is_taxable]`,
                    addon.isTaxable ? '1' : '0',
                );
            });

        visaBreakdown
            .filter((visa) => !visa.isTaxable && visa.qty > 0)
            .forEach((visa, index) => {
                formData.append(
                    `visa_items[${index}][description]`,
                    visa.label,
                );
                formData.append(
                    `visa_items[${index}][price]`,
                    String(visa.unitPrice),
                );
                formData.append(`visa_items[${index}][qty]`, String(visa.qty));
            });

        try {
            const response = await axios.post(
                proformaInvoicePreview.submitUrl,
                formData,
                {
                    responseType: 'blob',
                    withCredentials: true,
                    withXSRFToken: true,
                    headers: {
                        Accept: 'application/pdf',
                    },
                },
            );
            const pdfBlob = response.data;
            const pdfUrl = URL.createObjectURL(pdfBlob);

            if (previewWindow) {
                previewWindow.location.href = pdfUrl;
            } else {
                window.open(pdfUrl, '_blank');
            }

            window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
        } catch (error) {
            if (previewWindow) {
                previewWindow.document.body.innerHTML =
                    '<p style="font-family:sans-serif;padding:24px;">Unable to open proforma invoice preview. Please try again.</p>';
            }

            console.error('Failed to open proforma invoice preview', error);
        }
    }, [
        displayAddOns,
        grandTotal,
        pricing.platformFee,
        proformaInvoicePreview,
        totalPpn,
        visaBreakdown,
    ]);
    const proformaInvoiceButton = showProformaInvoiceButton ? (
        <Tooltip>
            <TooltipTrigger asChild>
                {proformaInvoicePreview?.submitUrl ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="gap-2"
                        onClick={openProformaInvoicePreview}
                    >
                        <ReceiptIcon className="size-4" />
                        Proforma Invoice
                    </Button>
                ) : proformaInvoiceUrl ? (
                    <Button
                        variant="outline"
                        size="lg"
                        className="gap-2"
                        asChild
                    >
                        <a
                            href={proformaInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ReceiptIcon className="size-4" />
                            Proforma Invoice
                        </a>
                    </Button>
                ) : (
                    <span className="inline-flex">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled
                            className="gap-2"
                        >
                            <ReceiptIcon className="size-4" />
                            Proforma Invoice
                        </Button>
                    </span>
                )}
            </TooltipTrigger>
            <TooltipContent>
                <p>
                    {proformaInvoicePreview?.submitUrl || proformaInvoiceUrl
                        ? 'Open proforma invoice in a new tab'
                        : 'Proforma invoice is not available yet'}
                </p>
            </TooltipContent>
        </Tooltip>
    ) : null;

    // ─── Add-on qty handler ────────────────────────────────────────────
    const updateAddOnQty = useCallback(
        (key: string, delta: number) => {
            if (addOnsLocked) {
                return;
            }

            setAddOns((prev) =>
                prev.map((a) =>
                    a.key === key
                        ? {
                              ...a,
                              qty: Math.max(
                                  0,
                                  Math.min(guests.length, a.qty + delta),
                              ),
                          }
                        : a,
                ),
            );
        },
        [addOnsLocked, guests.length],
    );

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        const selectedPaymentType = effectivePaymentType;

        if (
            paymentControlsHidden ||
            isCurrentPaymentUnavailable ||
            arePaymentMethodsUnavailable ||
            !selectedPaymentType ||
            payAmount === null
        ) {
            return;
        }

        if (
            (method === 'manual_transfer' && !manualPaymentAvailable) ||
            (method === 'midtrans' && !onlinePaymentAvailable)
        ) {
            return;
        }

        setPaymentPopoverOpen(false);
        if (method === 'manual_transfer') {
            setManualDialogOpen(true);
            return;
        }

        onPayNow(selectedPaymentType, method, displayAddOns, payAmount);
    };

    const handleManualSubmit = (data: ManualPaymentData) => {
        const selectedPaymentType = effectivePaymentType;

        if (
            paymentControlsHidden ||
            isCurrentPaymentUnavailable ||
            !manualPaymentAvailable ||
            !selectedPaymentType ||
            payAmount === null
        ) {
            return;
        }

        onPayNow(
            selectedPaymentType,
            'manual_transfer',
            displayAddOns,
            payAmount,
            data,
        );
    };
    const paymentActionButton = !paymentControlsHidden ? (
        <Popover
            open={paymentPopoverOpen}
            onOpenChange={(open) => {
                if (
                    !isCurrentPaymentUnavailable &&
                    !isPaymentSelectionMissing
                ) {
                    setPaymentPopoverOpen(open);
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    size="lg"
                    disabled={
                        isSubmitting ||
                        isCurrentPaymentUnavailable ||
                        arePaymentMethodsUnavailable ||
                        isPaymentSelectionMissing
                    }
                    className="gap-2 bg-[#1ebe5d] px-6 text-white shadow-lg hover:bg-[#19a34f]"
                >
                    {isSubmitting
                        ? 'Processing...'
                        : arePaymentMethodsUnavailable
                          ? 'Payment Unavailable'
                          : 'Pay Now!'}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2" sideOffset={8}>
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Payment Method
                </p>
                <div className="space-y-1">
                    {manualPaymentAvailable && (
                        <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                            onClick={() =>
                                handlePaymentMethodSelect('manual_transfer')
                            }
                        >
                            <BanknoteIcon className="size-5 text-emerald-600" />
                            <div className="text-left">
                                <p className="font-semibold">Manual Payment</p>
                                <p className="text-xs text-muted-foreground">
                                    Bank Transfer
                                </p>
                            </div>
                        </button>
                    )}
                    {onlinePaymentAvailable && (
                        <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                            onClick={() =>
                                handlePaymentMethodSelect('midtrans')
                            }
                        >
                            <CreditCardIcon className="size-5 text-blue-600" />
                            <div className="text-left">
                                <p className="font-semibold">Online Payment</p>
                                <p className="text-xs text-muted-foreground">
                                    Visa, Mastercard, Amex, QRIS, Virtual
                                    Account
                                </p>
                            </div>
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    ) : null;

    return (
        <TooltipProvider delayDuration={200}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-2">
                    <ReceiptIcon className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Price Summary</h2>
                </div>

                <div className="divide-y rounded-xl border bg-card shadow-sm">
                    {/* ─── Booking Contact ────────────────────────────────────────── */}
                    <div className="p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Booking Contact
                        </p>
                        <div className="grid gap-1 text-sm sm:grid-cols-3">
                            <p>
                                <span className="text-muted-foreground">
                                    Name:
                                </span>{' '}
                                {contact.name}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Email:
                                </span>{' '}
                                {contact.email}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Phone:
                                </span>{' '}
                                {contact.phone}
                            </p>
                        </div>
                        {contact.notes && (
                            <p className="mt-1 text-sm">
                                <span className="text-muted-foreground">
                                    Notes:
                                </span>{' '}
                                {contact.notes}
                            </p>
                        )}
                    </div>

                    {/* ─── Pricing Breakdown ──────────────────────────────────────── */}
                    <div className="p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Pricing Breakdown
                        </p>

                        <div className="space-y-2 text-sm">
                            {/* Category line items */}
                            {categoryBreakdown.map((cat) => (
                                <div
                                    key={cat.name}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-muted-foreground">
                                        {cat.name}
                                    </span>
                                    <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {formatCurrency(cat.unitPrice)}
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            x{cat.qty}
                                        </span>
                                        <span className="min-w-[100px] text-right font-medium">
                                            {formatCurrency(
                                                cat.unitPrice * cat.qty,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Subtotal + PPN summary block (right-aligned) */}
                            <div className="mt-1 border-t border-dashed pt-2">
                                <div className="flex justify-end">
                                    <div className="w-full max-w-xs space-y-1.5">
                                        {pricing.promotionDiscount > 0 && (
                                            <div className="flex justify-between text-emerald-600">
                                                <span>Promotion Discount</span>
                                                <span className="font-medium">
                                                    −
                                                    {formatCurrency(
                                                        pricing.promotionDiscount,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {taxableVisaBreakdown.map((visa) => (
                                            <div
                                                key={`visa-${visa.key}`}
                                                className="flex items-center justify-between gap-3 text-muted-foreground"
                                            >
                                                <div className="min-w-0">
                                                    <span className="block truncate">
                                                        {visa.label}
                                                    </span>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-3">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        x{visa.qty}
                                                    </span>
                                                    <span className="min-w-[100px] text-right font-medium text-foreground">
                                                        {formatCurrency(
                                                            visa.unitPrice *
                                                                visa.qty,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {taxableAddOns.map((addon) => (
                                            <div
                                                key={`taxable-${addon.key}`}
                                                className="flex items-center justify-between gap-3 text-muted-foreground"
                                            >
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <span className="truncate">
                                                        {addon.label}
                                                    </span>
                                                    {addon.tooltip && (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <HelpCircleIcon className="size-3.5 shrink-0 cursor-help text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="right"
                                                                className="max-w-[200px] text-xs"
                                                            >
                                                                {addon.tooltip}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {addon.hasQty ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-6"
                                                                onClick={() =>
                                                                    updateAddOnQty(
                                                                        addon.key,
                                                                        -1,
                                                                    )
                                                                }
                                                                disabled={
                                                                    addOnsLocked ||
                                                                    addon.qty ===
                                                                        0
                                                                }
                                                            >
                                                                <MinusIcon className="size-3" />
                                                            </Button>
                                                            <span className="w-6 text-center text-xs font-semibold tabular-nums">
                                                                {addon.qty}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-6"
                                                                onClick={() =>
                                                                    updateAddOnQty(
                                                                        addon.key,
                                                                        1,
                                                                    )
                                                                }
                                                                disabled={
                                                                    addOnsLocked ||
                                                                    addon.qty >=
                                                                        guests.length
                                                                }
                                                            >
                                                                <PlusIcon className="size-3" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            x{addon.qty}
                                                        </span>
                                                    )}
                                                    <span className="min-w-[100px] text-right font-medium text-foreground">
                                                        {formatCurrency(
                                                            addon.unitPrice *
                                                                addon.qty,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t border-dashed pt-2">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Subtotal</span>
                                                <span className="font-medium text-foreground">
                                                    {formatCurrency(
                                                        taxableSubtotal,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>PPN ({vatPct}%)</span>
                                            <span className="font-medium text-foreground">
                                                {formatCurrency(totalPpn)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Platform Fee ────────────────────────────────────────── */}
                    {pricing.platformFee > 0 && (
                        <div className="p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Platform Fee
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {formatCurrency(platformFeePerPax)}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        x{pricing.paxCount}
                                    </span>
                                    <span className="min-w-[100px] text-right font-medium">
                                        {formatCurrency(pricing.platformFee)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {(nonTaxableVisaBreakdown.length > 0 ||
                        nonTaxableAddOns.length > 0) && (
                        <div className="p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Add-ons Cost
                            </p>

                            <div className="space-y-2 text-sm">
                                {nonTaxableVisaBreakdown.map((visa) => (
                                    <motion.div
                                        key={`non-taxable-visa-${visa.key}`}
                                        layout
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <span className="block truncate text-muted-foreground">
                                                {visa.label}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                x{visa.qty}
                                            </span>
                                            <span className="min-w-[100px] text-right font-medium">
                                                {formatCurrency(
                                                    visa.unitPrice * visa.qty,
                                                )}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                                {nonTaxableAddOns.map((addon) => (
                                    <motion.div
                                        key={addon.key}
                                        layout
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <span className="truncate text-muted-foreground">
                                                {addon.label}
                                            </span>
                                            {addon.tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircleIcon className="size-3.5 cursor-help text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="right"
                                                        className="max-w-[200px] text-xs"
                                                    >
                                                        {addon.tooltip}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {/* FIX: was </span> mismatched closing tag — restored correct
                                            structure: qty controls + currency span inside a </div> */}
                                        <div className="flex shrink-0 items-center gap-2">
                                            {addon.hasQty && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-6"
                                                        onClick={() =>
                                                            updateAddOnQty(
                                                                addon.key,
                                                                -1,
                                                            )
                                                        }
                                                        disabled={
                                                            addOnsLocked ||
                                                            addon.qty === 0
                                                        }
                                                    >
                                                        <MinusIcon className="size-3" />
                                                    </Button>
                                                    <span className="w-6 text-center text-xs font-semibold tabular-nums">
                                                        {addon.qty}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-6"
                                                        onClick={() =>
                                                            updateAddOnQty(
                                                                addon.key,
                                                                1,
                                                            )
                                                        }
                                                        disabled={
                                                            addOnsLocked ||
                                                            addon.qty >=
                                                                guests.length
                                                        }
                                                    >
                                                        <PlusIcon className="size-3" />
                                                    </Button>
                                                </div>
                                            )}
                                            <span className="min-w-[100px] text-right font-medium">
                                                {formatCurrency(
                                                    addon.unitPrice * addon.qty,
                                                )}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-3 flex justify-end border-t border-dashed pt-2">
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-muted-foreground">
                                        Add-ons Total
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(otherCostsTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Payment Selection ──────────────────────────────────────── */}
                    <div className="p-4">
                        <div
                            className={cn(
                                'grid gap-4 rounded-lg border bg-muted/20 p-4 sm:p-5',
                                showPaymentPanelColumns &&
                                    'lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:items-start',
                            )}
                        >
                            {renderPaymentOptionSelector()}
                            {!showPaymentOptionSelector &&
                                showPaymentPanelColumns && (
                                    <div className="hidden lg:block" />
                                )}

                            <div
                                className={cn(
                                    'space-y-4',
                                    showPaymentPanelColumns &&
                                        'lg:border-l lg:border-border/60 lg:pl-4',
                                )}
                            >
                                {paymentDetailsPanel}
                                {(proformaInvoiceButton ||
                                    (isBalancePaymentMode &&
                                        paymentActionButton)) && (
                                    <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
                                        {proformaInvoiceButton}
                                        {isBalancePaymentMode &&
                                            paymentActionButton}
                                    </div>
                                )}
                            </div>
                        </div>
                        {paymentNotice && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                                {paymentNotice}
                            </div>
                        )}
                    </div>
                </div>
                <ManualPaymentDialog
                    open={manualDialogOpen}
                    onClose={() => setManualDialogOpen(false)}
                    onSubmit={handleManualSubmit}
                    isSubmitting={isSubmitting}
                    vendorBank={
                        vendorBankInfo ?? {
                            bankName: '',
                            accountName: '',
                            accountNumber: '',
                        }
                    }
                    amount={payAmount ?? 0}
                />
            </motion.div>
        </TooltipProvider>
    );
}
