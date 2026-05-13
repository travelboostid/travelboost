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
  minimumDownPaymentPct?: number;
  minimumVatPct?: number;
  paidAmount?: number;
  remainingBalance?: number;
  forceBalancePayment?: boolean;
  vendorBankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────────────────

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
  forceBalancePayment = false,
  vendorBankInfo,
}: Step4Props) {
  // ─── Add-ons state ──────────────────────────────────────────────────
  const [addOns, setAddOns] = useState<AddOnItem[]>(initialAddOns ?? []);

  const displayAddOns = useMemo(
    () =>
      addOns.map((addon) =>
        addon.hasQty === false ? { ...addon, qty: guests.length } : addon,
      ),
    [addOns, guests.length],
  );

  useEffect(() => {
    onAddOnsChange?.(displayAddOns);
  }, [displayAddOns, onAddOnsChange]);

  // ─── Payment state ─────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState<PaymentType>('full_payment');
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
  const grandTotal = pricing.totalPrice + addOnsTotal;
  const dpPct = minimumDownPaymentPct ?? 50;
  const dpRate = dpPct / 100;
  const dpLabel = `Down Payment (${dpPct}%)`;
  const effectivePaymentType: PaymentType = forceBalancePayment
    ? 'full_payment'
    : paymentType;
  const payAmount =
    forceBalancePayment
      ? remainingBalance
      : paymentType === 'down_payment'
      ? Math.round(grandTotal * dpRate)
      : grandTotal;

  // ─── Add-on qty handler ────────────────────────────────────────────
  const updateAddOnQty = useCallback(
    (key: string, delta: number) => {
      setAddOns((prev) =>
        prev.map((a) =>
          a.key === key
            ? {
                ...a,
                qty: Math.max(0, Math.min(guests.length, a.qty + delta)),
              }
            : a,
        ),
      );
    },
    [guests.length],
  );

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentPopoverOpen(false);
    if (method === 'manual_transfer') {
      setManualDialogOpen(true);
      return;
    }

    onPayNow(effectivePaymentType, method, displayAddOns, payAmount);
  };

  const handleManualSubmit = (data: ManualPaymentData) => {
    onPayNow(
      effectivePaymentType,
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
                <span className="text-muted-foreground">Name:</span>{' '}
                {contact.name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{' '}
                {contact.email}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span>{' '}
                {contact.phone}
              </p>
            </div>
            {contact.notes && (
              <p className="mt-1 text-sm">
                <span className="text-muted-foreground">Notes:</span>{' '}
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
                  <span className="text-muted-foreground">{cat.name}</span>
                  <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatCurrency(cat.unitPrice)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      x{cat.qty}
                    </span>
                    <span className="min-w-[100px] text-right font-medium">
                      {formatCurrency(cat.unitPrice * cat.qty)}
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
                        {formatCurrency(pricing.subtotalGuests)}
                      </span>
                    </div>
                    {pricing.promotionDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Promotion Discount</span>
                        <span className="font-medium">
                          −{formatCurrency(pricing.promotionDiscount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>PPN ({vatPct}%)</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(pricing.ppn)}
                      </span>
                    </div>
                    {pricing.agentCommission > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Agent Commission</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(pricing.agentCommission)}
                        </span>
                      </div>
                    )}
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
              <span className="text-muted-foreground">Platform Fee</span>
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
                    <span className="text-muted-foreground">{addon.label}</span>
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
                          onClick={() => updateAddOnQty(addon.key, -1)}
                          disabled={addon.qty === 0}
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
                          onClick={() => updateAddOnQty(addon.key, 1)}
                          disabled={addon.qty >= guests.length}
                        >
                          <PlusIcon className="size-3" />
                        </Button>
                      </div>
                    )}
                    <span className="min-w-[100px] text-right font-medium">
                      {formatCurrency(addon.unitPrice * addon.qty)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add-ons subtotal */}
            <div className="mt-3 flex justify-end border-t border-dashed pt-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Add-ons Total</span>
                <span className="font-semibold">
                  {formatCurrency(addOnsTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Payment Selection ──────────────────────────────────────── */}
          <div className="p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Payment Option
            </p>

            {/* Two-button toggle */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-2">
              {forceBalancePayment ? (
                <div className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm">
                  Balance Payment
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-md bg-muted/40 p-0.5">
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                      paymentType === 'down_payment'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => setPaymentType('down_payment')}
                  >
                    {dpLabel}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                      paymentType === 'full_payment'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground opacity-50 hover:text-foreground',
                    )}
                    onClick={() => setPaymentType('full_payment')}
                  >
                    Full Payment
                  </button>
                </div>
              )}

              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">
                  {forceBalancePayment
                    ? 'Remaining Balance'
                    : paymentType === 'down_payment'
                    ? 'DP Amount'
                    : 'Full Payment Amount'}
                </p>
                <motion.p
                  key={payAmount}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-bold text-primary"
                >
                  {formatCurrency(payAmount)}
                </motion.p>
              </div>
            </div>
            {forceBalancePayment && (
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  Paid amount:{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  Remaining:{' '}
                  <span className="font-semibold text-primary">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ─── Grand Total + Pay Now ──────────────────────────────────── */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Grand Total</p>
                <motion.p
                  key={grandTotal}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-foreground"
                >
                  {formatCurrency(grandTotal)}
                </motion.p>
                {forceBalancePayment ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Pay remaining balance:{' '}
                    <span className="font-bold text-primary">
                      {formatCurrency(payAmount)}
                    </span>
                  </p>
                ) : paymentType === 'down_payment' && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Pay now:{' '}
                    <span className="font-bold text-primary">
                      {formatCurrency(payAmount)}
                    </span>{' '}
                    ({dpPct}%)
                  </p>
                )}
              </div>

              <Popover
                open={paymentPopoverOpen}
                onOpenChange={setPaymentPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    disabled={isSubmitting}
                    className="gap-2 bg-[#1ebe5d] px-6 text-white shadow-lg hover:bg-[#19a34f]"
                  >
                    {isSubmitting ? 'Processing...' : 'Pay Now!'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-2" sideOffset={8}>
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Payment Method
                  </p>
                  <div className="space-y-1">
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
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                      onClick={() => handlePaymentMethodSelect('midtrans')}
                    >
                      <CreditCardIcon className="size-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-semibold">Online Payment</p>
                        <p className="text-xs text-muted-foreground">
                          Visa, Mastercard, Amex, QRIS, Virtual Account
                        </p>
                      </div>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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
          amount={payAmount}
        />
      </motion.div>
    </TooltipProvider>
  );
}
