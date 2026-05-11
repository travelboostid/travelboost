import type { BookingStatusCode } from '@/types/booking';

// ─── Pricing Constants ──────────────────────────────────────────────────────────

export const PLATFORM_FEE_PER_PAX = 25_000; // IDR 25,000 per pax
export const PPN_RATE = 0.11; // 11%

// ─── Wizard Steps ───────────────────────────────────────────────────────────────

export const WIZARD_STEPS = [
  { id: 1 as const, label: 'Guest Information', icon: 'User' },
  { id: 2 as const, label: 'Room Arrangement', icon: 'BedDouble' },
  { id: 3 as const, label: 'Travel Documents', icon: 'FileText' },
  { id: 4 as const, label: 'Booking Summary', icon: 'Receipt' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

// ─── Title Options ──────────────────────────────────────────────────────────────

export const TITLE_OPTIONS: Record<string, string[]> = {
  adult: ['Mr', 'Mrs', 'Ms'],
  child: ['Mstr (Male)', 'Miss (Female)'],
  infant: ['Mstr (Male)', 'Miss (Female)'],
};

// ─── Category Filter (maps guest type → allowed price_categories.name values) ──

export const CATEGORY_FILTER: Record<string, string[]> = {
  adult: [
    'Single',
    'Double',
    'Triple',
    'Adult Single',
    'Adult Double',
    'Adult Twin',
    'Adult Triple',
    'Adult Extra Bed',
  ],
  child: ['Child With Bed', 'Child No Bed'],
  infant: ['Infant', 'infant'],
};

// ─── Price Category Labels ──────────────────────────────────────────────────────

export const PRICE_CATEGORY_LABELS: Record<string, string> = {
  Single: 'Single',
  Double: 'Double',
  Triple: 'Triple',
  'Adult Single': 'Adult Single',
  'Adult Double': 'Adult Double',
  'Adult Twin': 'Adult Twin',
  'Adult Triple': 'Adult Triple',
  'Adult Extra Bed': 'Adult Extra Bed',
  'Child With Bed': 'Child With Bed',
  'Child No Bed': 'Child No Bed',
  Infant: 'Infant',
  // Legacy keys (for backward compat with existing bookings)
  adult_single: 'Adult - Single Bed',
  adult_double: 'Adult - Double Bed',
  adult_twin: 'Adult - Twin Bed',
  child: 'Child',
  extra_bed: 'Extra Bed',
  infant: 'Infant (no seat)',
};

// ─── Booking Status Config ──────────────────────────────────────────────────────

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatusCode,
  {
    label: string;
    code: string;
    color: string;
    bgClass: string;
    textClass: string;
  }
> = {
  waiting_payment: {
    label: 'Waiting Payment',
    code: 'WP',
    color: 'amber',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    textClass: 'text-amber-600',
  },
  waiting_payment_approval: {
    label: 'Waiting Payment Approval',
    code: 'WPA',
    color: 'sky',
    bgClass: 'bg-sky-500/10 border-sky-500/20',
    textClass: 'text-sky-600',
  },
  down_payment: {
    label: 'Down Payment',
    code: 'DP',
    color: 'blue',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    textClass: 'text-blue-600',
  },
  full_payment: {
    label: 'Full Payment',
    code: 'FP',
    color: 'green',
    bgClass: 'bg-green-500/10 border-green-500/20',
    textClass: 'text-green-600',
  },
  reserved: {
    label: 'Booking Reserved',
    code: 'BRS',
    color: 'teal',
    bgClass: 'bg-teal-500/10 border-teal-500/20',
    textClass: 'text-teal-600',
  },
  booking_reserved: {
    label: 'Booking Reserved',
    code: 'BRS',
    color: 'teal',
    bgClass: 'bg-teal-500/10 border-teal-500/20',
    textClass: 'text-teal-600',
  },
  manual_reserved: {
    label: 'Manual Reserved',
    code: 'RS',
    color: 'violet',
    bgClass: 'bg-violet-500/10 border-violet-500/20',
    textClass: 'text-violet-600',
  },
  cancel: {
    label: 'Cancel',
    code: 'CA',
    color: 'red',
    bgClass: 'bg-red-500/10 border-red-500/20',
    textClass: 'text-red-600',
  },
  refund: {
    label: 'Refund',
    code: 'RF',
    color: 'purple',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
    textClass: 'text-purple-600',
  },
  expired: {
    label: 'Expired',
    code: 'EX',
    color: 'gray',
    bgClass: 'bg-gray-500/10 border-gray-500/20',
    textClass: 'text-gray-500',
  },
  waiting_list: {
    label: 'Waiting List',
    code: 'WL',
    color: 'orange',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
    textClass: 'text-orange-600',
  },
};

// ─── Currency Formatter ─────────────────────────────────────────────────────────

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatIDR = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '—';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
