import type { TourResource } from '@/api/model';
import BookingInfoCard from '@/components/booking/BookingInfoCard';
import Step1GuestInformation, {
  calculateAgeAtDeparture,
} from '@/components/booking/Step1GuestInformation';
import Step2RoomConfiguration, {
  autoRecommendRooms,
  type RoomConfig,
} from '@/components/booking/Step2RoomConfiguration';
import Step3TravelDocuments from '@/components/booking/Step3TravelDocuments';
import Step4BookingSummary, {
  type AddOnItem,
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
import { calculateBookingPricing } from '@/utils/booking-calculations';
import { Head, router } from '@inertiajs/react';
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
  visa_number: string | null;
  room_type: string | null;
  note: string | null;
};

type BookingData = {
  id: number;
  booking_number: string;
  status: string;
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
};

type PageProps = {
  booking: BookingData;
  tourPrices: TourPrice[];
  addOns: AddOnItem[];
  minimumDownPaymentPct: number;
  minimumVatPct: number;
};

type EditableGuestEntry = GuestEntry & {
  passengerId?: number;
};

// ---------------------------------------------------------------------------
// Helpers — convert DB passengers → wizard GuestEntry[]
// ---------------------------------------------------------------------------

function passengersToGuests(passengers: Passenger[], tourPrices: TourPrice[]): EditableGuestEntry[] {
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

    let restoredPrice = p.price_amount ?? (matchedPrice ? matchedPrice.price : 0);
    let restoredOriginalPrice = matchedPrice ? matchedPrice.price : restoredPrice;

    if (matchedPrice) {
      if (matchedPrice.promotionRate > 0) {
        restoredPrice = Math.max(0, Math.round(matchedPrice.price - (matchedPrice.price * matchedPrice.promotionRate / 100)));
      } else if (matchedPrice.promotion > 0) {
        restoredPrice = Math.max(0, Math.round(matchedPrice.price - matchedPrice.promotion));
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
    };
  });
}

function bookingRoomsToConfig(rooms: any[]): RoomConfig[] {
  return rooms.map((r, idx) => {
    const bedLayout: { guestId?: string }[] = Array.isArray(r.bed_layout)
      ? r.bed_layout
      : [];

    return {
      id: `room-${idx}`,
      type: r.room_type,
      label: r.room_label,
      capacity: r.capacity || 2,
      guestIds: bedLayout.map((b) => b.guestId).filter(Boolean) as string[],
      sharingGuestIds: [],
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
        passportFileName: '',
        visaFile: null,
        visaFileName: '',
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
  minimumVatPct,
}: PageProps) {
  const { company } = usePageSharedDataProps();
  const isAgent = company.type === 'agent';
  const canEdit = [
    'reserved',
    'booking reserved',
    'awaiting payment',
    'waiting payment approval',
  ].includes(booking.status);

  // ── Non-editable guard ───────────────────────────────────────────
  if (!canEdit) {
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
                This booking can no longer be edited because payment has been
                made. Current status:{' '}
                <strong className="capitalize">{booking.status}</strong>.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.history.back()}
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
      minimumVatPct={minimumVatPct}
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
  minimumVatPct,
  company,
  isAgent,
}: {
  booking: BookingData;
  tourPrices: TourPrice[];
  addOns: AddOnItem[];
  minimumDownPaymentPct: number;
  minimumVatPct: number;
  company: any;
  isAgent: boolean;
}) {
  const departureDate = booking.departure_date?.split('T')[0] ?? '';

  // ── Wizard step state ──────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [direction, setDirection] = useState(1);

  // ── Contact ────────────────────────────────────────────────────────
  const [contact, setContact] = useState<BookingContact>({
    name: booking.contact_name ?? '',
    email: booking.contact_email ?? '',
    phone: booking.contact_phone ?? '',
    notes: booking.contact_notes ?? '',
  });

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
      ? bookingRoomsToConfig(booking.rooms)
      : autoRecommendRooms(initialGuests),
  );
  const [selectedAddOns, setSelectedAddOns] =
    useState<AddOnItem[]>(initialAddOns);
  const selectedAddOnsForPricing = useMemo(
    () =>
      selectedAddOns.map((addon) =>
        addon.hasQty === false ? { ...addon, qty: guests.length } : addon,
      ),
    [selectedAddOns, guests.length],
  );
  const selectedAddOnsTotal = useMemo(
    () =>
      selectedAddOnsForPricing.reduce(
        (sum, addon) => sum + addon.unitPrice * addon.qty,
        0,
      ),
    [selectedAddOnsForPricing],
  );
  const roomsGuestFingerprint = useRef<string>('');
  const skipGuestSyncRef = useRef(false);

  // ── Travel Documents ───────────────────────────────────────────────
  const [travelDocuments, setTravelDocuments] = useState<TravelDocumentEntry[]>(
    () => passengersToTravelDocs(booking.passengers, initialGuests),
  );

  // ── Sync guest array when pax counts change ────────────────────────
  useEffect(() => {
    if (skipGuestSyncRef.current) {
      skipGuestSyncRef.current = false;
      return;
    }

    const newGuests: EditableGuestEntry[] = [];
    const makeDefault = (
      id: string,
      type: 'adult' | 'child' | 'infant',
    ): EditableGuestEntry => ({
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
    });

    for (let i = 0; i < adults; i++) {
      newGuests.push(
        guests.find((g) => g.id === `adult-${i}`) ??
          makeDefault(`adult-${i}`, 'adult'),
      );
    }
    for (let i = 0; i < children; i++) {
      newGuests.push(
        guests.find((g) => g.id === `child-${i}`) ??
          makeDefault(`child-${i}`, 'child'),
      );
    }
    for (let i = 0; i < infants; i++) {
      newGuests.push(
        guests.find((g) => g.id === `infant-${i}`) ??
          makeDefault(`infant-${i}`, 'infant'),
      );
    }

    const docsGuests = newGuests.filter((g) => g.type !== 'infant');
    const newDocs: TravelDocumentEntry[] = docsGuests.map((g) => {
      const existing = travelDocuments.find((d) => d.guestId === g.id);
      return (
        existing ?? {
          guestId: g.id,
          passportNumber: '',
          passportIssueDate: '',
          passportExpiryDate: '',
          visaNumber: '',
          passportFile: null,
          passportFileName: '',
          visaFile: null,
          visaFileName: '',
        }
      );
    });

    setGuests(newGuests);
    setTravelDocuments(newDocs);
  }, [adults, children, infants]);

  // ── Pricing ────────────────────────────────────────────────────────
  const vendor: VendorInfo = booking.vendor ?? {
    id: 0,
    name: 'Unknown',
    payment_mode: 'vendor',
    commission: 0,
  };
  const pricing = useMemo(
    () =>
      calculateBookingPricing(guests, vendor.commission ?? 0, minimumVatPct),
    [guests, vendor, minimumVatPct],
  );

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
    if (currentStep === 1) {
      window.history.back();
      return;
    }
    setDirection(-1);
    setCurrentStep((s) => Math.max(1, s - 1) as WizardStepId);
  };

  const handleGuestUpdate = useCallback((updated: GuestEntry) => {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === updated.id
          ? { ...updated, passengerId: (g as EditableGuestEntry).passengerId }
          : g,
      ),
    );
  }, []);

  const handleGuestRemove = useCallback(
    (guestId: string) => {
      const newGuests = guests.filter((g) => g.id !== guestId);
      if (newGuests.length === guests.length) return;

      skipGuestSyncRef.current = true;
      setGuests(newGuests);
      setAdults(newGuests.filter((g) => g.type === 'adult').length);
      setChildren(newGuests.filter((g) => g.type === 'child').length);
      setInfants(newGuests.filter((g) => g.type === 'infant').length);
    },
    [guests],
  );

  // ── Validation ─────────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d+$/;

  const canProceedStep1 =
    contact.name.trim() !== '' &&
    contact.email.trim() !== '' &&
    emailRegex.test(contact.email.trim()) &&
    contact.phone.trim() !== '' &&
    phoneRegex.test(contact.phone.trim()) &&
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
    return guests.every((g) => assignedGuestIds.includes(g.id));
  }, [guests, rooms]);

  // ── Save (replaces Pay Now) ────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = (addOnsForSave = selectedAddOns) => {
    setIsSubmitting(true);

    const addOnRows = addOnsForSave
      .filter((addon) => addon.qty > 0)
      .map((addon) => ({
        name: addon.label,
        price: addon.unitPrice * addon.qty,
      }));
    const addOnsTotal = addOnRows.reduce((sum, item) => sum + item.price, 0);
    const grandTotal = pricing.totalPrice + addOnsTotal;

    router.put(
      `/companies/${company.username}/dashboard/bookings/${booking.id}`,
      {
        contact_name: contact.name,
        contact_email: contact.email,
        contact_phone: contact.phone,
        contact_notes: contact.notes,
        pax_adult: adults,
        pax_child: children,
        pax_infant: infants,
        total_price: pricing.subtotalGuests,
        tax_amount: pricing.ppn,
        platform_fee: pricing.platformFee,
        commission_amount: pricing.agentCommission,
        grand_total: grandTotal,
        passengers: guests.map((guest) => {
          const doc = travelDocuments.find((d) => d.guestId === guest.id);
          return {
            id: (guest as EditableGuestEntry).passengerId,
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
            room_number: null,
            note: guest.note || null,
          };
        }),
        rooms: rooms.map((room) => ({
          room_type: room.type,
          room_label: room.label,
          bed_layout: room.guestIds.map((guestId, idx) => ({
            bedType: room.type,
            guestId,
            position: { x: idx, y: 0 },
          })),
        })),
        addons: addOnRows,
      } as any,
      {
        preserveScroll: true,
        onSuccess: () => toast.success('Booking updated successfully.'),
        onError: () => toast.error('Failed to update booking.'),
        onFinish: () => setIsSubmitting(false),
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
                <div className="pb-4">
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
                  invoiceNumber={null}
                  departureDate={departureDate}
                  vendor={vendor}
                  agentName={booking.agent?.name ?? '-'}
                  contactName={contact.name}
                  contactEmail={contact.email}
                  contactPhone={contact.phone}
                  pricing={pricing}
                  displayTotalPrice={
                    currentStep === 4
                      ? pricing.totalPrice + selectedAddOnsTotal
                      : undefined
                  }
                  timeLeftSeconds={0}
                  currentStep={currentStep}
                  timerStarted={false}
                />
              </div>

              {/* Steps */}
              <div className="py-2">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={`step-${currentStep}`}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -40 }}
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
                        onGuestUpdate={handleGuestUpdate}
                        onGuestRemove={handleGuestRemove}
                        tourPrices={tourPrices}
                        maxGuests={99}
                        departureDate={departureDate}
                      />
                    )}
                    {currentStep === 2 && (
                      <Step2RoomConfiguration
                        guests={guests}
                        rooms={rooms}
                        onRoomsChange={setRooms}
                      />
                    )}
                    {currentStep === 3 && (
                      <Step3TravelDocuments
                        guests={guests}
                        travelDocuments={travelDocuments}
                        onTravelDocumentsChange={setTravelDocuments}
                        departureDate={departureDate}
                      />
                    )}
                    {currentStep === 4 && (
                      <Step4BookingSummary
                        contact={contact}
                        guests={guests}
                        rooms={rooms}
                        pricing={pricing}
                        vendor={vendor}
                        agentName={booking.agent?.name ?? '-'}
                        onPayNow={(_paymentType, _paymentMethod, addOns) =>
                          handleSave(addOns)
                        }
                        isSubmitting={isSubmitting}
                        initialAddOns={selectedAddOns}
                        onAddOnsChange={setSelectedAddOns}
                        minimumDownPaymentPct={minimumDownPaymentPct}
                        minimumVatPct={minimumVatPct}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              {currentStep < 4 && (
                <div className="flex items-center justify-between pb-12 pt-4">
                  {currentStep > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      className="gap-2"
                    >
                      <ArrowLeftIcon className="size-4" /> Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button
                    type="button"
                    disabled={
                      (currentStep === 1 && !canProceedStep1) ||
                      (currentStep === 2 && !canProceedStep2)
                    }
                    onClick={goNext}
                    className="gap-2"
                  >
                    Next
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              )}
              {currentStep === 4 && (
                <div className="flex items-center justify-between pb-12 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="gap-2"
                  >
                    <ArrowLeftIcon className="size-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <SaveIcon className="size-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            {/* Right spacer */}
            <div className="hidden w-12 shrink-0 md:block" />
          </div>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
}
