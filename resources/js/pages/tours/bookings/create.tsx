import type { TourResource } from '@/api/model';
import BookingInfoCard from '@/components/booking/BookingInfoCard';
import Step1GuestInformation from '@/components/booking/Step1GuestInformation';
import Step2RoomConfiguration, {
  autoRecommendRooms,
  type RoomConfig,
} from '@/components/booking/Step2RoomConfiguration';
import Step3TravelDocuments from '@/components/booking/Step3TravelDocuments';
import Step4BookingSummary, {
  type AddOnItem,
  type PaymentMethod,
  type PaymentType,
} from '@/components/booking/Step4BookingSummary';
import WizardStepIndicator from '@/components/booking/WizardStepIndicator';
import type { TourSchedule } from '@/components/tours/tour-booking-modal';
import { Button } from '@/components/ui/button';
import type { WizardStepId } from '@/constants/booking';
import type {
  BookingContact,
  GuestEntry,
  TourPrice,
  TravelDocumentEntry,
  VendorInfo,
} from '@/types/booking';
import { calculateBookingPricing } from '@/utils/booking-calculations';
import { router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, FileTextIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PageProps = {
  tour: TourResource & { schedules?: TourSchedule[] };
  tourPrices: TourPrice[];
  roomTypes: any[];
  vendor: VendorInfo;
  bookingNumber: string;
};

export default function Page() {
  const { tour, tourPrices, vendor, auth, tenant, bookingNumber } =
    usePage<any>().props as any;
  const user = auth?.user;

  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const preselectedDate = urlParams.get('date') ?? '';

  // ─── Wizard state ───────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back
  const [hasAgreedToTnc, setHasAgreedToTnc] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // ─── Contact ────────────────────────────────────────────────────────
  const [contact, setContact] = useState<BookingContact>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    notes: '',
  });

  // ─── Guests ─────────────────────────────────────────────────────────
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [guests, setGuests] = useState<GuestEntry[]>([]);

  // ─── Rooms ──────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const roomsGuestFingerprint = useRef<string>('');
  const skipGuestSyncRef = useRef(false);

  // ─── Travel Documents ──────────────────────────────────────────────
  const [travelDocuments, setTravelDocuments] = useState<TravelDocumentEntry[]>(
    [],
  );

  // ─── Sync guest array when pax counts change ────────────────────────
  useEffect(() => {
    if (skipGuestSyncRef.current) {
      skipGuestSyncRef.current = false;
      return;
    }

    const newGuests: GuestEntry[] = [];
    const makeDefault = (
      id: string,
      type: 'adult' | 'child' | 'infant',
    ): GuestEntry => ({
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
      roomTypeDescription: '',
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

  // ─── Pricing (single source of truth) ───────────────────────────────
  const pricing = useMemo(
    () => calculateBookingPricing(guests, vendor?.commission ?? 0),
    [guests, vendor],
  );

  // ─── Timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasAgreedToTnc) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert('Waktu pengisian form telah habis.');
          window.history.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasAgreedToTnc]);

  // ─── Navigation ─────────────────────────────────────────────────────
  const goNext = () => {
    if (currentStep === 1) {
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

  const goBack = () => {
    if (currentStep === 1 && hasAgreedToTnc) {
      setHasAgreedToTnc(false);
      setTimeLeft(15 * 60);
      return;
    }
    if (currentStep === 1) {
      window.history.back();
      return;
    }
    setDirection(-1);
    setCurrentStep((s) => Math.max(1, s - 1) as WizardStepId);
  };

  const handleGuestUpdate = useCallback((updated: GuestEntry) => {
    setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }, []);

  const handleGuestRemove = useCallback(
    (guestId: string) => {
      const newGuests = guests.filter((g) => g.id !== guestId);
      if (newGuests.length === guests.length) {
        return;
      }

      const newAdults = newGuests.filter((g) => g.type === 'adult').length;
      const newChildren = newGuests.filter((g) => g.type === 'child').length;
      const newInfants = newGuests.filter((g) => g.type === 'infant').length;

      skipGuestSyncRef.current = true;

      setGuests(newGuests);
      setAdults(newAdults);
      setChildren(newChildren);
      setInfants(newInfants);
    },
    [guests],
  );

  // ─── Validation ─────────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d+$/;

  const canProceedStep1 =
    contact.name.trim() !== '' &&
    contact.email.trim() !== '' &&
    emailRegex.test(contact.email.trim()) &&
    contact.phone.trim() !== '' &&
    phoneRegex.test(contact.phone.trim()) &&
    guests.length > 0 &&
    guests.every(
      (g) =>
        g.title.trim() !== '' &&
        g.firstName.trim() !== '' &&
        g.lastName.trim() !== '' &&
        g.dateOfBirth.trim() !== '' &&
        g.priceCategory !== null,
    );

  const canProceedStep2 = useMemo(() => {
    const assignedGuestIds = rooms.flatMap((r) => r.guestIds);
    return guests.every((g) => assignedGuestIds.includes(g.id));
  }, [guests, rooms]);

  // ─── Submit ─────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayNow = (
    paymentType: PaymentType,
    paymentMethod: PaymentMethod,
    addOns: AddOnItem[],
    finalAmount: number,
  ) => {
    setIsSubmitting(true);

    router.post(
      `/bookings/${tour.id}`,
      {
        tour_id: tour.id,
        departure_date: preselectedDate,
        pax_adult: adults,
        pax_child: children,
        pax_infant: infants,
        vendor_id: vendor?.id ?? (tour.company as any)?.id,
        agent_id: (tenant as any)?.id ?? null,
        agent_code: (tenant as any)?.username ?? 'AGT',
        booking_number: bookingNumber,
        contact_name: contact.name,
        contact_email: contact.email,
        contact_phone: contact.phone,
        contact_notes: contact.notes,
        payment_type: paymentType,
        payment_method: paymentMethod,
        passengers: guests.map((g) => {
          const doc = travelDocuments.find((d) => d.guestId === g.id);
          return {
            title: g.title || null,
            first_name: g.firstName,
            last_name: g.lastName || '',
            gender: null,
            dob: g.dateOfBirth || null,
            pob: g.placeOfBirth || null,
            price_category: g.priceCategory,
            price_amount: g.price,
            passport_number: doc?.passportNumber || null,
            passport_issue_date: doc?.passportIssueDate || null,
            passport_expiry_date: doc?.passportExpiryDate || null,
            visa_number: doc?.visaNumber || null,
            room_type: g.roomTypeDescription || null,
            room_number: null,
          };
        }),
        rooms: rooms.map((r) => ({
          room_type: r.type,
          room_label: r.label,
          bed_layout: r.guestIds.map((gid, idx) => ({
            bedType: r.type,
            guestId: gid,
            position: { x: idx, y: 0 },
          })),
        })),
        add_ons: addOns
          .filter((a) => a.qty > 0)
          .map((a) => ({
            key: a.key,
            label: a.label,
            unit_price: a.unitPrice,
            qty: a.qty,
            total: a.unitPrice * a.qty,
          })),
        total_price: pricing.subtotalGuests,
        tax_amount: pricing.ppn,
        platform_fee: pricing.platformFee,
        commission_amount: pricing.agentCommission,
        grand_total: finalAmount,
      } as any,
      {
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false),
      },
    );
  };

  // ─── Helper ─────────────────────────────────────────────────────────
  const getGuestDisplayName = (guest: GuestEntry) => {
    const parts = [guest.title, guest.firstName, guest.lastName].filter(
      Boolean,
    );
    return parts.length > 0 ? parts.join(' ') : '(unnamed)';
  };

  // ─── Render ─────────────────────────────────────────────────────────
  if (!hasAgreedToTnc) {
    return (
      <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
        <motion.div
          key="tnc"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl px-4 py-8"
        >
          <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3 border-b pb-4">
              <FileTextIcon className="size-6 text-primary" />
              <h2 className="text-xl font-bold">Terms & Conditions</h2>
            </div>
            <div className="prose prose-sm mt-6 max-w-none text-muted-foreground">
              <h3 className="font-semibold text-foreground">
                Booking & Payment Policy
              </h3>
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  The price shown is valid only for the selected departure date.
                </li>
                <li>Full payment is required to secure your booking.</li>
                <li>
                  Seats are subject to availability and will only be confirmed
                  upon successful payment.
                </li>
              </ul>
              <h3 className="mt-6 font-semibold text-foreground">
                Cancellation Policy
              </h3>
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  All bookings are non-refundable unless stated otherwise.
                </li>
                <li>
                  Any changes to guest details or departure dates are subject to
                  administrative fees.
                </li>
                <li>
                  In the event of tour cancellation by the organizer, a full
                  refund will be provided.
                </li>
              </ul>
              <p className="mt-6 rounded-lg bg-muted/50 p-4 text-sm font-medium leading-relaxed text-foreground">
                By clicking &quot;I Agree & Continue&quot;, you agree to the
                Terms & Conditions and will have 15 minutes to complete the
                booking details.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setHasAgreedToTnc(true)}
                className="gap-2"
              >
                I Agree & Continue
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
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
                <WizardStepIndicator currentStep={currentStep} />
              </div>

              {/* Booking Info Card */}
              <BookingInfoCard
                tour={tour}
                status="waiting_payment"
                bookingNumber={bookingNumber ?? null}
                invoiceNumber={null}
                departureDate={preselectedDate}
                vendor={vendor}
                agentName={tenant?.name || '-'}
                contactName={contact.name}
                contactEmail={contact.email}
                contactPhone={contact.phone}
                pricing={pricing}
                timeLeftSeconds={timeLeft}
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
                    />
                  )}
                  {currentStep === 4 && (
                    <Step4BookingSummary
                      contact={contact}
                      guests={guests}
                      rooms={rooms}
                      pricing={pricing}
                      vendor={vendor}
                      agentName={tenant?.name || '-'}
                      onPayNow={handlePayNow}
                      isSubmitting={isSubmitting}
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
                  {currentStep === 3 ? 'Skip' : 'Next'}
                  <ArrowRightIcon className="size-4" />
                </Button>
              </div>
            )}
            {currentStep === 4 && (
              <div className="flex items-center pb-12 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="gap-2"
                >
                  <ArrowLeftIcon className="size-4" /> Back
                </Button>
              </div>
            )}
          </div>

          {/* Right spacer */}
          <div className="hidden w-12 shrink-0 md:block" />
        </div>
      </div>
    </div>
  );
}
