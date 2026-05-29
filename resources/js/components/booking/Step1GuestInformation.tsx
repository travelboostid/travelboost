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
import type {
    BookingContact,
    DashboardCustomerOption,
    GuestEntry,
    SavedPassengerOption,
    TourPrice,
} from '@/types/booking';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircleIcon,
    Baby,
    CheckIcon,
    MinusIcon,
    PhoneIcon,
    PlusIcon,
    UserIcon,
    UserMinusIcon,
    UserPlusIcon,
    XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.055 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

function RequiredMark() {
    return (
        <span className="font-semibold text-destructive" aria-hidden="true">
            *
        </span>
    );
}

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
    disabled = false,
}: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/20">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                        {label}
                    </p>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                        {sublabel}
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={disabled || value <= min}
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
                    disabled={disabled || value >= max}
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
    savedPassengers,
    onSavedPassengerSelect,
    readOnly = false,
}: {
    guest: GuestEntry;
    index: number;
    onChange: (g: GuestEntry) => void;
    onRemove?: () => void;
    tourPrices: TourPrice[];
    departureDate: string;
    savedPassengers: SavedPassengerOption[];
    onSavedPassengerSelect?: (
        guestId: string,
        savedPassenger: SavedPassengerOption,
    ) => void;
    readOnly?: boolean;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [savedGuestDropdownOpen, setSavedGuestDropdownOpen] = useState(false);
    const isAdult = guest.type === 'adult';
    const isInfant = guest.type === 'infant';
    const titleOptions = TITLE_OPTIONS[guest.type] ?? [];
    const allowedCategories = CATEGORY_FILTER[guest.type] ?? [];
    const availablePrices = tourPrices.filter((p) =>
        allowedCategories.includes(p.categoryName),
    );

    const computeDiscountedPrice = (
        tp: TourPrice,
    ): { discounted: number; original: number } => {
        const base = tp.price;
        let discounted = base;
        if (tp.promotionRate > 0) {
            discounted = base - (base * tp.promotionRate) / 100;
        } else if (tp.promotion > 0) {
            discounted = base - tp.promotion;
        }
        return {
            discounted: Math.max(0, Math.round(discounted)),
            original: base,
        };
    };

    useEffect(() => {
        if (!readOnly && availablePrices.length === 1 && !guest.tourPriceId) {
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
        if (readOnly) {
            return;
        }

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

    const filteredSavedPassengers = useMemo(() => {
        const query = guest.firstName.trim().toLowerCase();

        return savedPassengers
            .filter(
                (savedPassenger) => savedPassenger.travelerType === guest.type,
            )
            .filter((savedPassenger) => {
                if (!query) {
                    return true;
                }

                return [
                    savedPassenger.firstName,
                    savedPassenger.lastName,
                    savedPassenger.passportNumber,
                    savedPassenger.visaNumber,
                ]
                    .filter(Boolean)
                    .some((value) => value?.toLowerCase().includes(query));
            })
            .slice(0, 8);
    }, [guest.firstName, guest.type, savedPassengers]);

    const handleSavedPassengerSelect = (
        savedPassenger: SavedPassengerOption,
    ) => {
        if (readOnly) {
            return;
        }

        setSavedGuestDropdownOpen(false);
        onChange({
            ...guest,
            title: savedPassenger.title ?? '',
            firstName: savedPassenger.firstName,
            lastName: savedPassenger.lastName ?? '',
            dateOfBirth: savedPassenger.dateOfBirth ?? '',
            placeOfBirth: savedPassenger.placeOfBirth ?? '',
        });
        onSavedPassengerSelect?.(guest.id, savedPassenger);
    };

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
                        {PRICE_CATEGORY_LABELS[guest.priceCategory] ??
                            guest.priceCategory}
                    </Badge>
                )}
                {onRemove && !readOnly && (
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

                        <AlertDialog
                            open={confirmOpen}
                            onOpenChange={setConfirmOpen}
                        >
                            <AlertDialogContent size="sm">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Remove Guest {index + 1}?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to remove{' '}
                                        <strong>
                                            {[
                                                guest.title,
                                                guest.firstName,
                                                guest.lastName,
                                            ]
                                                .filter(Boolean)
                                                .join(' ') || 'this guest'}
                                        </strong>{' '}
                                        from the list? This action cannot be
                                        undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
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
                    <Label className="text-[11px] text-muted-foreground">
                        Title <RequiredMark />
                    </Label>
                    <Select
                        value={guest.title}
                        onValueChange={(v) => onChange({ ...guest, title: v })}
                        disabled={readOnly}
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
                        First Name <RequiredMark />
                    </Label>
                    <div className="relative">
                        <Input
                            placeholder="John"
                            value={guest.firstName}
                            onFocus={() => {
                                if (!readOnly && savedPassengers.length > 0) {
                                    setSavedGuestDropdownOpen(true);
                                }
                            }}
                            onBlur={() => {
                                window.setTimeout(
                                    () => setSavedGuestDropdownOpen(false),
                                    120,
                                );
                            }}
                            onChange={(e) => {
                                onChange({
                                    ...guest,
                                    firstName: e.target.value,
                                });
                                if (!readOnly && savedPassengers.length > 0) {
                                    setSavedGuestDropdownOpen(true);
                                }
                            }}
                            disabled={readOnly}
                            className="h-9 text-sm"
                        />
                        {!readOnly &&
                            savedGuestDropdownOpen &&
                            filteredSavedPassengers.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
                                    <div className="max-h-64 overflow-y-auto p-1">
                                        {filteredSavedPassengers.map(
                                            (savedPassenger) => {
                                                const fullName = [
                                                    savedPassenger.firstName,
                                                    savedPassenger.lastName,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ');
                                                const meta = [
                                                    savedPassenger.passportNumber
                                                        ? `Passport ${savedPassenger.passportNumber}`
                                                        : null,
                                                    savedPassenger.visaNumber
                                                        ? `Visa ${savedPassenger.visaNumber}`
                                                        : null,
                                                ].filter(Boolean);

                                                return (
                                                    <button
                                                        key={savedPassenger.id}
                                                        type="button"
                                                        onMouseDown={(event) =>
                                                            event.preventDefault()
                                                        }
                                                        onClick={() =>
                                                            handleSavedPassengerSelect(
                                                                savedPassenger,
                                                            )
                                                        }
                                                        className="flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                        <span className="text-sm font-medium">
                                                            {fullName}
                                                        </span>
                                                        {meta.length > 0 && (
                                                            <span className="mt-0.5 text-[11px] text-muted-foreground">
                                                                {meta.join(
                                                                    ' | ',
                                                                )}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
                <div className="grid gap-1">
                    <Label className="text-[11px] text-muted-foreground">
                        Last Name <RequiredMark />
                    </Label>
                    <Input
                        placeholder="Doe"
                        value={guest.lastName}
                        onChange={(e) =>
                            onChange({ ...guest, lastName: e.target.value })
                        }
                        disabled={readOnly}
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
                        <RequiredMark />
                    </Label>
                    <Input
                        type="date"
                        value={guest.dateOfBirth}
                        onChange={(e) =>
                            onChange({ ...guest, dateOfBirth: e.target.value })
                        }
                        disabled={readOnly}
                        className={cn(
                            'h-9 text-sm',
                            ageError &&
                                'border-destructive focus-visible:ring-destructive',
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
                        Place of Birth <RequiredMark />
                    </Label>
                    <Input
                        placeholder="e.g. Jakarta"
                        value={guest.placeOfBirth}
                        onChange={(e) =>
                            onChange({ ...guest, placeOfBirth: e.target.value })
                        }
                        disabled={readOnly}
                        className="h-9 text-sm"
                    />
                </div>
            </div>

            {/* Row 3: Price Category + Price + Room Type */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1">
                    <Label className="text-[11px] text-muted-foreground">
                        Price Category <RequiredMark />
                    </Label>
                    <Select
                        value={
                            guest.tourPriceId ? String(guest.tourPriceId) : ''
                        }
                        onValueChange={handlePriceCategoryChange}
                        disabled={
                            readOnly ||
                            (isInfant && availablePrices.length === 1)
                        }
                    >
                        <SelectTrigger className="h-9 w-full text-sm">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {availablePrices.map((p) => (
                                <SelectItem
                                    key={p.tourPriceId}
                                    value={String(p.tourPriceId)}
                                >
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
                    onChange={(e) =>
                        onChange({ ...guest, note: e.target.value })
                    }
                    disabled={readOnly}
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
    showAddAsGuest?: boolean;
    contactGuestId?: string | null;
    onContactGuestToggle?: (enabled: boolean) => void;
    contactAsGuestAdded?: boolean;
    onContactAsGuestAddedChange?: (value: boolean) => void;
    savedPassengers?: SavedPassengerOption[];
    onSavedPassengerSelect?: (
        guestId: string,
        savedPassenger: SavedPassengerOption,
    ) => void;
    customerOptions?: DashboardCustomerOption[];
    customerBookingMode?: 'existing' | 'guest';
    onCustomerBookingModeChange?: (mode: 'existing' | 'guest') => void;
    selectedCustomerId?: number | null;
    onCustomerSelect?: (customer: DashboardCustomerOption | null) => void;
    customerOptionsEmptyMessage?: string;
    readOnly?: boolean;
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
    showAddAsGuest = true,
    contactGuestId,
    onContactGuestToggle,
    contactAsGuestAdded: controlledContactAsGuestAdded,
    onContactAsGuestAddedChange,
    savedPassengers = [],
    onSavedPassengerSelect,
    customerOptions = [],
    customerBookingMode,
    onCustomerBookingModeChange,
    selectedCustomerId = null,
    onCustomerSelect,
    customerOptionsEmptyMessage = 'No customer accounts available.',
    readOnly = false,
}: Step1Props) {
    const [
        uncontrolledContactAsGuestAdded,
        setUncontrolledContactAsGuestAdded,
    ] = useState(false);
    const contactAsGuestAdded =
        contactGuestId !== undefined
            ? contactGuestId !== null
            : (controlledContactAsGuestAdded ??
              uncontrolledContactAsGuestAdded);
    const setContactAsGuestAdded =
        onContactAsGuestAddedChange ?? setUncontrolledContactAsGuestAdded;
    const filledCount = guests.filter(
        (g) =>
            g.title.trim() !== '' &&
            g.firstName.trim() !== '' &&
            g.lastName.trim() !== '' &&
            g.dateOfBirth.trim() !== '' &&
            g.priceCategory !== null,
    ).length;

    const handleContactGuestToggle = () => {
        if (readOnly) {
            return;
        }

        if (onContactGuestToggle) {
            onContactGuestToggle(!contactAsGuestAdded);
            return;
        }

        const blankAdultGuest = [...guests]
            .reverse()
            .find(
                (guest) =>
                    guest.type === 'adult' &&
                    guest.firstName.trim() === '' &&
                    guest.lastName.trim() === '',
            );
        const contactName = contact.name.trim();
        if (contactAsGuestAdded || !blankAdultGuest || contactName === '') {
            return;
        }

        const nameParts = contactName.split(/\s+/).filter(Boolean);
        if (nameParts.length === 0) {
            return;
        }

        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ');

        onGuestUpdate({
            ...blankAdultGuest,
            firstName:
                blankAdultGuest.firstName.trim() === ''
                    ? firstName
                    : blankAdultGuest.firstName,
            lastName:
                blankAdultGuest.lastName.trim() === ''
                    ? lastName
                    : blankAdultGuest.lastName,
        });
        setContactAsGuestAdded(true);
    };

    const hasSeatForContactGuest = adults + children + infants < maxGuests;
    const canAddContactAsGuest =
        showAddAsGuest &&
        !readOnly &&
        contact.name.trim() !== '' &&
        hasSeatForContactGuest;
    const showDashboardCustomerSelector =
        customerBookingMode !== undefined && onCustomerBookingModeChange;
    const accountContactFieldsDisabled =
        readOnly || customerBookingMode === 'existing';
    const phoneFieldDisabled = readOnly;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <motion.div
                variants={itemVariants}
                className="flex items-center gap-2"
            >
                <UserIcon className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Guest Information</h2>
            </motion.div>

            {/* Booking Contact */}
            <motion.div
                variants={itemVariants}
                className="rounded-xl border bg-card p-4 shadow-sm"
            >
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <PhoneIcon className="size-4 text-primary" />
                        <h3 className="text-sm font-semibold">
                            Booking Contact
                        </h3>
                    </div>
                </div>
                {showDashboardCustomerSelector && (
                    <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[auto_1fr] sm:items-end">
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Customer Type</Label>
                            <div className="inline-flex rounded-lg border bg-background p-1">
                                {(['existing', 'guest'] as const).map(
                                    (mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            disabled={readOnly}
                                            onClick={() => {
                                                const isChangingMode =
                                                    mode !==
                                                    customerBookingMode;
                                                onCustomerBookingModeChange?.(
                                                    mode,
                                                );

                                                if (isChangingMode) {
                                                    onCustomerSelect?.(null);
                                                }
                                            }}
                                            className={cn(
                                                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                                                customerBookingMode === mode
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {mode === 'existing'
                                                ? 'Existing Customer'
                                                : 'Guest'}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                        {customerBookingMode === 'existing' && (
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="dashboard_customer"
                                    className="text-xs"
                                >
                                    Customer Account <RequiredMark />
                                </Label>
                                <Select
                                    value={
                                        selectedCustomerId
                                            ? String(selectedCustomerId)
                                            : ''
                                    }
                                    disabled={
                                        readOnly || customerOptions.length === 0
                                    }
                                    onValueChange={(value) => {
                                        const customer =
                                            customerOptions.find(
                                                (option) =>
                                                    String(option.id) === value,
                                            ) ?? null;

                                        onCustomerSelect?.(customer);
                                    }}
                                >
                                    <SelectTrigger id="dashboard_customer">
                                        <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customerOptions.map((customer) => (
                                            <SelectItem
                                                key={customer.id}
                                                value={String(customer.id)}
                                            >
                                                {customer.name} -{' '}
                                                {customer.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {customerOptions.length === 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        {customerOptionsEmptyMessage}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="contact_name" className="text-xs">
                            Full Name <RequiredMark />
                        </Label>
                        <Input
                            id="contact_name"
                            value={contact.name}
                            placeholder="Full Name"
                            onChange={(e) =>
                                onContactChange({
                                    ...contact,
                                    name: e.target.value,
                                })
                            }
                            disabled={accountContactFieldsDisabled}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="contact_email" className="text-xs">
                            Email <RequiredMark />
                        </Label>
                        <Input
                            id="contact_email"
                            type="email"
                            value={contact.email}
                            placeholder="Email"
                            onChange={(e) =>
                                onContactChange({
                                    ...contact,
                                    email: e.target.value,
                                })
                            }
                            disabled={accountContactFieldsDisabled}
                            className={
                                contact.email &&
                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                    contact.email,
                                )
                                    ? 'border-destructive focus-visible:ring-destructive'
                                    : ''
                            }
                        />
                        {contact.email &&
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                contact.email,
                            ) && (
                                <span className="text-[10px] text-destructive">
                                    Invalid email format
                                </span>
                            )}
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="contact_phone" className="text-xs">
                            Phone <RequiredMark />
                        </Label>
                        <Input
                            id="contact_phone"
                            type="tel"
                            value={contact.phone}
                            placeholder="08**********"
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(
                                    /[^\d+]/g,
                                    '',
                                );
                                onContactChange({
                                    ...contact,
                                    phone: numericValue,
                                });
                            }}
                            disabled={phoneFieldDisabled}
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
                            onContactChange({
                                ...contact,
                                notes: e.target.value,
                            })
                        }
                        disabled={readOnly}
                    />
                </div>
                {showAddAsGuest && (
                    <button
                        type="button"
                        role="switch"
                        aria-checked={contactAsGuestAdded}
                        onClick={handleContactGuestToggle}
                        disabled={
                            readOnly ||
                            (!contactAsGuestAdded && !canAddContactAsGuest)
                        }
                        className={cn(
                            'mt-4 flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                            contactAsGuestAdded
                                ? 'border-primary/25 bg-primary/10 text-primary'
                                : 'border-border bg-background hover:border-primary/30 hover:bg-primary/5',
                            !canAddContactAsGuest &&
                                !contactAsGuestAdded &&
                                'cursor-not-allowed opacity-60 hover:border-border hover:bg-background',
                        )}
                    >
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold">
                                Use booking contact as a guest
                            </span>
                        </span>
                        <span
                            className={cn(
                                'flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors',
                                contactAsGuestAdded
                                    ? 'border-primary bg-primary'
                                    : 'border-border bg-muted',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform',
                                    contactAsGuestAdded &&
                                        'translate-x-5 text-primary',
                                )}
                            >
                                {contactAsGuestAdded ? (
                                    <CheckIcon className="size-3" />
                                ) : (
                                    <UserPlusIcon className="size-3 text-muted-foreground" />
                                )}
                            </span>
                        </span>
                    </button>
                )}
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
                        min={0}
                        max={Math.max(0, maxGuests - children - infants)}
                        onChange={onAdultsChange}
                        disabled={readOnly}
                    />
                    <Stepper
                        label="Child"
                        sublabel="2 – 12 years"
                        icon={UserMinusIcon}
                        value={children}
                        min={0}
                        max={Math.max(0, maxGuests - adults - infants)}
                        onChange={onChildrenChange}
                        disabled={readOnly}
                    />
                    <Stepper
                        label="Infant"
                        sublabel="Under 2 years (no bed)"
                        icon={Baby}
                        value={infants}
                        min={0}
                        max={Math.max(0, maxGuests - adults - children)}
                        onChange={onInfantsChange}
                        disabled={readOnly}
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
                                    onRemove={
                                        readOnly
                                            ? undefined
                                            : () => onGuestRemove(guest.id)
                                    }
                                    tourPrices={tourPrices}
                                    departureDate={departureDate}
                                    savedPassengers={savedPassengers}
                                    onSavedPassengerSelect={
                                        onSavedPassengerSelect
                                    }
                                    readOnly={readOnly}
                                />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
}
