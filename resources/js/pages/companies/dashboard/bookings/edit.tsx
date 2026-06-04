import type { TourResource } from '@/api/model';
import BookingInfoCard from '@/components/booking/BookingInfoCard';
import type { ManualPaymentData } from '@/components/booking/ManualPaymentDialog';
import Step1GuestInformation, {
    calculateAgeAtDeparture,
} from '@/components/booking/Step1GuestInformation';
import Step2RoomConfiguration, {
    autoRecommendRooms,
    deserializeRoomsFromBooking,
    getRoomNumberByGuestId,
    serializeRoomsForBooking,
    validateDependentBedPassengerMix,
    validateRoomArrangement,
    type RoomConfig,
} from '@/components/booking/Step2RoomConfiguration';
import Step3TravelDocuments from '@/components/booking/Step3TravelDocuments';
import Step4BookingSummary, {
    type AddOnItem,
    type DownPaymentRule,
    type PaymentMethod,
    type PaymentType,
} from '@/components/booking/Step4BookingSummary';
import WizardStepIndicator from '@/components/booking/WizardStepIndicator';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import type { WizardStepId } from '@/constants/booking';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type {
    BookingContact,
    GuestEntry,
    TourPrice,
    TravelDocumentEntry,
    VendorInfo,
} from '@/types/booking';
import {
    calculateAddOnPricing,
    calculateBookingPricing,
} from '@/utils/booking-calculations';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    Loader2Icon,
    SaveIcon,
    ShieldAlertIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Passenger = {
    id: number;
    title: string | null;
    first_name: string;
    last_name: string | null;
    gender: string | null;
    dob: string | null;
    pob: string | null;
    nationality: string | null;
    price_category: string | null;
    price_amount: number | null;
    passport_number: string | null;
    passport_issue_date: string | null;
    passport_expiry_date: string | null;
    passport_file_path: string | null;
    visa_number: string | null;
    visa_file_path: string | null;
    room_type: string | null;
    note: string | null;
};

type BookingData = {
    id: number;
    booking_number: string;
    invoice_number?: string | null;
    status: string;
    reserved_type?: string | null;
    departure_date: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_notes: string | null;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    total_price: string;
    tax_amount: string;
    platform_fee: string;
    commission_amount: string;
    grand_total: string;
    created_at: string;
    tour: TourResource | null;
    vendor: VendorInfo | null;
    agent: { id: number; name: string } | null;
    passengers: Passenger[];
    rooms: any[];
    addons: any[];
    input_by?: {
        user_name: string;
        role_label: string;
        company_name?: string | null;
        created_at: string | null;
    } | null;
};

type PageProps = {
    booking: BookingData;
    tourPrices: TourPrice[];
    addOns: AddOnItem[];
    minimumDownPaymentPct: number | null;
    downPaymentRule?: DownPaymentRule;
    minimumVatPct: number;
    platformFeePerPax?: number;
    downPaymentAvailable?: boolean;
    fullPaymentAvailable?: boolean;
    paymentUnavailableReason?: string | null;
    paidAmount?: number;
    remainingBalance?: number;
    downPaymentPaidAt?: string | null;
    bookingSeatLimit?: number;
    vendorBankInfo?: {
        bankName: string;
        accountName: string;
        accountNumber: string;
    };
    editMode?: 'full' | 'documents' | 'readonly';
    canEditDocuments?: boolean;
};

type EditableGuestEntry = GuestEntry & {
    passengerId?: number;
};

function makeEditableDefaultGuest(
    id: string,
    type: 'adult' | 'child' | 'infant',
): EditableGuestEntry {
    return {
        id,
        type,
        title: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        priceCategory: null,
        tourPriceId: 0,
        price: 0,
        originalPrice: 0,
        roomTypeDescription: '',
        note: '',
    };
}

// ---------------------------------------------------------------------------
// Helpers — convert DB passengers → wizard GuestEntry[]
// ---------------------------------------------------------------------------

function passengersToGuests(
    passengers: Passenger[],
    tourPrices: TourPrice[],
): EditableGuestEntry[] {
    const counters = { adult: 0, child: 0, infant: 0 };

    return passengers.map((p) => {
        let type: 'adult' | 'child' | 'infant' = 'adult';
        const cat = p.price_category?.toLowerCase() ?? '';
        if (cat.includes('infant')) type = 'infant';
        else if (cat.includes('child')) type = 'child';

        const idx = counters[type]++;

        const matchedPrice = tourPrices.find(
            (tp) => tp.categoryName === p.price_category,
        );

        let restoredPrice =
            p.price_amount ?? (matchedPrice ? matchedPrice.price : 0);
        const restoredOriginalPrice = matchedPrice
            ? matchedPrice.price
            : restoredPrice;

        if (matchedPrice) {
            if (matchedPrice.promotionRate > 0) {
                restoredPrice = Math.max(
                    0,
                    Math.round(
                        matchedPrice.price -
                            (matchedPrice.price * matchedPrice.promotionRate) /
                                100,
                    ),
                );
            } else if (matchedPrice.promotion > 0) {
                restoredPrice = Math.max(
                    0,
                    Math.round(matchedPrice.price - matchedPrice.promotion),
                );
            }
        }

        return {
            id: `${type}-${idx}`,
            type,
            title: p.title ?? '',
            firstName: p.first_name ?? '',
            lastName: p.last_name ?? '',
            dateOfBirth: p.dob ? p.dob.split('T')[0] : '',
            placeOfBirth: p.pob ?? '',
            priceCategory: p.price_category ?? null,
            tourPriceId: matchedPrice ? matchedPrice.tourPriceId : 0,
            price: restoredPrice,
            originalPrice: restoredOriginalPrice,
            roomTypeDescription: p.room_type ?? '',
            note: p.note ?? '',
            passengerId: p.id,
            bookingPassengerId: p.id,
        };
    });
}

function passengersToTravelDocs(
    passengers: Passenger[],
    guests: GuestEntry[],
): TravelDocumentEntry[] {
    return passengers
        .map((p, idx) => {
            const guest = guests[idx];
            if (!guest || guest.type === 'infant') return null;
            return {
                guestId: guest.id,
                passportNumber: p.passport_number ?? '',
                passportIssueDate: p.passport_issue_date
                    ? p.passport_issue_date.split('T')[0]
                    : '',
                passportExpiryDate: p.passport_expiry_date
                    ? p.passport_expiry_date.split('T')[0]
                    : '',
                visaNumber: p.visa_number ?? '',
                passportFile: null,
                passportFileName: p.passport_file_path
                    ? p.passport_file_path.split('/').pop() || ''
                    : '',
                passportFilePath: p.passport_file_path ?? null,
                visaFile: null,
                visaFileName: p.visa_file_path
                    ? p.visa_file_path.split('/').pop() || ''
                    : '',
                visaFilePath: p.visa_file_path ?? null,
            };
        })
        .filter(Boolean) as TravelDocumentEntry[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page({
    booking,
    tourPrices,
    addOns,
    minimumDownPaymentPct,
    downPaymentRule = null,
    minimumVatPct,
    platformFeePerPax = 25_000,
    downPaymentAvailable = true,
    fullPaymentAvailable = true,
    paymentUnavailableReason = null,
    paidAmount = 0,
    remainingBalance = 0,
    downPaymentPaidAt = null,
    bookingSeatLimit = 99,
    vendorBankInfo,
    editMode = 'readonly',
    canEditDocuments = false,
}: PageProps) {
    const { company } = usePageSharedDataProps();
    const isAgent = company.type === 'agent';
    const canOpenWizard = editMode === 'full' || editMode === 'documents';

    // ── Non-editable guard ───────────────────────────────────────────
    if (!canOpenWizard) {
        return (
            <CompanyDashboardLayout
                openMenuIds={['tours']}
                activeMenuIds={isAgent ? ['tours.bookings'] : ['tours.orders']}
                breadcrumb={[
                    { title: 'Tours' },
                    {
                        title: 'Bookings',
                        url: `/companies/${company.username}/dashboard/bookings`,
                    },
                    { title: booking.booking_number },
                    { title: 'Edit' },
                ]}
            >
                <Head title={`Edit ${booking.booking_number}`} />
                <div className="w-full max-w-screen-xl mx-auto p-4 md:p-6 pb-20">
                    <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                        <ShieldAlertIcon className="size-6 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h2 className="text-lg font-semibold text-amber-900">
                                Editing Disabled
                            </h2>
                            <p className="mt-1 text-sm text-amber-700">
                                This booking can no longer be edited because
                                payment has been made. Current status:{' '}
                                <strong className="capitalize">
                                    {booking.status}
                                </strong>
                                .
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() =>
                                    router.visit(
                                        `/companies/${company.username}/dashboard/bookings`,
                                    )
                                }
                            >
                                Go Back
                            </Button>
                        </div>
                    </div>
                </div>
            </CompanyDashboardLayout>
        );
    }

    return (
        <EditableWizard
            booking={booking}
            tourPrices={tourPrices}
            addOns={addOns}
            minimumDownPaymentPct={minimumDownPaymentPct}
            downPaymentRule={downPaymentRule}
            minimumVatPct={minimumVatPct}
            platformFeePerPax={platformFeePerPax}
            downPaymentAvailable={downPaymentAvailable}
            fullPaymentAvailable={fullPaymentAvailable}
            paymentUnavailableReason={paymentUnavailableReason}
            paidAmount={paidAmount}
            remainingBalance={remainingBalance}
            downPaymentPaidAt={downPaymentPaidAt}
            bookingSeatLimit={bookingSeatLimit}
            vendorBankInfo={vendorBankInfo}
            editMode={editMode}
            canEditDocuments={canEditDocuments}
            company={company}
            isAgent={isAgent}
        />
    );
}

// ---------------------------------------------------------------------------
// Editable Wizard (extracted for clean hooks)
// ---------------------------------------------------------------------------

function EditableWizard({
    booking,
    tourPrices,
    addOns: initialAddOns,
    minimumDownPaymentPct,
    downPaymentRule,
    minimumVatPct,
    platformFeePerPax,
    downPaymentAvailable,
    fullPaymentAvailable,
    paymentUnavailableReason,
    paidAmount,
    remainingBalance,
    downPaymentPaidAt,
    bookingSeatLimit,
    vendorBankInfo,
    editMode,
    canEditDocuments,
    company,
    isAgent,
}: {
    booking: BookingData;
    tourPrices: TourPrice[];
    addOns: AddOnItem[];
    minimumDownPaymentPct: number | null;
    downPaymentRule: DownPaymentRule;
    minimumVatPct: number;
    platformFeePerPax: number;
    downPaymentAvailable: boolean;
    fullPaymentAvailable: boolean;
    paymentUnavailableReason: string | null;
    paidAmount: number;
    remainingBalance: number;
    downPaymentPaidAt: string | null;
    bookingSeatLimit: number;
    vendorBankInfo?: {
        bankName: string;
        accountName: string;
        accountNumber: string;
    };
    editMode: 'full' | 'documents' | 'readonly';
    canEditDocuments: boolean;
    company: any;
    isAgent: boolean;
}) {
    const departureDate = booking.departure_date?.split('T')[0] ?? '';

    // ── Wizard step state ──────────────────────────────────────────────
    const isDocumentOnlyMode = editMode === 'documents' && canEditDocuments;
    const requestedStep =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('step')
            : null;
    const [currentStep, setCurrentStep] = useState<WizardStepId>(
        requestedStep === 'payment'
            ? 4
            : requestedStep === 'documents'
              ? 3
              : isDocumentOnlyMode
                ? 3
                : 1,
    );
    const [direction, setDirection] = useState(1);

    // ── Contact ────────────────────────────────────────────────────────
    const [contact, setContact] = useState<BookingContact>({
        name: booking.contact_name ?? '',
        email: booking.contact_email ?? '',
        phone: booking.contact_phone ?? '',
        notes: booking.contact_notes ?? '',
    });
    const [contactGuestId, setContactGuestId] = useState<string | null>(null);

    // ── Guests ─────────────────────────────────────────────────────────
    const initialGuests = useMemo(
        () => passengersToGuests(booking.passengers, tourPrices),
        [booking.passengers, tourPrices],
    );
    const [adults, setAdults] = useState(booking.pax_adult);
    const [children, setChildren] = useState(booking.pax_child);
    const [infants, setInfants] = useState(booking.pax_infant);
    const [guests, setGuests] = useState<GuestEntry[]>(initialGuests);

    // ── Rooms ──────────────────────────────────────────────────────────
    const [rooms, setRooms] = useState<RoomConfig[]>(() =>
        booking.rooms?.length
            ? deserializeRoomsFromBooking(
                  booking.rooms,
                  initialGuests,
                  booking.passengers,
              )
            : autoRecommendRooms(initialGuests),
    );
    const [selectedAddOns, setSelectedAddOns] =
        useState<AddOnItem[]>(initialAddOns);
    const selectedAddOnsForPricing = useMemo(
        () =>
            selectedAddOns.map((addon) =>
                addon.hasQty === false
                    ? { ...addon, qty: guests.length }
                    : addon,
            ),
        [selectedAddOns, guests.length],
    );
    const selectedAddOnPricing = useMemo(
        () =>
            calculateAddOnPricing(
                selectedAddOnsForPricing,
                minimumVatPct ?? 11,
            ),
        [minimumVatPct, selectedAddOnsForPricing],
    );
    const roomsGuestFingerprint = useRef<string>(
        booking.rooms?.length
            ? JSON.stringify(
                  initialGuests.map((g) => `${g.id}-${g.priceCategory}`),
              )
            : '',
    );
    const skipGuestSyncRef = useRef(false);

    // ── Travel Documents ───────────────────────────────────────────────
    const [travelDocuments, setTravelDocuments] = useState<
        TravelDocumentEntry[]
    >(() => passengersToTravelDocs(booking.passengers, initialGuests));

    // ── Sync guest array when pax counts change ────────────────────────
    useEffect(() => {
        if (skipGuestSyncRef.current) {
            skipGuestSyncRef.current = false;
            return;
        }

        setGuests((previousGuests) => {
            const newGuests: EditableGuestEntry[] = [];
            const contactGuest =
                contactGuestId !== null
                    ? ((previousGuests.find(
                          (guest) => guest.id === contactGuestId,
                      ) as EditableGuestEntry | undefined) ??
                      makeEditableDefaultGuest(contactGuestId, 'adult'))
                    : null;
            const adultSlots = contactGuest ? Math.max(0, adults - 1) : adults;

            for (let i = 0; i < adultSlots; i++) {
                newGuests.push(
                    (previousGuests.find((g) => g.id === `adult-${i}`) as
                        | EditableGuestEntry
                        | undefined) ??
                        makeEditableDefaultGuest(`adult-${i}`, 'adult'),
                );
            }
            if (contactGuest) {
                newGuests.push(contactGuest);
            }
            for (let i = 0; i < children; i++) {
                newGuests.push(
                    (previousGuests.find((g) => g.id === `child-${i}`) as
                        | EditableGuestEntry
                        | undefined) ??
                        makeEditableDefaultGuest(`child-${i}`, 'child'),
                );
            }
            for (let i = 0; i < infants; i++) {
                newGuests.push(
                    (previousGuests.find((g) => g.id === `infant-${i}`) as
                        | EditableGuestEntry
                        | undefined) ??
                        makeEditableDefaultGuest(`infant-${i}`, 'infant'),
                );
            }

            return newGuests;
        });
    }, [adults, children, contactGuestId, infants]);

    useEffect(() => {
        const docsGuests = guests.filter((g) => g.type !== 'infant');

        setTravelDocuments((previousDocs) =>
            docsGuests.map((g) => {
                const existing = previousDocs.find((d) => d.guestId === g.id);

                return (
                    existing ?? {
                        guestId: g.id,
                        passportNumber: '',
                        passportIssueDate: '',
                        passportExpiryDate: '',
                        visaNumber: '',
                        passportFile: null,
                        passportFileName: '',
                        passportFilePath: null,
                        visaFile: null,
                        visaFileName: '',
                        visaFilePath: null,
                    }
                );
            }),
        );
    }, [guests]);

    // ── Pricing ────────────────────────────────────────────────────────
    const vendor = useMemo<VendorInfo>(
        () =>
            booking.vendor ?? {
                id: 0,
                name: 'Unknown',
                payment_mode: 'vendor',
                commission: 0,
            },
        [booking.vendor],
    );
    const pricing = useMemo(
        () =>
            calculateBookingPricing(
                guests,
                vendor.commission ?? 0,
                minimumVatPct,
                platformFeePerPax,
                tourPrices,
            ),
        [guests, vendor, minimumVatPct, platformFeePerPax, tourPrices],
    );
    const liveGrandTotal =
        pricing.totalPrice +
        selectedAddOnPricing.addOnsTotal +
        selectedAddOnPricing.addOnsVat;
    const bookingGrandTotal = Number(booking.grand_total ?? 0);
    const displayGrandTotal =
        isDocumentOnlyMode && bookingGrandTotal > 0
            ? bookingGrandTotal
            : liveGrandTotal;

    // ── Navigation ─────────────────────────────────────────────────────
    const goNext = () => {
        if (currentStep === 1) {
            // Auto-recommend rooms when entering step 2
            const currentFingerprint = JSON.stringify(
                guests.map((g) => `${g.id}-${g.priceCategory}`),
            );
            if (
                rooms.length === 0 ||
                roomsGuestFingerprint.current !== currentFingerprint
            ) {
                setRooms(autoRecommendRooms(guests));
                roomsGuestFingerprint.current = currentFingerprint;
            }
        }
        setDirection(1);
        setCurrentStep((s) => Math.min(4, s + 1) as WizardStepId);
    };

    const goToStep = (step: WizardStepId) => {
        setDirection(step > currentStep ? 1 : -1);

        if (step === 2) {
            const currentFingerprint = JSON.stringify(
                guests.map((g) => `${g.id}-${g.priceCategory}`),
            );
            if (
                rooms.length === 0 ||
                roomsGuestFingerprint.current !== currentFingerprint
            ) {
                setRooms(autoRecommendRooms(guests));
                roomsGuestFingerprint.current = currentFingerprint;
            }
        }

        setCurrentStep(step);
    };

    const goBack = () => {
        router.visit(`/companies/${company.username}/dashboard/bookings`);
    };

    const handleGuestUpdate = useCallback((updated: GuestEntry) => {
        setGuests((prev) =>
            prev.map((g) =>
                g.id === updated.id
                    ? {
                          ...updated,
                          passengerId: (g as EditableGuestEntry).passengerId,
                      }
                    : g,
            ),
        );
    }, []);

    const handleGuestRemove = useCallback(
        (guestId: string) => {
            if (guestId === contactGuestId) {
                setContactGuestId(null);
            }

            const newGuests = guests.filter((g) => g.id !== guestId);
            if (newGuests.length === guests.length) return;

            skipGuestSyncRef.current = true;
            setGuests(newGuests);
            setAdults(newGuests.filter((g) => g.type === 'adult').length);
            setChildren(newGuests.filter((g) => g.type === 'child').length);
            setInfants(newGuests.filter((g) => g.type === 'infant').length);
        },
        [contactGuestId, guests],
    );

    const handleContactGuestToggle = useCallback(
        (enabled: boolean) => {
            if (enabled) {
                const contactName = contact.name.trim();
                if (!contactName || adults + children >= 99) {
                    return;
                }

                const nameParts = contactName.split(/\s+/).filter(Boolean);
                if (nameParts.length === 0) {
                    return;
                }

                const guestId = 'contact-guest';
                if (guests.some((guest) => guest.id === guestId)) {
                    setContactGuestId(guestId);
                    return;
                }

                skipGuestSyncRef.current = true;
                setGuests((prev) => [
                    ...prev,
                    {
                        ...makeEditableDefaultGuest(guestId, 'adult'),
                        firstName: nameParts[0] ?? '',
                        lastName: nameParts.slice(1).join(' '),
                    },
                ]);
                setAdults((prev) => prev + 1);
                setContactGuestId(guestId);
                return;
            }

            if (contactGuestId) {
                handleGuestRemove(contactGuestId);
            }
        },
        [
            adults,
            children,
            contact.name,
            contactGuestId,
            guests,
            handleGuestRemove,
        ],
    );

    // ── Validation ─────────────────────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d+$/;
    const dependentBedPassengerValidation = useMemo(
        () => validateDependentBedPassengerMix(guests),
        [guests],
    );

    const canProceedStep1 =
        contact.name.trim() !== '' &&
        contact.email.trim() !== '' &&
        emailRegex.test(contact.email.trim()) &&
        contact.phone.trim() !== '' &&
        phoneRegex.test(contact.phone.trim()) &&
        dependentBedPassengerValidation.isValid &&
        guests.length > 0 &&
        guests.every((g) => {
            if (
                g.title.trim() === '' ||
                g.firstName.trim() === '' ||
                g.lastName.trim() === '' ||
                g.dateOfBirth.trim() === '' ||
                g.placeOfBirth.trim() === '' ||
                g.priceCategory === null
            )
                return false;

            const age = calculateAgeAtDeparture(g.dateOfBirth, departureDate);
            if (age === null || age < 0) return false;
            if (g.type === 'infant' && age >= 2) return false;
            if (g.type === 'child' && (age < 2 || age >= 12)) return false;
            if (g.type === 'adult' && age < 12) return false;

            return true;
        });

    const canProceedStep2 = useMemo(() => {
        const assignedGuestIds = [
            ...rooms.flatMap((r) => r.guestIds),
            ...rooms.flatMap((r) => r.sharingGuestIds ?? []),
        ];
        const roomArrangementValidation = validateRoomArrangement(
            rooms,
            guests,
        );

        return (
            roomArrangementValidation.isValid &&
            guests.every((g) => assignedGuestIds.includes(g.id))
        );
    }, [guests, rooms]);
    const isCurrentStepInvalid =
        (currentStep === 1 && !canProceedStep1) ||
        (currentStep === 2 && !canProceedStep2);
    const canUsePaymentControls =
        (booking.status === 'down payment' && remainingBalance > 0) ||
        (booking.status === 'waiting payment approval' &&
            booking.reserved_type === 'payment_in_progress');
    const canSaveCurrentStep =
        editMode === 'full' || (canEditDocuments && currentStep === 3);

    // ── Save (replaces Pay Now) ────────────────────────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<
        string | null
    >(null);

    const buildBookingSnapshotPayload = (addOnsForSave = selectedAddOns) => {
        const addOnRows = addOnsForSave
            .filter((addon) => addon.qty > 0)
            .map((addon) => ({
                name: addon.label,
                price: addon.unitPrice * addon.qty,
                qty: addon.qty,
                is_taxable: addon.isTaxable ?? false,
            }));
        const addOnPricing = calculateAddOnPricing(
            addOnsForSave.filter((addon) => addon.qty > 0),
            minimumVatPct ?? 11,
        );
        const totalTaxAmount = pricing.ppn + addOnPricing.addOnsVat;
        const grandTotal =
            pricing.totalPrice +
            addOnPricing.addOnsTotal +
            addOnPricing.addOnsVat;
        const roomNumberByGuestId = getRoomNumberByGuestId(rooms);

        return {
            contact_name: contact.name,
            contact_email: contact.email,
            contact_phone: contact.phone,
            contact_notes: contact.notes,
            pax_adult: adults,
            pax_child: children,
            pax_infant: infants,
            total_price: pricing.subtotalGuests,
            tax_amount: totalTaxAmount,
            platform_fee: pricing.platformFee,
            commission_amount: pricing.agentCommission,
            grand_total: grandTotal,
            passengers: guests.map((guest) => {
                const doc = travelDocuments.find((d) => d.guestId === guest.id);
                return {
                    id: (guest as EditableGuestEntry).passengerId,
                    client_guest_id: guest.id,
                    title: guest.title || null,
                    first_name: guest.firstName,
                    last_name: guest.lastName || null,
                    gender: null,
                    dob: guest.dateOfBirth || null,
                    pob: guest.placeOfBirth || null,
                    nationality: null,
                    passport_number: doc?.passportNumber || null,
                    passport_issue_date: doc?.passportIssueDate || null,
                    passport_expiry_date: doc?.passportExpiryDate || null,
                    visa_number: doc?.visaNumber || null,
                    price_category: guest.priceCategory,
                    price_amount: guest.price,
                    room_type: guest.roomTypeDescription || null,
                    room_number: roomNumberByGuestId.get(guest.id) ?? null,
                    note: guest.note || null,
                };
            }),
            rooms: serializeRoomsForBooking(rooms),
            addons: addOnRows,
        };
    };

    const handleSave = (addOnsForSave = selectedAddOns) => {
        setIsSubmitting(true);

        router.put(
            `/companies/${company.username}/dashboard/bookings/${booking.id}`,
            buildBookingSnapshotPayload(addOnsForSave) as any,
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Booking updated successfully.'),
                onError: () => toast.error('Failed to update booking.'),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleSaveDocumentsOnly = () => {
        setIsSubmitting(true);

        const formData = new FormData();
        let rowIndex = 0;

        guests.forEach((guest) => {
            const passengerId = (guest as EditableGuestEntry).passengerId;

            if (!passengerId) {
                return;
            }

            const doc = travelDocuments.find(
                (item) => item.guestId === guest.id,
            );

            if (!doc) {
                return;
            }

            formData.append(`passengers[${rowIndex}][id]`, String(passengerId));
            formData.append(
                `passengers[${rowIndex}][passport_number]`,
                doc.passportNumber,
            );
            formData.append(
                `passengers[${rowIndex}][passport_issue_date]`,
                doc.passportIssueDate,
            );
            formData.append(
                `passengers[${rowIndex}][passport_expiry_date]`,
                doc.passportExpiryDate,
            );
            formData.append(
                `passengers[${rowIndex}][visa_number]`,
                doc.visaNumber,
            );

            if (doc.passportFile) {
                formData.append(
                    `passengers[${rowIndex}][passport_file]`,
                    doc.passportFile,
                );
            } else if (doc.passportFilePath) {
                formData.append(
                    `passengers[${rowIndex}][passport_file_path]`,
                    doc.passportFilePath,
                );
            }

            if (doc.visaFile) {
                formData.append(
                    `passengers[${rowIndex}][visa_file]`,
                    doc.visaFile,
                );
            } else if (doc.visaFilePath) {
                formData.append(
                    `passengers[${rowIndex}][visa_file_path]`,
                    doc.visaFilePath,
                );
            }

            rowIndex += 1;
        });

        router.post(
            `/companies/${company.username}/dashboard/bookings/${booking.id}/travel-documents`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Travel documents updated successfully.'),
                onError: () =>
                    toast.error('Failed to update travel documents.'),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };
    const handleSaveCurrentStep = () => {
        if (canEditDocuments && currentStep === 3) {
            handleSaveDocumentsOnly();
            return;
        }

        handleSave();
    };
    const confirmOnlinePayment = (paymentId: number | string | undefined) => {
        if (!paymentId) {
            setIsSubmitting(false);
            return;
        }

        axios
            .post(
                `/companies/${company.username}/dashboard/bookings/${booking.id}/online-payment/${paymentId}/confirm`,
                {},
                {
                    withCredentials: true,
                    withXSRFToken: true,
                },
            )
            .then(() => {
                toast.success('Payment confirmed.');
                router.visit(
                    `/companies/${company.username}/dashboard/bookings`,
                );
            })
            .catch(() => {
                setPaymentErrorMessage(
                    'Payment status could not be confirmed yet. You can try again while the payment attempt is active.',
                );
            })
            .finally(() => setIsSubmitting(false));
    };
    const submitManualPayment = (
        paymentType: PaymentType,
        finalAmount: number,
        manualData?: ManualPaymentData,
    ) => {
        if (!manualData?.proofFile) {
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append('sender_bank_name', manualData.senderBankName);
        formData.append(
            'sender_account_number',
            manualData.senderAccountNumber,
        );
        formData.append(
            'transfer_amount',
            String(manualData.transferAmount || finalAmount),
        );
        formData.append('payment_type', paymentType);
        formData.append('payment_date', manualData.paymentDate);
        formData.append('proof', manualData.proofFile);

        router.post(
            `/companies/${company.username}/dashboard/bookings/${booking.id}/manual-payment`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment proof submitted.');
                    router.reload({ preserveScroll: true });
                },
                onError: (errors) => {
                    setPaymentErrorMessage(
                        String(
                            errors.payment ??
                                errors.payment_type ??
                                errors.transfer_amount ??
                                'Payment could not be submitted.',
                        ),
                    );
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };
    const submitOnlinePayment = (
        paymentType: PaymentType,
        finalAmount: number,
    ) => {
        axios
            .post(
                `/companies/${company.username}/dashboard/bookings/${booking.id}/online-payment`,
                {
                    payment_type: paymentType,
                    amount: finalAmount,
                },
                {
                    withCredentials: true,
                    withXSRFToken: true,
                },
            )
            .then((response) => {
                const snapToken = response.data?.payment?.payload
                    ?.snap_token as string | undefined;
                const paymentId = response.data?.payment?.id as
                    | number
                    | string
                    | undefined;
                const snap = (window as any).snap;

                if (!snapToken || typeof snap?.pay !== 'function') {
                    setPaymentErrorMessage(
                        'Online payment is not available in this browser session. Please refresh and try again.',
                    );
                    setIsSubmitting(false);
                    return;
                }

                snap.pay(snapToken, {
                    onSuccess: () => confirmOnlinePayment(paymentId),
                    onPending: () => setIsSubmitting(false),
                    onError: () => setIsSubmitting(false),
                    onClose: () => setIsSubmitting(false),
                });
            })
            .catch((error) => {
                const message =
                    error?.response?.data?.message ??
                    error?.response?.data?.errors?.payment?.[0] ??
                    'Online payment could not be started.';

                setPaymentErrorMessage(String(message));
                setIsSubmitting(false);
            });
    };
    const handlePayment = (
        paymentType: PaymentType,
        paymentMethod: PaymentMethod,
        addOns: AddOnItem[],
        finalAmount: number,
        manualData?: ManualPaymentData,
    ) => {
        setIsSubmitting(true);
        setPaymentErrorMessage(null);

        if (editMode !== 'full') {
            if (paymentMethod === 'manual_transfer') {
                submitManualPayment(paymentType, finalAmount, manualData);
                return;
            }

            submitOnlinePayment(paymentType, finalAmount);
            return;
        }

        let startedPayment = false;

        router.put(
            `/companies/${company.username}/dashboard/bookings/${booking.id}`,
            buildBookingSnapshotPayload(addOns) as any,
            {
                preserveScroll: true,
                onSuccess: () => {
                    startedPayment = true;

                    if (paymentMethod === 'manual_transfer') {
                        submitManualPayment(
                            paymentType,
                            finalAmount,
                            manualData,
                        );
                        return;
                    }

                    submitOnlinePayment(paymentType, finalAmount);
                },
                onError: (errors) => {
                    setPaymentErrorMessage(
                        String(
                            errors.payment ??
                                errors.payment_type ??
                                errors.transfer_amount ??
                                'Booking could not be saved before payment.',
                        ),
                    );
                },
                onFinish: () => {
                    if (!startedPayment) {
                        setIsSubmitting(false);
                    }
                },
            },
        );
    };

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={isAgent ? ['tours.bookings'] : ['tours.orders']}
            breadcrumb={[
                { title: 'Tours' },
                {
                    title: 'Bookings',
                    url: `/companies/${company.username}/dashboard/bookings`,
                },
                {
                    title: booking.booking_number,
                    url: `/companies/${company.username}/dashboard/bookings/${booking.id}`,
                },
                { title: 'Edit' },
            ]}
        >
            <Head title={`Edit ${booking.booking_number}`} />

            <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
                <div className="mx-auto w-full max-w-5xl px-4 pt-4">
                    <div className="flex flex-col md:flex-row md:items-start md:gap-4 lg:gap-6">
                        {/* Back button */}
                        <div className="hidden w-12 shrink-0 justify-end pt-17 md:flex">
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground"
                            >
                                <ArrowLeftIcon className="size-5" />
                            </button>
                        </div>

                        {/* Center Column */}
                        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1">
                            <div className="pb-4 pt-2">
                                {/* Mobile back */}
                                <div className="mb-3 md:hidden">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeftIcon className="size-4" />
                                        Back
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="sticky top-0 z-20 mb-5 rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
                                    <WizardStepIndicator
                                        currentStep={currentStep}
                                        onStepClick={goToStep}
                                    />
                                </div>

                                {/* Booking Info Card — no timer for dashboard edit */}
                                <BookingInfoCard
                                    tour={booking.tour as TourResource}
                                    status={booking.status as any}
                                    bookingNumber={booking.booking_number}
                                    invoiceNumber={
                                        booking.invoice_number ??
                                        (booking.status === 'full payment'
                                            ? booking.booking_number
                                            : null)
                                    }
                                    departureDate={departureDate}
                                    vendor={vendor}
                                    agentName={booking.agent?.name ?? '-'}
                                    contactName={contact.name}
                                    contactEmail={contact.email}
                                    contactPhone={contact.phone}
                                    pricing={pricing}
                                    agentCommissionAmount={Number(
                                        booking.commission_amount ?? 0,
                                    )}
                                    showAgentCommission={Boolean(booking.agent)}
                                    displayTotalPrice={
                                        currentStep === 4
                                            ? displayGrandTotal
                                            : undefined
                                    }
                                    totalPaid={paidAmount}
                                    remainingBalance={remainingBalance}
                                    timeLeftSeconds={0}
                                    currentStep={currentStep}
                                    timerStarted={false}
                                    inputBy={
                                        booking.input_by
                                            ? {
                                                  userName:
                                                      booking.input_by
                                                          .user_name,
                                                  roleLabel:
                                                      booking.input_by
                                                          .role_label,
                                                  companyName:
                                                      booking.input_by
                                                          .company_name,
                                                  createdAt:
                                                      booking.input_by
                                                          .created_at,
                                              }
                                            : null
                                    }
                                />
                            </div>

                            {/* Steps */}
                            <div className="py-2">
                                <AnimatePresence mode="wait" custom={direction}>
                                    <motion.div
                                        key={`step-${currentStep}`}
                                        custom={direction}
                                        initial={{
                                            opacity: 0,
                                            x: direction * 40,
                                        }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{
                                            opacity: 0,
                                            x: direction * -40,
                                        }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        {currentStep === 1 && (
                                            <Step1GuestInformation
                                                contact={contact}
                                                onContactChange={setContact}
                                                adults={adults}
                                                children={children}
                                                infants={infants}
                                                onAdultsChange={setAdults}
                                                onChildrenChange={setChildren}
                                                onInfantsChange={setInfants}
                                                guests={guests}
                                                onGuestUpdate={
                                                    handleGuestUpdate
                                                }
                                                onGuestRemove={
                                                    handleGuestRemove
                                                }
                                                tourPrices={tourPrices}
                                                departureDate={departureDate}
                                                contactGuestId={contactGuestId}
                                                onContactGuestToggle={
                                                    handleContactGuestToggle
                                                }
                                                contactAsGuestAdded={
                                                    contactGuestId !== null
                                                }
                                                maxGuests={bookingSeatLimit}
                                                readOnly={isDocumentOnlyMode}
                                            />
                                        )}
                                        {currentStep === 2 && (
                                            <Step2RoomConfiguration
                                                guests={guests}
                                                rooms={rooms}
                                                onRoomsChange={setRooms}
                                                readOnly={isDocumentOnlyMode}
                                            />
                                        )}
                                        {currentStep === 3 && (
                                            <Step3TravelDocuments
                                                guests={guests}
                                                travelDocuments={
                                                    travelDocuments
                                                }
                                                onTravelDocumentsChange={
                                                    setTravelDocuments
                                                }
                                                departureDate={departureDate}
                                                readOnly={false}
                                            />
                                        )}
                                        {currentStep === 4 && (
                                            <Step4BookingSummary
                                                contact={contact}
                                                guests={guests}
                                                rooms={rooms}
                                                pricing={pricing}
                                                vendor={vendor}
                                                agentName={
                                                    booking.agent?.name ?? '-'
                                                }
                                                onPayNow={handlePayment}
                                                isSubmitting={isSubmitting}
                                                initialAddOns={selectedAddOns}
                                                onAddOnsChange={
                                                    setSelectedAddOns
                                                }
                                                minimumDownPaymentPct={
                                                    minimumDownPaymentPct
                                                }
                                                downPaymentRule={
                                                    downPaymentRule
                                                }
                                                minimumVatPct={minimumVatPct}
                                                paidAmount={paidAmount}
                                                remainingBalance={
                                                    remainingBalance
                                                }
                                                downPaymentPaidAt={
                                                    downPaymentPaidAt
                                                }
                                                grandTotalOverride={
                                                    isDocumentOnlyMode &&
                                                    bookingGrandTotal > 0
                                                        ? bookingGrandTotal
                                                        : null
                                                }
                                                vendorBankInfo={vendorBankInfo}
                                                readOnly={
                                                    isDocumentOnlyMode &&
                                                    !canUsePaymentControls
                                                }
                                                addOnsReadOnly={
                                                    isDocumentOnlyMode
                                                }
                                                hidePaymentControls={
                                                    !canUsePaymentControls
                                                }
                                                forceBalancePayment={
                                                    booking.status ===
                                                    'down payment'
                                                }
                                                paymentErrorMessage={
                                                    paymentErrorMessage
                                                }
                                                downPaymentAvailable={
                                                    downPaymentAvailable
                                                }
                                                fullPaymentAvailable={
                                                    fullPaymentAvailable
                                                }
                                                paymentUnavailableReason={
                                                    paymentUnavailableReason
                                                }
                                                showProformaInvoiceButton={
                                                    booking.status ===
                                                    'down payment'
                                                }
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between gap-3 pb-12 pt-4">
                                {currentStep > 1 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={goBack}
                                        className="gap-2"
                                    >
                                        <ArrowLeftIcon className="size-4" />{' '}
                                        Back
                                    </Button>
                                ) : (
                                    <div />
                                )}
                                <div className="flex items-center gap-2">
                                    {currentStep === 1 &&
                                        !dependentBedPassengerValidation.isValid && (
                                            <span className="max-w-sm text-right text-sm font-semibold text-destructive">
                                                {dependentBedPassengerValidation
                                                    .issues[0]?.message ??
                                                    'Adult Extra Bed and Child With Bed guests must share an Adult Twin or Adult Double room.'}
                                            </span>
                                        )}
                                    {canSaveCurrentStep && (
                                        <Button
                                            type="button"
                                            variant={
                                                currentStep < 4
                                                    ? 'outline'
                                                    : 'default'
                                            }
                                            onClick={handleSaveCurrentStep}
                                            disabled={
                                                isSubmitting ||
                                                isCurrentStepInvalid
                                            }
                                            className="gap-2"
                                        >
                                            {isSubmitting ? (
                                                <Loader2Icon className="size-4 animate-spin" />
                                            ) : (
                                                <SaveIcon className="size-4" />
                                            )}
                                            {canEditDocuments &&
                                            currentStep === 3
                                                ? isSubmitting
                                                    ? 'Saving...'
                                                    : 'Save Documents'
                                                : isSubmitting
                                                  ? 'Saving...'
                                                  : 'Save'}
                                        </Button>
                                    )}
                                    {currentStep < 4 &&
                                        (!isDocumentOnlyMode ||
                                            canUsePaymentControls) && (
                                            <Button
                                                type="button"
                                                disabled={
                                                    (currentStep === 1 &&
                                                        !canProceedStep1) ||
                                                    (currentStep === 2 &&
                                                        !canProceedStep2)
                                                }
                                                onClick={goNext}
                                                className="gap-2"
                                            >
                                                Next
                                                <ArrowRightIcon className="size-4" />
                                            </Button>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* Right spacer */}
                        <div className="hidden w-12 shrink-0 md:block" />
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
