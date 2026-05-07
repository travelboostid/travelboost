import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CATEGORY_FILTER,
  formatCurrency,
  PRICE_CATEGORY_LABELS,
  TITLE_OPTIONS,
} from '@/constants/booking';
import { cn } from '@/lib/utils';
import type { BookingContact, GuestEntry, TourPrice } from '@/types/booking';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircleIcon,
  Baby,
  MinusIcon,
  PhoneIcon,
  PlusIcon,
  UserIcon,
  UserMinusIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

export function calculateAgeAtDeparture(
  dob: string,
  departure: string,
): number | null {
  if (!dob || !departure) return null;
  const dobDate = new Date(dob);
  const depDate = new Date(departure);
  if (isNaN(dobDate.getTime()) || isNaN(depDate.getTime())) return null;

  let age = depDate.getFullYear() - dobDate.getFullYear();
  const m = depDate.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && depDate.getDate() < dobDate.getDate())) {
    age--;
  }
  return age;
}

// ─── Stepper ────────────────────────────────────────────────────────────────────

function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
  sublabel,
  icon: Icon,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/20">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {sublabel}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MinusIcon className="size-4" />
        </button>
        <span className="w-10 text-center text-base font-bold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Guest Detail Form ──────────────────────────────────────────────────────────

function GuestDetailForm({
  guest,
  index,
  onChange,
  onRemove,
  tourPrices,
  departureDate,
}: {
  guest: GuestEntry;
  index: number;
  onChange: (g: GuestEntry) => void;
  onRemove?: () => void;
  tourPrices: TourPrice[];
  departureDate: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isAdult = guest.type === 'adult';
  const isInfant = guest.type === 'infant';
  const titleOptions = TITLE_OPTIONS[guest.type] ?? [];
  const allowedCategories = CATEGORY_FILTER[guest.type] ?? [];
  const availablePrices = tourPrices.filter((p) =>
    allowedCategories.includes(p.categoryName),
  );

  const computeDiscountedPrice = (tp: TourPrice): { discounted: number; original: number } => {
    const base = tp.price;
    let discounted = base;
    if (tp.promotionRate > 0) {
      discounted = base - (base * tp.promotionRate) / 100;
    } else if (tp.promotion > 0) {
      discounted = base - tp.promotion;
    }
    return { discounted: Math.max(0, Math.round(discounted)), original: base };
  };

  useEffect(() => {
    if (availablePrices.length === 1 && !guest.tourPriceId) {
      const selected = availablePrices[0];
      const { discounted, original } = computeDiscountedPrice(selected);
      onChange({
        ...guest,
        priceCategory: selected.categoryName,
        tourPriceId: selected.tourPriceId,
        price: discounted,
        originalPrice: original,
        roomTypeDescription: selected.description,
      });
    }
  }, [availablePrices.length, guest.tourPriceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePriceCategoryChange = (tourPriceId: string) => {
    const selected = tourPrices.find(
      (p) => p.tourPriceId === Number(tourPriceId),
    );
    if (selected) {
      const { discounted, original } = computeDiscountedPrice(selected);
      onChange({
        ...guest,
        priceCategory: selected.categoryName,
        tourPriceId: selected.tourPriceId,
        price: discounted,
        originalPrice: original,
        roomTypeDescription: selected.description,
      });
    }
  };

  const hasPromotion = (tp: TourPrice) => tp.promotionRate > 0 || tp.promotion > 0;

  const age = calculateAgeAtDeparture(guest.dateOfBirth, departureDate);
  let ageError = '';
  if (age !== null && age >= 0) {
    if (guest.type === 'infant' && age >= 2) {
      ageError = 'Infant must be under 2 years old at departure.';
    } else if (guest.type === 'child' && (age < 2 || age >= 12)) {
      ageError = 'Child must be between 2 and 11 years old at departure.';
    } else if (guest.type === 'adult' && age < 12) {
      ageError = 'Adult must be 12 years or older at departure.';
    }
  } else if (age !== null && age < 0) {
    ageError = 'Date of birth cannot be after departure date.';
  }

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/50 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-full text-xs font-bold',
            isAdult
              ? 'bg-primary/10 text-primary'
              : isInfant
                ? 'bg-purple-500/10 text-purple-600'
                : 'bg-amber-500/10 text-amber-600',
          )}
        >
          {index + 1}
        </div>
        <h4 className="text-sm font-semibold">Guest {index + 1}</h4>
        <Badge
          variant="secondary"
          className={cn(
            'px-2 py-0 text-[10px] font-bold uppercase',
            isAdult
              ? 'bg-primary/10 text-primary'
              : isInfant
                ? 'bg-purple-500/10 text-purple-600'
                : 'bg-amber-500/10 text-amber-600',
          )}
        >
          {guest.type}
        </Badge>
        {guest.priceCategory && (
          <Badge variant="outline" className="px-2 py-0 text-[10px]">
            {PRICE_CATEGORY_LABELS[guest.priceCategory] ?? guest.priceCategory}
          </Badge>
        )}
        {onRemove && (
          <>
            <button
              type="button"
              title="Remove this guest"
              className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <XIcon className="size-3" />
              Remove Guest
            </button>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Guest {index + 1}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove{' '}
                    <strong>
                      {[guest.title, guest.firstName, guest.lastName]
                        .filter(Boolean)
                        .join(' ') || 'this guest'}
                    </strong>{' '}
                    from the list? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      setConfirmOpen(false);
                      onRemove();
                    }}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      {/* Row 1: Title, First Name, Last Name */}
      <div className="grid gap-3 sm:grid-cols-[130px_1fr_1fr]">
        <div className="grid gap-1">
          <Label className="text-[11px] text-muted-foreground">Title *</Label>
          <Select
            value={guest.title}
            onValueChange={(v) => onChange({ ...guest, title: v })}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {titleOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px] text-muted-foreground">
            First Name *
          </Label>
          <Input
            placeholder="John"
            value={guest.firstName}
            onChange={(e) => onChange({ ...guest, firstName: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px] text-muted-foreground">
            Last Name *
          </Label>
          <Input
            placeholder="Doe"
            value={guest.lastName}
            onChange={(e) => onChange({ ...guest, lastName: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Row 2: Date of Birth, Place of Birth */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label className="text-[11px] text-muted-foreground">
            Date of Birth{' '}
            <span className="font-normal opacity-70">
              {guest.type === 'infant' && '(0-2 years)'}
              {guest.type === 'child' && '(2-11 years)'}
              {guest.type === 'adult' && '(12+ years)'}
            </span>{' '}
            *
          </Label>
          <Input
            type="date"
            value={guest.dateOfBirth}
            onChange={(e) =>
              onChange({ ...guest, dateOfBirth: e.target.value })
            }
            className={cn(
              'h-9 text-sm',
              ageError && 'border-destructive focus-visible:ring-destructive',
            )}
            aria-invalid={!!ageError}
          />
          {ageError && (
            <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-destructive">
              <AlertCircleIcon className="size-3" />
              {ageError}
            </p>
          )}
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px] text-muted-foreground">
            Place of Birth *
          </Label>
          <Input
            placeholder="e.g. Jakarta"
            value={guest.placeOfBirth}
            onChange={(e) =>
              onChange({ ...guest, placeOfBirth: e.target.value })
            }
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Row 3: Price Category + Price + Room Type */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label className="text-[11px] text-muted-foreground">
            Price Category *
          </Label>
          <Select
            value={guest.tourPriceId ? String(guest.tourPriceId) : ''}
            onValueChange={handlePriceCategoryChange}
            disabled={isInfant && availablePrices.length === 1}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {availablePrices.map((p) => (
                <SelectItem key={p.tourPriceId} value={String(p.tourPriceId)}>
                  {p.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">Room Type</Label>
          <Input
            value={guest.roomTypeDescription || ''}
            disabled
            className="h-9 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[11px]">Price</Label>
          <Input
            value={guest.price ? formatCurrency(guest.price) : ''}
            disabled
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Row 4: Notes */}
      <div className="mt-3 grid gap-1">
        <Label className="text-[11px] text-muted-foreground">
          Notes (optional)
        </Label>
        <Input
          placeholder="Special requests, dietary needs, etc."
          value={guest.note || ''}
          onChange={(e) => onChange({ ...guest, note: e.target.value })}
          className="h-9 text-sm"
        />
      </div>
    </motion.div>
  );
}

// ─── Main Step 1 ────────────────────────────────────────────────────────────────

type Step1Props = {
  contact: BookingContact;
  onContactChange: (c: BookingContact) => void;
  adults: number;
  children: number;
  infants: number;
  onAdultsChange: (v: number) => void;
  onChildrenChange: (v: number) => void;
  onInfantsChange: (v: number) => void;
  guests: GuestEntry[];
  onGuestUpdate: (g: GuestEntry) => void;
  onGuestRemove: (guestId: string) => void;
  tourPrices: TourPrice[];
  maxGuests?: number;
  departureDate: string;
};

export default function Step1GuestInformation({
  contact,
  onContactChange,
  adults,
  children,
  infants,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  guests,
  onGuestUpdate,
  onGuestRemove,
  tourPrices,
  maxGuests = 99,
  departureDate,
}: Step1Props) {
  const filledCount = guests.filter(
    (g) =>
      g.title.trim() !== '' &&
      g.firstName.trim() !== '' &&
      g.lastName.trim() !== '' &&
      g.dateOfBirth.trim() !== '' &&
      g.priceCategory !== null,
  ).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <UserIcon className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Guest Information</h2>
      </motion.div>

      {/* Booking Contact */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border bg-card p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <PhoneIcon className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Booking Contact</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="contact_name" className="text-xs">
              Full Name *
            </Label>
            <Input
              id="contact_name"
              value={contact.name}
              placeholder="Full Name"
              onChange={(e) =>
                onContactChange({ ...contact, name: e.target.value })
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact_email" className="text-xs">
              Email *
            </Label>
            <Input
              id="contact_email"
              type="email"
              value={contact.email}
              placeholder="Email"
              onChange={(e) =>
                onContactChange({ ...contact, email: e.target.value })
              }
              className={
                contact.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />
            {contact.email &&
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && (
                <span className="text-[10px] text-destructive">
                  Invalid email format
                </span>
              )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact_phone" className="text-xs">
              Phone *
            </Label>
            <Input
              id="contact_phone"
              type="tel"
              value={contact.phone}
              placeholder="08**********"
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^\d+]/g, '');
                onContactChange({ ...contact, phone: numericValue });
              }}
            />
          </div>
        </div>
        <div className="mt-3 grid gap-1.5">
          <Label htmlFor="contact_notes" className="text-xs">
            Notes (optional)
          </Label>
          <Input
            id="contact_notes"
            placeholder="Special requests, dietary needs, etc."
            value={contact.notes}
            onChange={(e) =>
              onContactChange({ ...contact, notes: e.target.value })
            }
          />
        </div>
      </motion.div>

      {/* Guest Count */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h3 className="text-sm font-semibold">Number of Guest</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stepper
            label="Adult"
            sublabel="12 years and above"
            icon={UserIcon}
            value={adults}
            min={1}
            max={maxGuests}
            onChange={onAdultsChange}
          />
          <Stepper
            label="Child"
            sublabel="2 – 12 years"
            icon={UserMinusIcon}
            value={children}
            min={0}
            max={Math.max(0, maxGuests - adults)}
            onChange={onChildrenChange}
          />
          <Stepper
            label="Infant"
            sublabel="Under 2 years (no bed)"
            icon={Baby}
            value={infants}
            min={0}
            max={Math.max(0, maxGuests - adults - children)}
            onChange={onInfantsChange}
          />
        </div>
      </motion.div>

      {/* Guest Details */}
      {guests.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Guest Details</h3>
            <Badge variant="secondary" className="text-xs">
              {filledCount} / {guests.length} filled
            </Badge>
          </div>
          <AnimatePresence mode="sync">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {guests.map((guest, idx) => (
                <GuestDetailForm
                  key={guest.id}
                  guest={guest}
                  index={idx}
                  onChange={onGuestUpdate}
                  onRemove={() => onGuestRemove(guest.id)}
                  tourPrices={tourPrices}
                  departureDate={departureDate}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
