import BookingInfoCard from '@/components/booking/BookingInfoCard';
import BookingPaymentResult, {
  type BookingPaymentResultData,
} from '@/components/booking/BookingPaymentResult';
import type { ManualPaymentData } from '@/components/booking/ManualPaymentDialog';
import Step1GuestInformation, {
  calculateAgeAtDeparture,
} from '@/components/booking/Step1GuestInformation';
import Step2RoomConfiguration, {
  autoRecommendRooms,
  getRoomNumberByGuestId,
  serializeRoomsForBooking,
  type RoomConfig,
} from '@/components/booking/Step2RoomConfiguration';
import Step3TravelDocuments from '@/components/booking/Step3TravelDocuments';
import Step4BookingSummary, {
  type AddOnItem,
  type PaymentMethod,
  type PaymentType,
} from '@/components/booking/Step4BookingSummary';
import WizardStepIndicator from '@/components/booking/WizardStepIndicator';
import TenantLayout from '@/components/layouts/tenant-layout';
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
import { Button } from '@/components/ui/button';
import type { WizardStepId } from '@/constants/booking';
import type {
  BookingContact,
  BookingStatusCode,
  GuestEntry,
  SavedPassengerOption,
  TravelDocumentEntry,
} from '@/types/booking';
import { calculateBookingPricing } from '@/utils/booking-calculations';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, FileTextIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_TNC = `1. The price shown is valid only for the selected departure date.
2. Full payment is required to secure your booking.
3. Seats are subject to availability and confirmed upon successful payment.
4. All bookings are non-refundable unless stated otherwise.
5. Changes to guest details or departure dates are subject to administrative fees.
6. In the event of tour cancellation by the organizer, a full refund will be provided.`;

function makeDefaultGuest(
  id: string,
  type: 'adult' | 'child' | 'infant',
): GuestEntry {
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

function splitContactName(
  name: string,
): { firstName: string; lastName: string } | null {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function isBlankAdultGuest(guest: GuestEntry): boolean {
  return (
    guest.type === 'adult' &&
    guest.firstName.trim() === '' &&
    guest.lastName.trim() === ''
  );
}

function findLatestBlankAdultGuest(guests: GuestEntry[]): GuestEntry | null {
  for (let index = guests.length - 1; index >= 0; index -= 1) {
    if (isBlankAdultGuest(guests[index])) {
      return guests[index];
    }
  }

  return null;
}

function makeDefaultTravelDocument(guestId: string): TravelDocumentEntry {
  return {
    guestId,
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
  };
}

function normalizePaymentValue(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replaceAll('_', ' ');
}

function isConfirmedPaymentResult(
  result: BookingPaymentResultData | undefined,
): boolean {
  if (!result) {
    return false;
  }

  const bookingStatus = normalizePaymentValue(result.bookingStatus);
  const paymentStatus = normalizePaymentValue(result.paymentStatus);

  return (
    paymentStatus === 'paid' ||
    bookingStatus === 'down payment' ||
    bookingStatus === 'full payment'
  );
}

export default function Page() {
  const {
    tour,
    tourPrices,
    vendor,
    auth,
    tenant,
    bookingNumber,
    availability,
    addOns,
    existingBooking,
    bookingTimeLimitMinutes,
    minimumDownPaymentPct,
    minimumVatPct,
    vendorBankInfo,
    termConditions,
    isResumingExistingBooking,
    reservedExpiresAt,
    remainingHoldSeconds,
    paidAmount,
    remainingBalance,
    bookingConflict,
    savedPassengers,
    flash,
  } = usePage<any>().props as any;
  const user = auth?.user;
  const savedPassengerOptions = (savedPassengers ??
    []) as SavedPassengerOption[];
  const [paymentResult, setPaymentResult] =
    useState<BookingPaymentResultData | null>(
      () => flash?.bookingPaymentResult ?? null,
    );
  const [isRefreshingPaymentResult, setIsRefreshingPaymentResult] =
    useState(false);

  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const preselectedDate = urlParams.get('date') ?? '';

  // ─── Determine if we're resuming an existing booking ──────────────
  const isResuming = !!existingBooking && !!isResumingExistingBooking;
  const resumedStatus = existingBooking?.status ?? null;

  // ─── Wizard state ───────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<WizardStepId>(
    resumedStatus === 'down payment' ? 4 : 1,
  );
  const [direction, setDirection] = useState(1); // 1=forward, -1=back
  const [hasAgreedToTnc, setHasAgreedToTnc] = useState(isResuming);
  const initialHoldSeconds =
    typeof remainingHoldSeconds === 'number'
      ? remainingHoldSeconds
      : reservedExpiresAt
        ? Math.ceil((new Date(reservedExpiresAt).getTime() - Date.now()) / 1000)
        : (bookingTimeLimitMinutes ?? 10) * 60;
  const [timeLeft, setTimeLeft] = useState(Math.max(0, initialHoldSeconds));
  const [timerStarted, setTimerStarted] = useState(
    resumedStatus === 'reserved' || resumedStatus === 'booking reserved',
  );
  const [showStep2ConfirmModal, setShowStep2ConfirmModal] = useState(false);
  const isBalancePayment = resumedStatus === 'down payment';
  const conflictStatus = normalizePaymentValue(bookingConflict?.status);
  const hasBookingConflict = Boolean(bookingConflict);
  const paidAmountValue = Number(paidAmount ?? 0);
  const remainingBalanceValue = Math.max(0, Number(remainingBalance ?? 0));
  const bookingInfoStatus: BookingStatusCode = isBalancePayment
    ? 'down_payment'
    : resumedStatus === 'full payment'
      ? 'full_payment'
      : currentStep >= 2 || timerStarted
        ? 'booking_reserved'
        : 'waiting_payment';
  const conflictDescription =
    conflictStatus === 'down payment'
      ? 'There is already a booking for this trip that requires balance payment. Would you like to create a new booking or settle the previous one?'
      : 'There is already a booking for this trip that is currently waiting for payment approval. Would you like to create a new booking?';

  // ─── Contact ────────────────────────────────────────────────────────
  const [contact, setContact] = useState<BookingContact>({
    name: existingBooking?.contact_name || user?.name || '',
    email: existingBooking?.contact_email || user?.email || '',
    phone: existingBooking?.contact_phone || user?.phone || '',
    notes: existingBooking?.contact_notes || '',
  });
  const [contactGuestId, setContactGuestId] = useState<string | null>(null);

  // ─── Guests ─────────────────────────────────────────────────────────
  const [adults, setAdults] = useState<number>(
    Number(existingBooking?.pax_adult ?? 1),
  );
  const [children, setChildren] = useState<number>(
    Number(existingBooking?.pax_child ?? 0),
  );
  const [infants, setInfants] = useState<number>(
    Number(existingBooking?.pax_infant ?? 0),
  );
  const [guests, setGuests] = useState<GuestEntry[]>(() => {
    if (!existingBooking?.passengers?.length) return [];
    // Hydrate guests from existing passengers
    const passengers = existingBooking.passengers as any[];
    const restored: GuestEntry[] = [];
    let adultIdx = 0,
      childIdx = 0,
      infantIdx = 0;

    for (const p of passengers) {
      const cat = p.price_category ?? '';
      const isInfant = cat.toLowerCase().includes('infant');
      const isChild = cat.toLowerCase().includes('child');
      let type: 'adult' | 'child' | 'infant';
      let id: string;

      if (isInfant) {
        type = 'infant';
        id = `infant-${infantIdx++}`;
      } else if (isChild) {
        type = 'child';
        id = `child-${childIdx++}`;
      } else {
        type = 'adult';
        id = `adult-${adultIdx++}`;
      }

      const matchedPrice = tourPrices?.find(
        (tp: any) => tp.categoryName === p.price_category,
      );

      let restoredPrice =
        parseFloat(p.price_amount) || (matchedPrice ? matchedPrice.price : 0);
      const restoredOriginalPrice = matchedPrice
        ? matchedPrice.price
        : restoredPrice;

      if (matchedPrice) {
        if (matchedPrice.promotionRate > 0) {
          restoredPrice = Math.max(
            0,
            Math.round(
              matchedPrice.price -
                (matchedPrice.price * matchedPrice.promotionRate) / 100,
            ),
          );
        } else if (matchedPrice.promotion > 0) {
          restoredPrice = Math.max(
            0,
            Math.round(matchedPrice.price - matchedPrice.promotion),
          );
        }
      }

      restored.push({
        id,
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
        roomTypeDescription:
          p.room_type ?? (matchedPrice ? matchedPrice.description : ''),
        note: p.note ?? '',
      });
    }
    return restored;
  });

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

    setGuests((previousGuests) => {
      const newGuests: GuestEntry[] = [];
      const contactGuest =
        contactGuestId !== null
          ? (previousGuests.find((guest) => guest.id === contactGuestId) ??
            makeDefaultGuest(contactGuestId, 'adult'))
          : null;
      const adultSlots = contactGuest ? Math.max(0, adults - 1) : adults;

      for (let i = 0; i < adultSlots; i++) {
        newGuests.push(
          previousGuests.find((g) => g.id === `adult-${i}`) ??
            makeDefaultGuest(`adult-${i}`, 'adult'),
        );
      }
      if (contactGuest) {
        newGuests.push(contactGuest);
      }
      for (let i = 0; i < children; i++) {
        newGuests.push(
          previousGuests.find((g) => g.id === `child-${i}`) ??
            makeDefaultGuest(`child-${i}`, 'child'),
        );
      }
      for (let i = 0; i < infants; i++) {
        newGuests.push(
          previousGuests.find((g) => g.id === `infant-${i}`) ??
            makeDefaultGuest(`infant-${i}`, 'infant'),
        );
      }

      return newGuests;
    });
  }, [adults, children, contactGuestId, infants]);

  useEffect(() => {
    setTravelDocuments((previousDocs) =>
      guests.map((g) => {
        const existing = previousDocs.find((d) => d.guestId === g.id);

        return existing ?? makeDefaultTravelDocument(g.id);
      }),
    );
  }, [guests]);

  // ─── Pricing (single source of truth) ───────────────────────────────
  const pricing = useMemo(
    () =>
      calculateBookingPricing(
        guests,
        vendor?.commission ?? 0,
        minimumVatPct ?? 11,
      ),
    [guests, vendor, minimumVatPct],
  );
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnItem[]>(
    () => addOns ?? [],
  );
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
  const selectedSchedule = useMemo(() => {
    const schedules = Array.isArray(tour?.schedules) ? tour.schedules : [];

    return (
      schedules.find((schedule: any) => {
        const departureDate = String(schedule?.departure_date ?? '').slice(
          0,
          10,
        );

        return departureDate === preselectedDate;
      }) ?? null
    );
  }, [preselectedDate, tour?.schedules]);
  const paxSummary = useMemo(() => {
    const segments: string[] = [];

    if (adults > 0) {
      segments.push(`${adults} adult${adults === 1 ? '' : 's'}`);
    }

    if (children > 0) {
      segments.push(`${children} child${children === 1 ? '' : 'ren'}`);
    }

    if (infants > 0) {
      segments.push(`${infants} infant${infants === 1 ? '' : 's'}`);
    }

    return segments.join(', ') || 'No guests';
  }, [adults, children, infants]);
  const buildPaymentResultFallback = useCallback(
    ({
      bookingId,
      bookingStatus,
      paymentStatus,
      paymentMode,
      paidAmount: nextPaidAmount = paidAmountValue,
      grandTotal: nextGrandTotal,
      remainingBalance: nextRemainingBalance,
    }: {
      bookingId: number | string;
      bookingStatus: string;
      paymentStatus: string;
      paymentMode: string | null;
      paidAmount?: number;
      grandTotal?: number;
      remainingBalance?: number;
    }): BookingPaymentResultData => {
      const fallbackGrandTotal =
        nextGrandTotal ??
        (Number(existingBooking?.grand_total ?? 0) > 0
          ? Number(existingBooking.grand_total)
          : pricing.totalPrice + selectedAddOnsTotal);
      const fallbackPaidAmount = Number(nextPaidAmount ?? 0);

      return {
        bookingId,
        bookingNumber,
        bookingStatus,
        paymentStatus,
        paymentMode,
        tourName: tour?.name ?? 'Selected tour',
        tourCode: tour?.code ?? null,
        destination: tour?.destination ?? null,
        departureDate:
          preselectedDate || existingBooking?.departure_date || null,
        returnDate:
          selectedSchedule?.return_date ?? selectedSchedule?.returnDate ?? null,
        paxSummary,
        grandTotal: fallbackGrandTotal,
        paidAmount: fallbackPaidAmount,
        remainingBalance:
          nextRemainingBalance ??
          Math.max(0, fallbackGrandTotal - fallbackPaidAmount),
        image: tour?.image ?? null,
      };
    },
    [
      bookingNumber,
      existingBooking?.departure_date,
      existingBooking?.grand_total,
      paidAmountValue,
      paxSummary,
      preselectedDate,
      pricing.totalPrice,
      selectedAddOnsTotal,
      selectedSchedule?.returnDate,
      selectedSchedule?.return_date,
      tour?.code,
      tour?.destination,
      tour?.image,
      tour?.name,
    ],
  );
  const inFlightOnlineConfirms = useRef(new Set<string>());

  // ─── Timer (starts when entering Step 2) ────────────────────────────
  useEffect(() => {
    if (!timerStarted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert(
            'Your time to complete this form has expired. Please refresh the page to try again.',
          );
          window.history.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStarted]);

  // ─── Navigation ─────────────────────────────────────────────────────
  const goNext = () => {
    if (currentStep === 1) {
      if (timerStarted) {
        confirmGoToStep2();
        return;
      }

      // Show confirmation modal before going to Step 2
      setShowStep2ConfirmModal(true);
      return;
    }
    setDirection(1);
    setCurrentStep((s) => Math.min(4, s + 1) as WizardStepId);
  };

  const confirmGoToStep2 = () => {
    setShowStep2ConfirmModal(false);

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

    // Always send the reserve POST to update the booking status and data
    router.post(
      `/bookings/${tour.id}/reserve`,
      {
        tour_id: tour.id,
        departure_date: preselectedDate,
        pax_adult: adults,
        pax_child: children,
        pax_infant: infants,
        booking_number: bookingNumber,
        vendor_id: vendor?.id ?? (tour.company as any)?.id,
        agent_id: (tenant as any)?.id ?? null,
        contact_name: contact.name,
        contact_email: contact.email,
        contact_phone: contact.phone,
        contact_notes: contact.notes,
        total_price: pricing.subtotalGuests,
        tax_amount: pricing.ppn,
        platform_fee: pricing.platformFee,
        commission_amount: pricing.agentCommission,
        grand_total: pricing.totalPrice,
        passengers: guests.map((g) => ({
          title: g.title || null,
          first_name: g.firstName,
          last_name: g.lastName || '',
          gender: null,
          dob: g.dateOfBirth || null,
          pob: g.placeOfBirth || null,
          price_category: g.priceCategory,
          price_amount: g.price,
          room_type: g.roomTypeDescription || null,
          room_number: null,
          note: g.note || null,
        })),
      } as any,
      { preserveScroll: true, preserveState: true },
    );

    if (!timerStarted) {
      setTimerStarted(true);
    }

    setDirection(1);
    setCurrentStep(2);
  };

  const goBack = () => {
    if (currentStep === 1 && hasAgreedToTnc) {
      setHasAgreedToTnc(false);
      setTimeLeft((bookingTimeLimitMinutes ?? 10) * 60);
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

  const handleSavedPassengerSelect = useCallback(
    (guestId: string, savedPassenger: SavedPassengerOption) => {
      const nextDocument: TravelDocumentEntry = {
        ...makeDefaultTravelDocument(guestId),
        passportNumber: savedPassenger.passportNumber ?? '',
        passportIssueDate: savedPassenger.passportIssueDate ?? '',
        passportExpiryDate: savedPassenger.passportExpiryDate ?? '',
        visaNumber: savedPassenger.visaNumber ?? '',
        passportFileName: savedPassenger.passportFileName ?? '',
        passportFilePath: savedPassenger.passportFilePath ?? null,
        visaFileName: savedPassenger.visaFileName ?? '',
        visaFilePath: savedPassenger.visaFilePath ?? null,
      };

      setTravelDocuments((previousDocs) => {
        const existingDocument = previousDocs.find(
          (document) => document.guestId === guestId,
        );

        if (!existingDocument) {
          return [...previousDocs, nextDocument];
        }

        return previousDocs.map((document) =>
          document.guestId === guestId ? nextDocument : document,
        );
      });
    },
    [],
  );

  const handleGuestRemove = useCallback(
    (guestId: string) => {
      if (guestId === contactGuestId) {
        setContactGuestId(null);
      }

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
    [contactGuestId, guests],
  );

  const handleContactGuestToggle = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        const contactNameParts = splitContactName(contact.name);
        const blankAdultGuest = findLatestBlankAdultGuest(guests);
        const canAddNewAdult = adults + children < (availability ?? 99);

        if (!contactNameParts || (!blankAdultGuest && !canAddNewAdult)) {
          return;
        }

        const { firstName, lastName } = contactNameParts;

        if (blankAdultGuest) {
          skipGuestSyncRef.current = true;
          setGuests((previousGuests) =>
            previousGuests.map((guest) =>
              guest.id === blankAdultGuest.id
                ? {
                    ...guest,
                    firstName,
                    lastName,
                  }
                : guest,
            ),
          );
          setContactGuestId(blankAdultGuest.id);
          return;
        }

        const guestId = `adult-${adults}`;
        skipGuestSyncRef.current = true;
        setGuests((prev) => [
          ...prev,
          {
            ...makeDefaultGuest(guestId, 'adult'),
            firstName,
            lastName,
          },
        ]);
        setAdults((prev) => prev + 1);
        setContactGuestId(guestId);
        return;
      }

      if (contactGuestId) {
        skipGuestSyncRef.current = true;
        setGuests((previousGuests) =>
          previousGuests.map((guest) =>
            guest.id === contactGuestId
              ? {
                  ...guest,
                  firstName: '',
                  lastName: '',
                }
              : guest,
          ),
        );
        setContactGuestId(null);
      }
    },
    [adults, availability, children, contact.name, contactGuestId, guests],
  );

  // ─── Validation ─────────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d+$/;

  const paxTakingSeats = adults + children;
  const isAvailabilityExceeded =
    availability !== null && paxTakingSeats > availability;

  const extraBedGuests = guests.filter((g) =>
    g.priceCategory?.toLowerCase().includes('extra bed'),
  );
  const hasValidBaseRoom = guests.some((g) => {
    const priceCategory = g.priceCategory?.toLowerCase() ?? '';
    const roomTypeDescription = g.roomTypeDescription?.toLowerCase() ?? '';

    return (
      !priceCategory.includes('extra bed') &&
      (roomTypeDescription.includes('twin') ||
        roomTypeDescription.includes('double'))
    );
  });
  const extraBedValid = extraBedGuests.length === 0 || hasValidBaseRoom;

  const canProceedStep1 =
    contact.name.trim() !== '' &&
    contact.email.trim() !== '' &&
    emailRegex.test(contact.email.trim()) &&
    contact.phone.trim() !== '' &&
    phoneRegex.test(contact.phone.trim()) &&
    guests.length > 0 &&
    adults > 0 &&
    !isAvailabilityExceeded &&
    extraBedValid &&
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

      const age = calculateAgeAtDeparture(g.dateOfBirth, preselectedDate);
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

  // ─── Submit ─────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const manualSubmitTimerWasRunning = useRef(false);

  const stopHoldTimer = useCallback(() => {
    setTimerStarted(false);
    setShowStep2ConfirmModal(false);
  }, []);

  const showPaymentResult = useCallback(
    (nextResult: BookingPaymentResultData) => {
      stopHoldTimer();
      setPaymentResult(nextResult);
    },
    [stopHoldTimer],
  );

  useEffect(() => {
    if (paymentResult) {
      stopHoldTimer();
    }
  }, [paymentResult, stopHoldTimer]);

  useEffect(() => {
    if (flash?.bookingPaymentResult) {
      showPaymentResult(flash.bookingPaymentResult);
    }
  }, [flash?.bookingPaymentResult, showPaymentResult]);

  const confirmOnlinePaymentAndShowResult = useCallback(
    (
      bookingId: number | string,
      paymentId: number | string | undefined,
      pendingResult: BookingPaymentResultData | undefined,
      options: { showPendingResult: boolean },
    ) => {
      if (!paymentId) {
        if (options.showPendingResult && pendingResult) {
          showPaymentResult(pendingResult);
        }
        setIsSubmitting(false);
        return;
      }

      const confirmKey = `${bookingId}:${paymentId}`;

      if (inFlightOnlineConfirms.current.has(confirmKey)) {
        return;
      }

      inFlightOnlineConfirms.current.add(confirmKey);

      axios
        .post(
          `/bookings/${bookingId}/online-payment/${paymentId}/confirm`,
          {},
          {
            withCredentials: true,
            withXSRFToken: true,
          },
        )
        .then((confirmResponse) => {
          const nextResult =
            (confirmResponse.data?.bookingPaymentResult as
              | BookingPaymentResultData
              | undefined) ?? pendingResult;

          if (
            isConfirmedPaymentResult(nextResult) ||
            options.showPendingResult
          ) {
            if (nextResult) {
              showPaymentResult(nextResult);
            }
          }
        })
        .catch(() => {
          if (options.showPendingResult && pendingResult) {
            showPaymentResult(pendingResult);
          }
        })
        .finally(() => {
          inFlightOnlineConfirms.current.delete(confirmKey);
          setIsSubmitting(false);
        });
    },
    [showPaymentResult],
  );

  const openSnapPayment = useCallback(
    (
      snapToken: string,
      bookingId: number | string,
      paymentId: number | string | undefined,
      pendingResult: BookingPaymentResultData | undefined,
    ) => {
      const snap = (window as any).snap;
      const callbacks = {
        onSuccess: () => {
          confirmOnlinePaymentAndShowResult(
            bookingId,
            paymentId,
            pendingResult,
            {
              showPendingResult: true,
            },
          );
        },
        onPending: () => {
          showPaymentResult(
            pendingResult ??
              buildPaymentResultFallback({
                bookingId,
                bookingStatus: 'booking reserved',
                paymentStatus: 'pending',
                paymentMode: 'online',
              }),
          );
          setIsSubmitting(false);
        },
        onError: () => {
          setIsSubmitting(false);
        },
        onClose: () => {
          confirmOnlinePaymentAndShowResult(
            bookingId,
            paymentId,
            pendingResult,
            {
              showPendingResult: false,
            },
          );
        },
      };

      if (typeof snap?.pay !== 'function') {
        showPaymentResult(
          pendingResult ??
            buildPaymentResultFallback({
              bookingId,
              bookingStatus: 'booking reserved',
              paymentStatus: 'pending',
              paymentMode: 'online',
            }),
        );
        setIsSubmitting(false);
        return;
      }

      snap.pay(snapToken, callbacks);
    },
    [
      buildPaymentResultFallback,
      confirmOnlinePaymentAndShowResult,
      showPaymentResult,
    ],
  );

  const startOnlinePayment = (
    bookingId: number | string,
    paymentType: PaymentType,
    finalAmount: number,
  ) => {
    axios
      .post(
        `/bookings/${bookingId}/online-payment`,
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
        const snapToken = response.data?.payment?.payload?.snap_token as
          | string
          | undefined;
        const paymentId = response.data?.payment?.id as
          | number
          | string
          | undefined;
        const pendingResult = response.data?.bookingPaymentResult as
          | BookingPaymentResultData
          | undefined;

        if (!snapToken) {
          showPaymentResult(
            pendingResult ??
              buildPaymentResultFallback({
                bookingId,
                bookingStatus: 'booking reserved',
                paymentStatus: 'pending',
                paymentMode: 'online',
              }),
          );
          setIsSubmitting(false);
          return;
        }

        openSnapPayment(snapToken, bookingId, paymentId, pendingResult);
      })
      .catch(() => setIsSubmitting(false));
  };

  const submitManualPayment = (
    bookingId: number | string,
    paymentType: PaymentType,
    finalAmount: number,
    manualData?: ManualPaymentData,
  ) => {
    if (!manualData?.proofFile) {
      setIsSubmitting(false);
      return;
    }

    manualSubmitTimerWasRunning.current = timerStarted;
    stopHoldTimer();

    const formData = new FormData();
    formData.append('sender_bank_name', manualData.senderBankName);
    formData.append('sender_account_number', manualData.senderAccountNumber);
    formData.append(
      'transfer_amount',
      String(manualData.transferAmount || finalAmount),
    );
    formData.append('payment_type', paymentType);
    formData.append('proof', manualData.proofFile);

    router.post(`/bookings/${bookingId}/manual-payment`, formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: (page) => {
        const nextResult = (page.props as any)?.flash?.bookingPaymentResult as
          | BookingPaymentResultData
          | undefined;

        showPaymentResult(
          nextResult ??
            buildPaymentResultFallback({
              bookingId,
              bookingStatus: 'waiting payment approval',
              paymentStatus: 'pending',
              paymentMode: 'manual',
              paidAmount: paidAmountValue,
            }),
        );
      },
      onError: () => {
        if (manualSubmitTimerWasRunning.current) {
          setTimerStarted(true);
        }
        manualSubmitTimerWasRunning.current = false;
        setIsSubmitting(false);
      },
      onFinish: () => {
        manualSubmitTimerWasRunning.current = false;
        setIsSubmitting(false);
      },
    });
  };

  const refreshPaymentStatus = useCallback(() => {
    if (!paymentResult) {
      return;
    }

    setIsRefreshingPaymentResult(true);
    router.visit(`${window.location.pathname}${window.location.search}`, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (page) => {
        const nextProps = page.props as any;
        const refreshedPaymentResult =
          (nextProps.bookingPaymentResult ??
            nextProps.flash?.bookingPaymentResult) as
            | BookingPaymentResultData
            | null
            | undefined;

        if (refreshedPaymentResult) {
          setPaymentResult(refreshedPaymentResult);
          return;
        }

        const refreshedBooking = nextProps.existingBooking ?? null;
        const bookingStatus =
          refreshedBooking?.status ?? paymentResult.bookingStatus;
        const normalizedStatus = normalizePaymentValue(bookingStatus);
        const paymentStatus =
          normalizedStatus === 'down payment' ||
          normalizedStatus === 'full payment'
            ? 'paid'
            : normalizedStatus === 'cancelled'
              ? 'failed'
              : paymentResult.paymentStatus;
        const grandTotal = Number(
          refreshedBooking?.grand_total ?? paymentResult.grandTotal,
        );
        const nextPaidAmount = Number(
          nextProps.paidAmount ?? paymentResult.paidAmount,
        );
        const nextRemainingBalance = Number(
          nextProps.remainingBalance ??
            Math.max(0, grandTotal - nextPaidAmount),
        );

        setPaymentResult({
          ...paymentResult,
          bookingId: refreshedBooking?.id ?? paymentResult.bookingId,
          bookingNumber:
            refreshedBooking?.booking_number ?? paymentResult.bookingNumber,
          bookingStatus,
          paymentStatus,
          paymentMode:
            refreshedBooking?.payment_mode ?? paymentResult.paymentMode,
          grandTotal,
          paidAmount: nextPaidAmount,
          remainingBalance: nextRemainingBalance,
        });
      },
      onFinish: () => setIsRefreshingPaymentResult(false),
    });
  }, [paymentResult]);

  const handlePayNow = (
    paymentType: PaymentType,
    paymentMethod: PaymentMethod,
    addOns: AddOnItem[],
    finalAmount: number,
    manualData?: ManualPaymentData,
  ) => {
    setIsSubmitting(true);

    if (isBalancePayment && existingBooking?.id) {
      if (paymentMethod === 'midtrans') {
        startOnlinePayment(existingBooking.id, paymentType, finalAmount);
        return;
      }

      submitManualPayment(
        existingBooking.id,
        paymentType,
        finalAmount,
        manualData,
      );
      return;
    }

    const addOnRows = addOns
      .filter((a) => a.qty > 0)
      .map((a) => ({
        name: a.label,
        price: a.unitPrice * a.qty,
      }));
    const addOnsTotal = addOnRows.reduce((sum, item) => sum + item.price, 0);
    const grandTotal = pricing.totalPrice + addOnsTotal;
    const roomNumberByGuestId = getRoomNumberByGuestId(rooms);
    const payload: Record<string, unknown> = {
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
          passport_file: doc?.passportFile ?? null,
          passport_file_path: doc?.passportFile
            ? null
            : (doc?.passportFilePath ?? null),
          visa_number: doc?.visaNumber || null,
          visa_file: doc?.visaFile ?? null,
          visa_file_path: doc?.visaFile ? null : (doc?.visaFilePath ?? null),
          room_type: g.roomTypeDescription || null,
          room_number: roomNumberByGuestId.get(g.id) ?? null,
          note: g.note || null,
        };
      }),
      addons: addOnRows,
      total_price: pricing.subtotalGuests,
      tax_amount: pricing.ppn,
      platform_fee: pricing.platformFee,
      commission_amount: pricing.agentCommission,
      grand_total: grandTotal,
    };

    if (rooms.length > 0) {
      payload.rooms = serializeRoomsForBooking(rooms);
    }

    router.post(`/bookings/${tour.id}`, payload as any, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        if (paymentMethod === 'midtrans') {
          const bookingId = existingBooking?.id;
          if (!bookingId) {
            setIsSubmitting(false);
            return;
          }

          startOnlinePayment(bookingId, paymentType, finalAmount);
          return;
        }

        if (!manualData || paymentMethod !== 'manual_transfer') {
          return;
        }

        const bookingId = existingBooking?.id;
        if (!bookingId || !manualData.proofFile) {
          setIsSubmitting(false);
          return;
        }

        submitManualPayment(bookingId, paymentType, finalAmount, manualData);
      },
      onError: () => {
        setIsSubmitting(false);
      },
      onFinish: () => {
        if (!manualData && paymentMethod !== 'midtrans') {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ─── Helper ─────────────────────────────────────────────────────────
  // ─── Render ─────────────────────────────────────────────────────────
  if (paymentResult) {
    return (
      <TenantLayout>
        <BookingPaymentResult
          result={paymentResult}
          onRefresh={refreshPaymentStatus}
          isRefreshing={isRefreshingPaymentResult}
        />
      </TenantLayout>
    );
  }

  if (hasBookingConflict) {
    return (
      <TenantLayout>
        <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30" />
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {conflictStatus === 'down payment'
                  ? 'Balance payment required'
                  : 'Waiting Payment Approval'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {conflictDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.visit(bookingConflict.newBookingUrl)}
              >
                Yes, I want to make a new booking
              </Button>
              <Button
                type="button"
                onClick={() =>
                  router.visit(
                    conflictStatus === 'down payment'
                      ? bookingConflict.continuePaymentUrl
                      : bookingConflict.checkPaymentStatusUrl,
                  )
                }
              >
                {conflictStatus === 'down payment'
                  ? 'Pay Balance'
                  : 'Check Payment Status'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TenantLayout>
    );
  }

  if (!hasAgreedToTnc) {
    return (
      <TenantLayout>
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
              <div className="mt-6 max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {termConditions || DEFAULT_TNC}
                </p>
              </div>
              <p className="mt-6 rounded-lg bg-muted/50 p-4 text-sm font-medium leading-relaxed text-foreground">
                By clicking &quot;I Agree &amp; Continue&quot;, you agree to the
                Terms &amp; Conditions. A {bookingTimeLimitMinutes}-minute timer
                will start on the room arrangement step to complete your
                booking.
              </p>
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
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
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
                  status={bookingInfoStatus}
                  bookingNumber={bookingNumber ?? null}
                  invoiceNumber={null}
                  departureDate={preselectedDate}
                  vendor={vendor}
                  agentName={tenant?.name || '-'}
                  contactName={contact.name}
                  contactEmail={contact.email}
                  contactPhone={contact.phone}
                  pricing={pricing}
                  totalPaid={paidAmountValue}
                  displayTotalPrice={
                    currentStep === 4
                      ? pricing.totalPrice + selectedAddOnsTotal
                      : undefined
                  }
                  timeLeftSeconds={timeLeft}
                  currentStep={currentStep}
                  timerStarted={timerStarted}
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
                        maxGuests={availability ?? 99}
                        departureDate={preselectedDate}
                        contactGuestId={contactGuestId}
                        onContactGuestToggle={handleContactGuestToggle}
                        contactAsGuestAdded={contactGuestId !== null}
                        savedPassengers={savedPassengerOptions}
                        onSavedPassengerSelect={handleSavedPassengerSelect}
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
                        departureDate={preselectedDate}
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
                        initialAddOns={selectedAddOns}
                        onAddOnsChange={setSelectedAddOns}
                        minimumDownPaymentPct={minimumDownPaymentPct}
                        minimumVatPct={minimumVatPct}
                        paidAmount={paidAmountValue}
                        remainingBalance={remainingBalanceValue}
                        forceBalancePayment={isBalancePayment}
                        vendorBankInfo={vendorBankInfo}
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
                  <div className="flex flex-col items-end gap-2">
                    {currentStep === 1 && isAvailabilityExceeded && (
                      <span className="text-sm font-semibold text-destructive">
                        Not enough availability. Only {availability} seats left.
                      </span>
                    )}
                    {currentStep === 1 && !extraBedValid && (
                      <span className="text-sm font-semibold text-destructive">
                        "Extra Bed" can only be added with an Adult Twin or
                        Adult Double room.
                      </span>
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

        {/* ─── Step 1 → Step 2 Confirmation Modal ────────────────────────── */}
        <AlertDialog
          open={showStep2ConfirmModal}
          onOpenChange={setShowStep2ConfirmModal}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Before you continue</AlertDialogTitle>
              <AlertDialogDescription>
                On the next screen, please complete your transaction within{' '}
                {bookingTimeLimitMinutes}-minutes to avoid cancellation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmGoToStep2}>
                I understand, continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TenantLayout>
  );
}
