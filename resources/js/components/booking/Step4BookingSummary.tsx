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

export type AddOnItem = {
    key: string;
    label: string;
    unitPrice: number;
    qty: number;
    tooltip?: string;
    hasQty?: boolean;
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
    addOnsReadOnly?: boolean;
    downPaymentAvailable?: boolean;
    fullPaymentAvailable?: boolean;
    paymentUnavailableReason?: string | null;
    paymentErrorMessage?: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────────────────

const PAYMENT_UNAVAILABLE_MESSAGE =
    'Payment is temporarily unavailable. Please try again later or contact customer support.';

export default function Step4BookingSummary({
    contact,
    guests,
    pricing,
    onPayNow,
    isSubmitting = false,
    initialAddOns,
    onAddOnsChange,
    minimumDownPaymentPct,
    minimumVatPct,
    paidAmount = 0,
    remainingBalance = 0,
    grandTotalOverride = null,
    forceBalancePayment = false,
    vendorBankInfo,
    readOnly = false,
    hidePaymentControls = false,
    addOnsReadOnly = false,
    downPaymentAvailable = true,
    fullPaymentAvailable = true,
    paymentUnavailableReason = null,
    paymentErrorMessage = null,
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

    const addOnsTotal = useMemo(
        () => displayAddOns.reduce((sum, a) => sum + a.unitPrice * a.qty, 0),
        [displayAddOns],
    );

    const vatPct = minimumVatPct ?? 11;
    const hasGrandTotalOverride =
        grandTotalOverride !== null && grandTotalOverride !== undefined;
    const grandTotal = hasGrandTotalOverride
        ? grandTotalOverride
        : pricing.totalPrice + addOnsTotal;
    const dpPct = minimumDownPaymentPct ?? 0;
    const dpRate = dpPct / 100;
    const dpLabel = downPaymentAvailable
        ? `Down Payment (${dpPct}%)`
        : 'Down Payment';
    const effectivePaymentType: PaymentType | null = forceBalancePayment
        ? 'full_payment'
        : paymentType;
    const downPaymentAmount = Math.round(grandTotal * dpRate);
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
    const isPaymentSelectionMissing = !effectivePaymentType;
    const paymentControlsHidden = readOnly || hidePaymentControls;
    const activePaymentAmountLabel = forceBalancePayment
        ? 'Remaining Balance'
        : effectivePaymentType === 'down_payment'
          ? 'DP Amount'
          : effectivePaymentType === 'full_payment'
            ? 'Full Payment Amount'
            : 'Payment Amount';
    const paymentNotice =
        paymentErrorMessage ??
        (isCurrentPaymentUnavailable
            ? (paymentUnavailableReason ?? PAYMENT_UNAVAILABLE_MESSAGE)
            : null);
    const paymentSummaryStack = (
        <div className="space-y-1.5 lg:text-right">
            <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Grand Total
                </p>
                <motion.p
                    key={grandTotal}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="text-xl font-bold text-foreground"
                >
                    {formatCurrency(grandTotal)}
                </motion.p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-1.5">
                <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Remaining Balance
                    </p>
                    <p className="text-sm font-bold text-red-600">
                        {formatCurrency(displayRemainingBalance)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Paid
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(displayPaidAmount)}
                    </p>
                </div>
            </div>
        </div>
    );

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
            !selectedPaymentType ||
            payAmount === null
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
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span className="font-medium text-foreground">
                                                {formatCurrency(
                                                    pricing.subtotalGuests,
                                                )}
                                            </span>
                                        </div>
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
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>PPN ({vatPct}%)</span>
                                            <span className="font-medium text-foreground">
                                                {formatCurrency(pricing.ppn)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Platform Fee ────────────────────────────────────────── */}
                    <div className="p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Platform Fee
                        </p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Platform Fee
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-muted-foreground">
                                    x{pricing.paxCount}
                                </span>
                                <span className="min-w-[100px] text-right font-medium">
                                    {formatCurrency(pricing.platformFee)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Add-ons Cost ───────────────────────────────────────────── */}
                    <div className="p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Add-ons Cost
                        </p>

                        <div className="space-y-2 text-sm">
                            {displayAddOns.map((addon) => (
                                <motion.div
                                    key={addon.key}
                                    layout
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-muted-foreground">
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

                                    <div className="flex items-center gap-3">
                                        {addon.hasQty && (
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-7"
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
                                                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                                    {addon.qty}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-7"
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

                        {/* Add-ons subtotal */}
                        <div className="mt-3 flex justify-end border-t border-dashed pt-2">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                    Add-ons Total
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(addOnsTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Payment Selection ──────────────────────────────────────── */}
                    {paymentControlsHidden && (
                        <div className="p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Payment Summary
                            </p>
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(210px,250px)]">
                                <div className="hidden lg:block" />
                                {paymentSummaryStack}
                            </div>
                        </div>
                    )}

                    {!paymentControlsHidden && (
                        <div className="p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Payment Option
                            </p>

                            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(210px,250px)] lg:items-start">
                                <div>
                                    {forceBalancePayment ? (
                                        <div className="inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm">
                                            Balance Payment
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 rounded-md bg-muted/40 p-0.5">
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                                                    paymentType ===
                                                        'down_payment'
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground',
                                                    !downPaymentAvailable &&
                                                        'cursor-not-allowed opacity-50',
                                                )}
                                                onClick={() => {
                                                    if (downPaymentAvailable) {
                                                        setPaymentType(
                                                            'down_payment',
                                                        );
                                                    }
                                                }}
                                                disabled={!downPaymentAvailable}
                                            >
                                                {dpLabel}
                                            </button>
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                                                    paymentType ===
                                                        'full_payment'
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground',
                                                    isFullPaymentUnavailable &&
                                                        'cursor-not-allowed opacity-50',
                                                )}
                                                onClick={() => {
                                                    if (
                                                        !isFullPaymentUnavailable
                                                    ) {
                                                        setPaymentType(
                                                            'full_payment',
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    isFullPaymentUnavailable
                                                }
                                            >
                                                Full Payment
                                            </button>
                                        </div>
                                    )}

                                    <div className="ml-1 mt-5 max-w-xs">
                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                            {activePaymentAmountLabel}
                                        </p>
                                        <p
                                            className={cn(
                                                'text-sm font-bold',
                                                payAmount === null
                                                    ? 'text-muted-foreground'
                                                    : 'text-primary',
                                            )}
                                        >
                                            {payAmount === null
                                                ? 'Select payment option'
                                                : formatCurrency(payAmount)}
                                        </p>
                                    </div>
                                </div>

                                {paymentSummaryStack}
                            </div>
                            {paymentNotice && (
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                                    {paymentNotice}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Pay Now ────────────────────────────────────────────────── */}
                    {!paymentControlsHidden && (
                        <div className="p-4">
                            <div className="flex justify-end">
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
                                                isPaymentSelectionMissing
                                            }
                                            className="gap-2 bg-[#1ebe5d] px-6 text-white shadow-lg hover:bg-[#19a34f]"
                                        >
                                            {isSubmitting
                                                ? 'Processing...'
                                                : isPaymentSelectionMissing
                                                  ? 'Select Payment Option'
                                                  : 'Pay Now!'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="end"
                                        className="w-64 p-2"
                                        sideOffset={8}
                                    >
                                        <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Select Payment Method
                                        </p>
                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                                onClick={() =>
                                                    handlePaymentMethodSelect(
                                                        'manual_transfer',
                                                    )
                                                }
                                            >
                                                <BanknoteIcon className="size-5 text-emerald-600" />
                                                <div className="text-left">
                                                    <p className="font-semibold">
                                                        Manual Payment
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Bank Transfer
                                                    </p>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                                onClick={() =>
                                                    handlePaymentMethodSelect(
                                                        'midtrans',
                                                    )
                                                }
                                            >
                                                <CreditCardIcon className="size-5 text-blue-600" />
                                                <div className="text-left">
                                                    <p className="font-semibold">
                                                        Online Payment
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Visa, Mastercard, Amex,
                                                        QRIS, Virtual Account
                                                    </p>
                                                </div>
                                            </button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
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
