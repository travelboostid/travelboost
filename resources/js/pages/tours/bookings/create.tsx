import BookingInfoCard from '@/components/booking/BookingInfoCard';
import BookingPaymentResult, {
    type BookingPaymentResultData,
} from '@/components/booking/BookingPaymentResult';
import type { ManualPaymentData } from '@/components/booking/ManualPaymentDialog';
import Step1GuestInformation, {
    calculateAgeAtDeparture,
} from '@/components/booking/Step1GuestInformation';
import Step2RoomConfiguration, {
    getRoomNumberByGuestId,
    isRoomArrangementComplete,
    loadRoomsFromBooking,
    recommendRoomsForGuests,
    serializeRoomsForBooking,
    validateDependentBedPassengerMix,
    validateRoomArrangement,
    type RoomConfig,
} from '@/components/booking/Step2RoomConfiguration';
import Step3TravelDocuments from '@/components/booking/Step3TravelDocuments';
import Step4BookingSummary, {
    type AddOnItem,
    type PaymentMethod,
    type PaymentType,
} from '@/components/booking/Step4BookingSummary';
import WizardStepIndicator from '@/components/booking/WizardStepIndicator';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import TenantLayout from '@/components/layouts/tenant-layout';
import { OnlinePaymentDialog } from '@/components/payment/online-payment-dialog';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
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
import { hasOnlinePaymentInstructions } from '@/lib/payment-instructions';
import type { PaymentStatusSyncResult } from '@/lib/payment-status';
import type {
    BookingContact,
    BookingStatusCode,
    DashboardCustomerOption,
    GuestEntry,
    SavedPassengerOption,
    TravelDocumentEntry,
    VisaCategoryItemOption,
} from '@/types/booking';
import {
    calculateAddOnPricing,
    calculateBookingPricing,
} from '@/utils/booking-calculations';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ClockIcon,
    FileTextIcon,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { toast } from 'sonner';

const DEFAULT_TNC = `1. The price shown is valid only for the selected departure date.
2. Full payment is required to secure your booking.
3. Seats are subject to availability and confirmed upon successful payment.
4. All bookings are non-refundable unless stated otherwise.
5. Changes to guest details or departure dates are subject to administrative fees.
6. In the event of tour cancellation by the organizer, a full refund will be provided.`;

function renderTermsHtml(value: string): string {
    if (!value.trim()) {
        return DEFAULT_TNC.replace(/\n/g, '<br />');
    }

    if (value.includes('<')) {
        return value;
    }

    return value.replace(/\n/g, '<br />');
}

const CONTACT_GUEST_ID = 'booking-contact-guest';
const DEFAULT_PAYMENT_UNAVAILABLE_MESSAGE =
    'Payment is temporarily unavailable. Please try again later or contact customer support.';

type AgentOption = {
    id: number;
    name: string;
    username: string;
    email?: string | null;
};

type PendingMidtransPayment = {
    paymentType: PaymentType;
    finalAmount: number;
    addOns: AddOnItem[];
    manualData?: ManualPaymentData;
};

type ActiveOnlinePayment = {
    bookingId: number | string;
    paymentId?: number | string;
    provider: string;
    amount: number;
    payload: Record<string, unknown>;
    pendingResult?: BookingPaymentResultData;
};

function formatCountdown(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
}

function parseTimestamp(value: unknown): number | null {
    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    const timestamp = new Date(value).getTime();

    return Number.isFinite(timestamp) ? timestamp : null;
}

function BookingHoldTimer({ timeLeftSeconds }: { timeLeftSeconds: number }) {
    const timerColor =
        timeLeftSeconds < 300
            ? 'text-destructive'
            : timeLeftSeconds < 600
              ? 'text-primary'
              : 'text-primary';

    return (
        <div
            className="flex shrink-0 items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 shadow-sm sm:min-w-36"
            role="timer"
            aria-live="polite"
            aria-label={`Time remaining: ${formatCountdown(timeLeftSeconds)}`}
        >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Time Left
            </span>
            <span
                className={`flex items-center gap-1.5 font-mono text-lg font-bold leading-none ${timerColor}`}
            >
                <ClockIcon className="size-4" />
                <span>{formatCountdown(timeLeftSeconds)}</span>
            </span>
        </div>
    );
}

function RequiredFieldsHint() {
    return (
        <p className="text-xs font-medium text-muted-foreground">
            Fields marked with{' '}
            <span className="font-semibold text-destructive">*</span> are
            required.
        </p>
    );
}

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
        visaCategoryItemId: null,
        visaTypeDescription: null,
        visaTypePrice: 0,
        visaTypeIsTaxable: false,
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

function fileNameFromPath(path: string | null | undefined): string {
    if (!path) {
        return '';
    }

    return path.split(/[\\/]/).pop() ?? '';
}

function normalizePaymentValue(value: string | null | undefined): string {
    const normalized = (value ?? '')
        .toLowerCase()
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .trim();

    if (normalized === 'dp') {
        return 'down payment';
    }

    if (normalized === 'fp') {
        return 'full payment';
    }

    if (normalized === 'brs') {
        return 'booking reserved';
    }

    if (normalized === 'wpa') {
        return 'waiting payment approval';
    }

    return normalized;
}

function firstErrorMessage(value: unknown): string | null {
    if (typeof value === 'string') {
        return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
    }

    return null;
}

function paymentErrorMessageFromResponse(error: unknown): string | null {
    const responseData = (error as { response?: { data?: unknown } })?.response
        ?.data as { errors?: Record<string, unknown>; message?: unknown };

    return (
        firstErrorMessage(responseData?.errors?.payment) ??
        firstErrorMessage(responseData?.errors?.payment_type) ??
        firstErrorMessage(responseData?.message)
    );
}

function toBookingInfoStatus(value: string): BookingStatusCode {
    if (value === 'down payment') {
        return 'down_payment';
    }

    if (value === 'full payment') {
        return 'full_payment';
    }

    if (value === 'waiting payment approval') {
        return 'waiting_payment_approval';
    }

    if (value === 'booking reserved') {
        return 'booking_reserved';
    }

    if (value === 'reserved') {
        return 'reserved';
    }

    if (value === 'expired') {
        return 'expired';
    }

    if (value === 'cancelled') {
        return 'cancel';
    }

    if (value === 'refunded') {
        return 'refund';
    }

    if (value === 'waiting list') {
        return 'waiting_list';
    }

    return 'waiting_payment';
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

function bookingIdFromPageProps(pageProps: unknown): number | string | null {
    const bookingId = (pageProps as any)?.existingBooking?.id;

    if (typeof bookingId === 'number' || typeof bookingId === 'string') {
        return bookingId;
    }

    return null;
}

export default function Page() {
    const {
        tour,
        tourPrices,
        vendor,
        auth,
        tenant,
        company,
        bookingNumber,
        inputBy,
        availability,
        bookingSeatLimit,
        addOns,
        visaCategoryItems = [],
        existingBooking,
        bookingTimeLimitMinutes,
        minimumDownPaymentPct,
        downPaymentRule,
        minimumVatPct,
        platformFeePerPax,
        vendorBankInfo,
        termConditions,
        isResumingExistingBooking,
        serverNow,
        reservedExpiresAt,
        remainingHoldSeconds,
        paidAmount,
        remainingBalance,
        downPaymentPaidAt,
        customerFacingInvoiceType = null,
        downPaymentAvailable = true,
        fullPaymentAvailable = true,
        paymentMethodAvailability = {
            manual: true,
            online: true,
        },
        paymentUnavailableReason = null,
        bookingConflict,
        savedPassengers,
        customerOptions = [],
        agentOptions = [],
        requiresAgentSelection = false,
        dashboardBookingContext,
        flash,
    } = usePage<any>().props as any;
    const visaTypeOptions = visaCategoryItems as VisaCategoryItemOption[];
    const isDashboardBooking = Boolean(dashboardBookingContext?.isDashboard);
    const bookingActionBaseUrl =
        dashboardBookingContext?.bookingActionBaseUrl ?? '/bookings';
    const reserveUrl =
        dashboardBookingContext?.reserveUrl ?? `/bookings/${tour.id}/reserve`;
    const storeUrl =
        dashboardBookingContext?.storeUrl ?? `/bookings/${tour.id}`;
    const dashboardReturnUrl =
        dashboardBookingContext?.returnUrl ??
        `/companies/${company?.username}/dashboard/bookings`;
    const bookingActionUrl = useCallback(
        (bookingId: number | string, action: string) =>
            `${bookingActionBaseUrl}/${bookingId}/${action}`,
        [bookingActionBaseUrl],
    );
    const renderBookingLayout = useCallback(
        (children: ReactNode, onNavigateAway?: (href: string) => void) => {
            if (isDashboardBooking) {
                return (
                    <CompanyDashboardLayout
                        openMenuIds={['tours']}
                        activeMenuIds={[
                            company?.type === 'agent'
                                ? 'tours.bookings'
                                : 'tours.orders',
                        ]}
                        onNavigateAway={onNavigateAway}
                        breadcrumb={[
                            { title: 'Tours' },
                            {
                                title: 'Bookings',
                                url: dashboardReturnUrl,
                            },
                            { title: 'Create Booking' },
                        ]}
                    >
                        {children}
                    </CompanyDashboardLayout>
                );
            }

            return (
                <TenantLayout onNavigateAway={onNavigateAway}>
                    {children}
                </TenantLayout>
            );
        },
        [company?.type, dashboardReturnUrl, isDashboardBooking],
    );
    const user = auth?.user;
    const rawSavedPassengerOptions = useMemo(
        () => (savedPassengers ?? []) as SavedPassengerOption[],
        [savedPassengers],
    );
    const rawSeatLimit = bookingSeatLimit ?? availability;
    const parsedSeatLimit =
        rawSeatLimit === null || rawSeatLimit === undefined
            ? null
            : Number(rawSeatLimit);
    const bookingSeatLimitValue =
        parsedSeatLimit !== null && Number.isFinite(parsedSeatLimit)
            ? Math.max(0, parsedSeatLimit)
            : null;
    const maxSeatTakingGuests = bookingSeatLimitValue ?? 99;
    const [paymentResult, setPaymentResult] =
        useState<BookingPaymentResultData | null>(
            () => flash?.bookingPaymentResult ?? null,
        );
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<
        string | null
    >(null);
    const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] =
        useState(false);
    const [pendingMidtransPayment, setPendingMidtransPayment] =
        useState<PendingMidtransPayment | null>(null);
    const [activeOnlinePayment, setActiveOnlinePayment] =
        useState<ActiveOnlinePayment | null>(null);
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
    const resumedStatusValue = normalizePaymentValue(resumedStatus);
    const isPaidBookingMode =
        resumedStatusValue === 'down payment' ||
        resumedStatusValue === 'full payment';
    const canUpdateTravelDocuments =
        resumedStatusValue === 'waiting payment approval' ||
        resumedStatusValue === 'down payment' ||
        resumedStatusValue === 'full payment';
    const isReviewMode = urlParams.get('mode') === 'review' && isResuming;
    const isDocumentUpdateMode =
        urlParams.get('step') === 'documents' && canUpdateTravelDocuments;
    const isDashboardPaymentStep =
        isDashboardBooking && urlParams.get('step') === 'payment' && isResuming;
    const isReadOnlyBookingMode =
        isPaidBookingMode || isReviewMode || isDocumentUpdateMode;
    const isTravelDocumentsReadOnly =
        isReviewMode || (canUpdateTravelDocuments && !isDocumentUpdateMode);
    const requestedReturnTab = urlParams.get('return_tab') ?? '';
    const returnTab = ['current', 'history', 'favorites'].includes(
        requestedReturnTab,
    )
        ? (requestedReturnTab as 'current' | 'history' | 'favorites')
        : 'current';
    const resumedBookingReturnUrl =
        isResuming && bookingNumber
            ? `/mybookings?tab=${returnTab}&booking_number=${encodeURIComponent(
                  String(bookingNumber),
              )}`
            : null;

    // ─── Wizard state ───────────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState<WizardStepId>(
        isDashboardPaymentStep
            ? 4
            : isReviewMode
              ? 4
              : isDocumentUpdateMode
                ? 3
                : resumedStatusValue === 'down payment'
                  ? 4
                  : 1,
    );
    const [direction, setDirection] = useState(1); // 1=forward, -1=back
    const [hasAgreedToTnc, setHasAgreedToTnc] = useState(
        isResuming || isDocumentUpdateMode || isDashboardPaymentStep,
    );
    const clientServerOffsetMs = useMemo(() => {
        const timestamp = parseTimestamp(serverNow);

        return timestamp === null ? 0 : timestamp - Date.now();
    }, [serverNow]);
    const reservedExpiresAtTimestamp = useMemo(
        () => parseTimestamp(reservedExpiresAt),
        [reservedExpiresAt],
    );
    const fallbackHoldSeconds = Math.max(
        0,
        typeof remainingHoldSeconds === 'number'
            ? remainingHoldSeconds
            : (bookingTimeLimitMinutes ?? 10) * 60,
    );
    const localHoldExpiresAtRef = useRef<number | null>(
        reservedExpiresAtTimestamp,
    );
    const holdExpiryHandledRef = useRef(false);
    const calculateRemainingHoldSeconds = useCallback(() => {
        const holdExpiresAt =
            reservedExpiresAtTimestamp ?? localHoldExpiresAtRef.current;

        if (holdExpiresAt === null) {
            return fallbackHoldSeconds;
        }

        const serverAdjustedNow = Date.now() + clientServerOffsetMs;

        return Math.max(
            0,
            Math.ceil((holdExpiresAt - serverAdjustedNow) / 1000),
        );
    }, [clientServerOffsetMs, fallbackHoldSeconds, reservedExpiresAtTimestamp]);
    const [timeLeft, setTimeLeft] = useState(() =>
        calculateRemainingHoldSeconds(),
    );
    const [timerStarted, setTimerStarted] = useState(
        !isReviewMode &&
            (resumedStatusValue === 'reserved' ||
                resumedStatusValue === 'booking reserved'),
    );
    const [showStep2ConfirmModal, setShowStep2ConfirmModal] = useState(false);
    const [pendingExitTarget, setPendingExitTarget] = useState<{
        href?: string;
        historyBack?: boolean;
    } | null>(null);
    const [isReleasingHold, setIsReleasingHold] = useState(false);
    const [holdExpiryDialogOpen, setHoldExpiryDialogOpen] = useState(false);
    const [isResolvingHoldExpiry, setIsResolvingHoldExpiry] = useState(false);
    useEffect(() => {
        if (reservedExpiresAtTimestamp !== null) {
            localHoldExpiresAtRef.current = reservedExpiresAtTimestamp;
            holdExpiryHandledRef.current = false;
            setTimeLeft(calculateRemainingHoldSeconds());

            return;
        }

        if (!timerStarted) {
            localHoldExpiresAtRef.current = null;
        }
    }, [
        calculateRemainingHoldSeconds,
        reservedExpiresAtTimestamp,
        timerStarted,
    ]);
    const isBalancePayment = resumedStatusValue === 'down payment';
    const conflictStatus = normalizePaymentValue(bookingConflict?.status);
    const hasBookingConflict = Boolean(bookingConflict);
    const paidAmountValue = Number(paidAmount ?? 0);
    const remainingBalanceValue = Math.max(0, Number(remainingBalance ?? 0));
    const bookingInfoStatus: BookingStatusCode = isReviewMode
        ? toBookingInfoStatus(resumedStatusValue)
        : isBalancePayment
          ? 'down_payment'
          : resumedStatusValue === 'full payment'
            ? 'full_payment'
            : currentStep >= 2 || timerStarted
              ? 'booking_reserved'
              : 'waiting_payment';
    const showBookingTimer =
        !isReadOnlyBookingMode && (timerStarted || currentStep >= 2);
    const showProformaInvoiceButton =
        resumedStatusValue === 'down payment' ||
        (isDashboardBooking &&
            bookingInfoStatus === 'booking_reserved' &&
            showBookingTimer);
    const conflictDescription =
        conflictStatus === 'down payment'
            ? 'There is already a booking for this trip that requires balance payment. Would you like to create a new booking or settle the previous one?'
            : 'There is already a booking for this trip that is currently waiting for payment approval. Would you like to create a new booking?';

    // ─── Contact ────────────────────────────────────────────────────────
    const dashboardCustomerOptions = useMemo(
        () =>
            Array.isArray(customerOptions)
                ? (customerOptions as DashboardCustomerOption[])
                : [],
        [customerOptions],
    );
    const dashboardAgentOptions = useMemo(
        () =>
            Array.isArray(agentOptions) ? (agentOptions as AgentOption[]) : [],
        [agentOptions],
    );
    const [selectedAgentId, setSelectedAgentId] = useState<number | null>(
        () => {
            const existingAgentId = Number(existingBooking?.agent_id ?? 0);

            if (existingAgentId > 0) {
                return existingAgentId;
            }

            if (isDashboardBooking && requiresAgentSelection) {
                return null;
            }

            return Number((tenant as any)?.id ?? 0) || null;
        },
    );
    const selectedDashboardAgent = useMemo(
        () =>
            dashboardAgentOptions.find(
                (agentOption) => agentOption.id === selectedAgentId,
            ) ?? null,
        [dashboardAgentOptions, selectedAgentId],
    );
    const agentSelectionError =
        isDashboardBooking && requiresAgentSelection
            ? dashboardAgentOptions.length === 0
                ? 'Vendor must have at least one active agent partner before creating a booking.'
                : selectedAgentId === null
                  ? 'Please select an agent for this booking.'
                  : null
            : null;
    const hasRequiredAgentSelection =
        !isDashboardBooking ||
        !requiresAgentSelection ||
        selectedAgentId !== null;
    const filteredDashboardCustomerOptions = useMemo(() => {
        if (!isDashboardBooking || !requiresAgentSelection) {
            return dashboardCustomerOptions;
        }

        if (selectedAgentId === null) {
            return [];
        }

        return dashboardCustomerOptions.filter(
            (customer) => Number(customer.company_id ?? 0) === selectedAgentId,
        );
    }, [
        dashboardCustomerOptions,
        isDashboardBooking,
        requiresAgentSelection,
        selectedAgentId,
    ]);
    const savedPassengerOptions = useMemo(() => {
        if (!isDashboardBooking) {
            return rawSavedPassengerOptions;
        }

        if (requiresAgentSelection && selectedAgentId === null) {
            return [];
        }

        if (selectedAgentId === null) {
            return rawSavedPassengerOptions;
        }

        return rawSavedPassengerOptions.filter((savedPassenger) => {
            const ownerCompanyId = Number(savedPassenger.ownerCompanyId ?? 0);

            return ownerCompanyId === 0 || ownerCompanyId === selectedAgentId;
        });
    }, [
        isDashboardBooking,
        rawSavedPassengerOptions,
        requiresAgentSelection,
        selectedAgentId,
    ]);
    const [contact, setContact] = useState<BookingContact>({
        name:
            existingBooking?.contact_name ||
            (isDashboardBooking ? '' : user?.name || ''),
        email:
            existingBooking?.contact_email ||
            (isDashboardBooking ? '' : user?.email || ''),
        phone:
            existingBooking?.contact_phone ||
            (isDashboardBooking ? '' : user?.phone || ''),
        notes: existingBooking?.contact_notes || '',
    });
    const [customerBookingMode, setCustomerBookingMode] = useState<
        'existing' | 'guest'
    >('guest');
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
        null,
    );
    const [contactGuestId, setContactGuestId] = useState<string | null>(null);
    const handleDashboardCustomerSelect = useCallback(
        (customer: DashboardCustomerOption | null) => {
            setSelectedCustomerId(customer?.id ?? null);

            if (!customer) {
                setContact({
                    name: '',
                    email: '',
                    phone: '',
                    notes: contact.notes,
                });
                return;
            }

            setContact({
                name: customer.name,
                email: customer.email,
                phone: customer.phone ?? '',
                notes: customer.note ?? contact.notes,
            });
        },
        [contact.notes],
    );

    // ─── Guests ─────────────────────────────────────────────────────────
    const handleDashboardAgentChange = useCallback(
        (agentId: number | null) => {
            setSelectedAgentId(agentId);

            if (customerBookingMode === 'existing') {
                handleDashboardCustomerSelect(null);
            }
        },
        [customerBookingMode, handleDashboardCustomerSelect],
    );

    const [adults, setAdults] = useState<number>(
        Number(existingBooking?.pax_adult ?? 0),
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
                parseFloat(p.price_amount) ||
                (matchedPrice ? matchedPrice.price : 0);
            const restoredOriginalPrice = matchedPrice
                ? matchedPrice.price
                : restoredPrice;

            if (matchedPrice && !(parseFloat(p.price_amount) > 0)) {
                if (matchedPrice.promotionRate > 0) {
                    restoredPrice = Math.max(
                        0,
                        Math.round(
                            matchedPrice.price -
                                (matchedPrice.price *
                                    matchedPrice.promotionRate) /
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

            restored.push({
                id,
                bookingPassengerId: Number(p.id),
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
                    p.room_type ??
                    (matchedPrice ? matchedPrice.description : ''),
                visaCategoryItemId: p.visa_category_item_id
                    ? Number(p.visa_category_item_id)
                    : null,
                visaTypeDescription: p.visa_type_description ?? null,
                visaTypePrice: Number(p.visa_type_price ?? 0),
                visaTypeIsTaxable: Boolean(p.visa_type_is_taxable),
                note: p.note ?? '',
            });
        }
        return restored;
    });

    // ─── Rooms ──────────────────────────────────────────────────────────
    const [rooms, setRooms] = useState<RoomConfig[]>(() =>
        loadRoomsFromBooking(
            existingBooking?.rooms ?? [],
            guests,
            existingBooking?.passengers ?? [],
        ),
    );
    const roomsGuestFingerprint = useRef<string>(
        rooms.length > 0 && isRoomArrangementComplete(rooms, guests)
            ? JSON.stringify(guests.map((g) => `${g.id}-${g.priceCategory}`))
            : '',
    );
    const skipGuestSyncRef = useRef(false);

    // ─── Travel Documents ──────────────────────────────────────────────
    const [travelDocuments, setTravelDocuments] = useState<
        TravelDocumentEntry[]
    >(() =>
        guests.map((guest) => {
            const passenger = (existingBooking?.passengers ?? []).find(
                (item: any) =>
                    Number(item.id) === Number(guest.bookingPassengerId),
            );

            if (!passenger) {
                return makeDefaultTravelDocument(guest.id);
            }

            return {
                ...makeDefaultTravelDocument(guest.id),
                passportNumber: passenger.passport_number ?? '',
                passportIssueDate: passenger.passport_issue_date
                    ? String(passenger.passport_issue_date).slice(0, 10)
                    : '',
                passportExpiryDate: passenger.passport_expiry_date
                    ? String(passenger.passport_expiry_date).slice(0, 10)
                    : '',
                visaNumber: passenger.visa_number ?? '',
                passportFilePath: passenger.passport_file_path ?? null,
                passportFileName: fileNameFromPath(
                    passenger.passport_file_path,
                ),
                visaFilePath: passenger.visa_file_path ?? null,
                visaFileName: fileNameFromPath(passenger.visa_file_path),
            };
        }),
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
                    ? (previousGuests.find(
                          (guest) => guest.id === contactGuestId,
                      ) ?? makeDefaultGuest(contactGuestId, 'adult'))
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
    const pricingTourPrices = useMemo(
        () =>
            isDashboardBooking &&
            requiresAgentSelection &&
            selectedAgentId === null
                ? []
                : (tourPrices ?? []),
        [
            isDashboardBooking,
            requiresAgentSelection,
            selectedAgentId,
            tourPrices,
        ],
    );
    const pricing = useMemo(
        () =>
            calculateBookingPricing(
                guests,
                0,
                minimumVatPct ?? 0,
                platformFeePerPax ?? 25_000,
                pricingTourPrices,
                selectedAgentId,
            ),
        [
            guests,
            minimumVatPct,
            platformFeePerPax,
            pricingTourPrices,
            selectedAgentId,
        ],
    );
    const [selectedAddOns, setSelectedAddOns] = useState<AddOnItem[]>(
        () => addOns ?? [],
    );
    const selectedAddOnsForPricing = useMemo(
        () =>
            selectedAddOns.map((addon) =>
                addon.hasQty === false && addon.qty > 0
                    ? { ...addon, qty: guests.length }
                    : addon,
            ),
        [selectedAddOns, guests.length],
    );
    const selectedAddOnPricing = useMemo(
        () =>
            calculateAddOnPricing(selectedAddOnsForPricing, minimumVatPct ?? 0),
        [minimumVatPct, selectedAddOnsForPricing],
    );
    const computedGrandTotal =
        pricing.totalPrice +
        selectedAddOnPricing.addOnsTotal +
        selectedAddOnPricing.addOnsVat;
    const snapshotGrandTotal =
        Number(existingBooking?.grand_total ?? 0) > 0
            ? Number(existingBooking.grand_total)
            : computedGrandTotal;
    const shouldUseSnapshotTotals = isResuming && isReadOnlyBookingMode;
    const displayGrandTotal = shouldUseSnapshotTotals
        ? snapshotGrandTotal
        : computedGrandTotal;
    const snapshotRemainingBalance =
        paidAmountValue > 0 || remainingBalanceValue > 0
            ? remainingBalanceValue
            : Math.max(0, snapshotGrandTotal - paidAmountValue);
    const displayRemainingBalance = shouldUseSnapshotTotals
        ? snapshotRemainingBalance
        : Math.max(0, displayGrandTotal - paidAmountValue);
    const bookingInvoiceNumber =
        existingBooking?.invoice_number ??
        (isReadOnlyBookingMode && existingBooking?.booking_number
            ? existingBooking.booking_number
            : null);
    const proformaInvoicePreviewUrl =
        existingBooking?.id && isDashboardBooking
            ? `${bookingActionBaseUrl}/${existingBooking.id}/invoice-preview`
            : null;
    const proformaInvoiceUrl = existingBooking?.id
        ? isDashboardBooking
            ? `${bookingActionBaseUrl}/${existingBooking.id}/invoice?proforma=1`
            : `/mybookings/${existingBooking.id}/invoice`
        : null;
    const selectedSchedule = useMemo(() => {
        const schedules = Array.isArray(tour?.schedules) ? tour.schedules : [];

        return (
            schedules.find((schedule: any) => {
                const departureDate = String(
                    schedule?.departure_date ?? '',
                ).slice(0, 10);

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
            const fallbackGrandTotal = nextGrandTotal ?? displayGrandTotal;
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
                    selectedSchedule?.return_date ??
                    selectedSchedule?.returnDate ??
                    null,
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
            displayGrandTotal,
            paidAmountValue,
            paxSummary,
            preselectedDate,
            selectedSchedule?.returnDate,
            selectedSchedule?.return_date,
            tour?.code,
            tour?.destination,
            tour?.image,
            tour?.name,
        ],
    );
    const inFlightOnlineConfirms = useRef(new Set<string>());

    const releaseExpiredCustomerHold = useCallback(() => {
        const redirectAfterRelease = () => {
            alert(
                'Your booking hold has expired. The reserved seats have been released. Please start a new booking or reorder from My Bookings.',
            );
            window.history.back();
        };

        setActiveOnlinePayment(null);

        if (!existingBooking?.id) {
            redirectAfterRelease();
            return;
        }

        router.post(
            bookingActionUrl(existingBooking.id, 'release-hold'),
            {},
            {
                preserveScroll: true,
                onFinish: redirectAfterRelease,
            },
        );
    }, [bookingActionUrl, existingBooking?.id]);

    // ─── Timer (starts when entering Step 2) ────────────────────────────
    const handleHoldExpired = useCallback(() => {
        if (holdExpiryHandledRef.current) {
            return;
        }

        holdExpiryHandledRef.current = true;
        setTimerStarted(false);
        setTimeLeft(0);

        if (isDashboardBooking) {
            setHoldExpiryDialogOpen(true);
            return;
        }

        releaseExpiredCustomerHold();
    }, [isDashboardBooking, releaseExpiredCustomerHold]);

    const syncHoldTimer = useCallback(() => {
        const nextSeconds = calculateRemainingHoldSeconds();

        setTimeLeft(nextSeconds);

        if (timerStarted && nextSeconds <= 0) {
            handleHoldExpired();
        }
    }, [calculateRemainingHoldSeconds, handleHoldExpired, timerStarted]);

    useEffect(() => {
        if (!timerStarted) {
            setTimeLeft(calculateRemainingHoldSeconds());
            return;
        }

        syncHoldTimer();

        const interval = window.setInterval(syncHoldTimer, 1000);

        return () => window.clearInterval(interval);
    }, [calculateRemainingHoldSeconds, syncHoldTimer, timerStarted]);

    useEffect(() => {
        const handleFocus = () => syncHoldTimer();
        const handleOnline = () => syncHoldTimer();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                syncHoldTimer();
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('online', handleOnline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('online', handleOnline);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [syncHoldTimer]);

    const resolveHoldExpiry = useCallback(
        (resolution: 'awaiting_payment' | 'payment_in_progress') => {
            if (!existingBooking?.id) {
                return;
            }

            setIsResolvingHoldExpiry(true);

            router.post(
                bookingActionUrl(existingBooking.id, 'resolve-hold-expiry'),
                { resolution },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setHoldExpiryDialogOpen(false);
                        router.visit(dashboardReturnUrl);
                    },
                    onError: () => {
                        setHoldExpiryDialogOpen(false);
                        toast.info(
                            'Booking hold state has changed. Refreshing booking data.',
                        );
                        router.reload({ preserveScroll: true });
                    },
                    onFinish: () => setIsResolvingHoldExpiry(false),
                },
            );
        },
        [bookingActionUrl, dashboardReturnUrl, existingBooking?.id],
    );

    const navigateToExitTarget = useCallback(
        (target: { href?: string; historyBack?: boolean }) => {
            if (target.href) {
                router.visit(target.href);
                return;
            }

            window.history.back();
        },
        [],
    );

    const requestIntentionalExit = useCallback(
        (
            target: { href?: string; historyBack?: boolean },
            options: { releaseHold?: boolean } = {},
        ) => {
            const shouldReleaseHold =
                options.releaseHold === true &&
                Boolean(existingBooking?.id) &&
                timerStarted &&
                !paymentResult &&
                !isPaidBookingMode &&
                !isReviewMode;

            if (shouldReleaseHold) {
                setPendingExitTarget(target);
                return;
            }

            navigateToExitTarget(target);
        },
        [
            existingBooking?.id,
            isPaidBookingMode,
            isReviewMode,
            navigateToExitTarget,
            paymentResult,
            timerStarted,
        ],
    );

    const confirmIntentionalExit = useCallback(() => {
        if (!pendingExitTarget || !existingBooking?.id) {
            return;
        }

        setIsReleasingHold(true);

        router.post(
            bookingActionUrl(existingBooking.id, 'release-hold'),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsReleasingHold(false);
                    setTimerStarted(false);
                    const target = pendingExitTarget;
                    setPendingExitTarget(null);
                    navigateToExitTarget(target);
                },
            },
        );
    }, [
        bookingActionUrl,
        existingBooking?.id,
        navigateToExitTarget,
        pendingExitTarget,
    ]);

    const buildReservePayload = useCallback(() => {
        const reserveAddOnRows = selectedAddOnsForPricing
            .filter((a) => a.qty > 0)
            .map((a) => ({
                name: a.label,
                price: a.unitPrice * a.qty,
                qty: a.qty,
                is_taxable: a.isTaxable ?? false,
            }));
        const reserveAddOnPricing = calculateAddOnPricing(
            selectedAddOnsForPricing.filter((a) => a.qty > 0),
            minimumVatPct ?? 0,
        );
        const reserveGrandTotal =
            pricing.totalPrice +
            reserveAddOnPricing.addOnsTotal +
            reserveAddOnPricing.addOnsVat;

        return {
            tour_id: tour.id,
            departure_date: preselectedDate,
            pax_adult: adults,
            pax_child: children,
            pax_infant: infants,
            booking_number: bookingNumber,
            vendor_id: vendor?.id ?? (tour.company as any)?.id,
            agent_id: selectedAgentId,
            contact_name: contact.name,
            contact_email: contact.email,
            contact_phone: contact.phone,
            contact_notes: contact.notes,
            total_price: pricing.subtotalGuests,
            tax_amount: pricing.ppn + reserveAddOnPricing.addOnsVat,
            platform_fee: pricing.platformFee,
            commission_amount: pricing.agentCommission,
            grand_total: reserveGrandTotal,
            addons: reserveAddOnRows,
            passengers: guests.map((g) => ({
                client_guest_id: g.id,
                title: g.title || null,
                first_name: g.firstName,
                last_name: g.lastName || '',
                gender: null,
                dob: g.dateOfBirth || null,
                pob: g.placeOfBirth || null,
                price_category: g.priceCategory,
                price_amount: g.price,
                visa_category_item_id: g.visaCategoryItemId,
                room_type: g.roomTypeDescription || null,
                room_number: null,
                note: g.note || null,
            })),
        } as Record<string, unknown>;
    }, [
        adults,
        bookingNumber,
        children,
        contact,
        guests,
        infants,
        minimumVatPct,
        preselectedDate,
        pricing,
        selectedAddOnsForPricing,
        selectedAgentId,
        tour,
        vendor,
    ]);

    const buildReserveFingerprint = useCallback(
        (payload: Record<string, unknown>) =>
            JSON.stringify({
                addons: payload.addons,
                grand_total: payload.grand_total,
                total_price: payload.total_price,
                tax_amount: payload.tax_amount,
                platform_fee: payload.platform_fee,
                commission_amount: payload.commission_amount,
                passengers: payload.passengers,
            }),
        [],
    );

    const lastSyncedReservePayloadRef = useRef<string | null>(null);
    const reserveSyncTimeoutRef = useRef<number | null>(null);

    const postReserveSnapshot = useCallback(
        (immediate = false): Promise<void> => {
            if (!timerStarted) {
                return Promise.resolve();
            }

            if (currentStep < 2 || currentStep > 4) {
                return Promise.resolve();
            }

            if (isReadOnlyBookingMode || isDocumentUpdateMode) {
                return Promise.resolve();
            }

            if (!isResuming && !bookingNumber) {
                return Promise.resolve();
            }

            const payload = buildReservePayload();
            const fingerprint = buildReserveFingerprint(payload);

            if (lastSyncedReservePayloadRef.current === fingerprint) {
                return Promise.resolve();
            }

            if (reserveSyncTimeoutRef.current !== null) {
                window.clearTimeout(reserveSyncTimeoutRef.current);
                reserveSyncTimeoutRef.current = null;
            }

            const submitSnapshot = () =>
                new Promise<void>((resolve) => {
                    lastSyncedReservePayloadRef.current = fingerprint;
                    router.post(reserveUrl, payload as any, {
                        preserveScroll: true,
                        preserveState: true,
                        only: [],
                        onFinish: () => resolve(),
                    });
                });

            if (immediate) {
                return submitSnapshot();
            }

            return new Promise((resolve) => {
                reserveSyncTimeoutRef.current = window.setTimeout(() => {
                    reserveSyncTimeoutRef.current = null;
                    void submitSnapshot().then(resolve);
                }, 400);
            });
        },
        [
            bookingNumber,
            buildReserveFingerprint,
            buildReservePayload,
            currentStep,
            isDocumentUpdateMode,
            isReadOnlyBookingMode,
            isResuming,
            reserveUrl,
            timerStarted,
        ],
    );

    // Persist add-on / passenger snapshot updates after step 1 -> 2 reserve.
    useEffect(() => {
        void postReserveSnapshot();
    }, [postReserveSnapshot]);

    useEffect(() => {
        if (
            currentStep !== 2 ||
            isReadOnlyBookingMode ||
            isPaidBookingMode ||
            isReviewMode
        ) {
            return;
        }

        if (isRoomArrangementComplete(rooms, guests)) {
            return;
        }

        const currentFingerprint = JSON.stringify(
            guests.map((g) => `${g.id}-${g.priceCategory}`),
        );

        setRooms(recommendRoomsForGuests(guests));
        roomsGuestFingerprint.current = currentFingerprint;
    }, [
        currentStep,
        guests,
        isPaidBookingMode,
        isReadOnlyBookingMode,
        isReviewMode,
        rooms,
    ]);

    // Sync immediately when the customer reaches the payment summary step.
    useEffect(() => {
        if (currentStep !== 4 || !timerStarted) {
            return;
        }

        void postReserveSnapshot(true);
    }, [currentStep, postReserveSnapshot, timerStarted]);

    // ─── Navigation ─────────────────────────────────────────────────────
    const goNext = () => {
        if ((isPaidBookingMode || isReviewMode) && currentStep < 4) {
            setDirection(1);
            setCurrentStep((s) => Math.min(4, s + 1) as WizardStepId);
            return;
        }

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

        if (isPaidBookingMode || isReviewMode) {
            setDirection(1);
            setCurrentStep(2);
            return;
        }

        const currentFingerprint = JSON.stringify(
            guests.map((g) => `${g.id}-${g.priceCategory}`),
        );
        if (
            !isRoomArrangementComplete(rooms, guests) ||
            roomsGuestFingerprint.current !== currentFingerprint
        ) {
            setRooms(recommendRoomsForGuests(guests));
            roomsGuestFingerprint.current = currentFingerprint;
        }

        const payload = buildReservePayload();
        lastSyncedReservePayloadRef.current = buildReserveFingerprint(payload);
        router.post(reserveUrl, payload as any, {
            preserveScroll: true,
            preserveState: true,
        });

        if (!timerStarted) {
            holdExpiryHandledRef.current = false;
            localHoldExpiresAtRef.current =
                Date.now() +
                clientServerOffsetMs +
                (bookingTimeLimitMinutes ?? 10) * 60 * 1000;
            setTimeLeft((bookingTimeLimitMinutes ?? 10) * 60);
            setTimerStarted(true);
        }

        setDirection(1);
        setCurrentStep(2);
    };

    const goBack = () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep((s) => Math.max(1, s - 1) as WizardStepId);
            return;
        }

        if (currentStep === 1 && hasAgreedToTnc) {
            if (isDocumentUpdateMode || isPaidBookingMode || isReviewMode) {
                router.visit(
                    `/mybookings?tab=${returnTab}&booking_number=${encodeURIComponent(
                        bookingNumber,
                    )}`,
                );
                return;
            }

            setHasAgreedToTnc(false);
            if (!timerStarted) {
                localHoldExpiresAtRef.current = null;
                setTimeLeft(fallbackHoldSeconds);
            }
            return;
        }

        if (currentStep === 1) {
            requestIntentionalExit({ historyBack: true });
            return;
        }
    };

    const releaseHoldDialog = (
        <AlertDialog
            open={pendingExitTarget !== null}
            onOpenChange={(open) => {
                if (!open && !isReleasingHold) {
                    setPendingExitTarget(null);
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Release reserved seats?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isDashboardBooking
                            ? 'Leaving this booking flow will release the reserved seats and stop the hold timer. You can reopen the booking from the dashboard if the departure is still available.'
                            : 'Leaving this booking will release your reserved seats and stop the hold timer. You can start again from My Bookings if the departure is still available.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isReleasingHold}>
                        Stay here
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            confirmIntentionalExit();
                        }}
                        disabled={isReleasingHold}
                    >
                        {isReleasingHold ? 'Releasing...' : 'Release and leave'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    const holdExpiryResolutionDialog = (
        <AlertDialog open={holdExpiryDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Booking hold timer has ended
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        The seat hold timer has expired. Is the customer
                        currently completing payment? Choose Payment in Progress
                        to move this booking to Waiting Payment Approval (WA).
                        You can submit the payment proof later from Bookings
                        &gt; Actions. Choose Release to Awaiting Payment if
                        payment is not in progress.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        disabled={isResolvingHoldExpiry}
                        onClick={(event) => {
                            event.preventDefault();
                            resolveHoldExpiry('awaiting_payment');
                        }}
                    >
                        Release to Awaiting Payment
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isResolvingHoldExpiry}
                        onClick={(event) => {
                            event.preventDefault();
                            resolveHoldExpiry('payment_in_progress');
                        }}
                    >
                        {isResolvingHoldExpiry
                            ? 'Resolving...'
                            : 'Payment in Progress'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    const handleGuestUpdate = useCallback((updated: GuestEntry) => {
        setGuests((prev) =>
            prev.map((g) => (g.id === updated.id ? updated : g)),
        );
    }, []);

    const handleAdultsChange = useCallback((nextAdults: number) => {
        if (nextAdults <= 0) {
            skipGuestSyncRef.current = true;
            setGuests((previousGuests) =>
                previousGuests.filter((guest) => guest.type !== 'adult'),
            );
            setAdults(0);
            setContactGuestId(null);
            return;
        }

        setAdults(nextAdults);
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

            const newAdults = newGuests.filter(
                (g) => g.type === 'adult',
            ).length;
            const newChildren = newGuests.filter(
                (g) => g.type === 'child',
            ).length;
            const newInfants = newGuests.filter(
                (g) => g.type === 'infant',
            ).length;

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
                const canAddNewAdult = adults + children < maxSeatTakingGuests;

                if (!contactNameParts || contactGuestId || !canAddNewAdult) {
                    return;
                }

                const { firstName, lastName } = contactNameParts;
                skipGuestSyncRef.current = true;
                setGuests((prev) => [
                    ...prev,
                    {
                        ...makeDefaultGuest(CONTACT_GUEST_ID, 'adult'),
                        firstName,
                        lastName,
                    },
                ]);
                setAdults((prev) => prev + 1);
                setContactGuestId(CONTACT_GUEST_ID);
                return;
            }

            if (contactGuestId) {
                skipGuestSyncRef.current = true;
                setGuests((previousGuests) =>
                    previousGuests.filter(
                        (guest) => guest.id !== contactGuestId,
                    ),
                );
                setAdults((prev) => Math.max(0, prev - 1));
                setContactGuestId(null);
            }
        },
        [
            adults,
            children,
            contact.name,
            contactGuestId,
            infants,
            maxSeatTakingGuests,
        ],
    );

    // ─── Validation ─────────────────────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d+$/;

    const paxTakingSeats = adults + children;
    const isAvailabilityExceeded =
        bookingSeatLimitValue !== null &&
        paxTakingSeats > bookingSeatLimitValue;

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
        (!isDashboardBooking ||
            customerBookingMode !== 'existing' ||
            selectedCustomerId !== null) &&
        guests.length > 0 &&
        !isAvailabilityExceeded &&
        dependentBedPassengerValidation.isValid &&
        hasRequiredAgentSelection &&
        guests.every((g) => {
            if (
                g.title.trim() === '' ||
                g.firstName.trim() === '' ||
                g.dateOfBirth.trim() === '' ||
                g.placeOfBirth.trim() === '' ||
                g.priceCategory === null ||
                (visaTypeOptions.length > 0 && g.visaCategoryItemId === null)
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
        const roomArrangementValidation = validateRoomArrangement(
            rooms,
            guests,
        );

        return (
            roomArrangementValidation.isValid &&
            guests.every((g) => assignedGuestIds.includes(g.id))
        );
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
            setActiveOnlinePayment(null);
            stopHoldTimer();
            if (isDashboardBooking) {
                router.visit(dashboardReturnUrl);
                return;
            }

            setPaymentResult(nextResult);
        },
        [dashboardReturnUrl, isDashboardBooking, stopHoldTimer],
    );

    const handleConfirmedOnlinePaymentResult = useCallback(
        (nextResult?: BookingPaymentResultData) => {
            setActiveOnlinePayment(null);
            setIsSubmitting(false);
            stopHoldTimer();

            if (isDashboardBooking) {
                router.visit(dashboardReturnUrl);

                return;
            }

            if (nextResult) {
                setPaymentResult(nextResult);
            }
        },
        [dashboardReturnUrl, isDashboardBooking, stopHoldTimer],
    );

    const handleOnlinePaymentPaid = useCallback(
        (result?: PaymentStatusSyncResult) => {
            const nextResult =
                (result?.bookingPaymentResult as
                    | BookingPaymentResultData
                    | undefined) ?? activeOnlinePayment?.pendingResult;

            handleConfirmedOnlinePaymentResult(nextResult);
        },
        [
            activeOnlinePayment?.pendingResult,
            handleConfirmedOnlinePaymentResult,
        ],
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
                    `${bookingActionUrl(bookingId, 'online-payment')}/${paymentId}/confirm`,
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
                            if (isConfirmedPaymentResult(nextResult)) {
                                handleConfirmedOnlinePaymentResult(nextResult);
                            } else {
                                showPaymentResult(nextResult);
                            }
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
        [
            bookingActionUrl,
            handleConfirmedOnlinePaymentResult,
            showPaymentResult,
        ],
    );

    const showOnlinePaymentInstructions = useCallback(
        (
            bookingId: number | string,
            paymentId: number | string | undefined,
            payment: {
                provider: string;
                amount: number;
                payload: Record<string, unknown>;
            },
            pendingResult: BookingPaymentResultData | undefined,
        ) => {
            setActiveOnlinePayment({
                bookingId,
                paymentId,
                provider: payment.provider,
                amount: payment.amount,
                payload: payment.payload,
                pendingResult,
            });
            setPaymentErrorMessage(null);
            setIsSubmitting(false);
        },
        [],
    );

    const startOnlinePayment = (
        bookingId: number | string,
        paymentType: PaymentType,
        finalAmount: number,
        paymentMethodId: number,
    ) => {
        axios
            .post(
                bookingActionUrl(bookingId, 'online-payment'),
                {
                    payment_type: paymentType,
                    amount: finalAmount,
                    payment_method_id: paymentMethodId,
                },
                {
                    withCredentials: true,
                    withXSRFToken: true,
                },
            )
            .then((response) => {
                const payment = response.data?.payment as
                    | {
                          id?: number | string;
                          provider?: string | null;
                          amount?: number | string | null;
                          status?: string | null;
                          payload?: Record<string, unknown>;
                      }
                    | undefined;
                const paymentPayload = response.data?.payment?.payload as
                    | Record<string, unknown>
                    | undefined;
                const paymentId = payment?.id;
                const provider = payment?.provider ?? 'midtrans';
                const paymentAmount = Number(payment?.amount ?? finalAmount);
                const pendingResult = response.data?.bookingPaymentResult as
                    | BookingPaymentResultData
                    | undefined;

                if (
                    !paymentPayload ||
                    (!hasOnlinePaymentInstructions(provider, paymentPayload) &&
                        Object.keys(paymentPayload).length === 0)
                ) {
                    setActiveOnlinePayment(null);
                    setPaymentErrorMessage(
                        'Online payment could not be started. Please try again.',
                    );
                    setIsSubmitting(false);
                    return;
                }

                showOnlinePaymentInstructions(
                    bookingId,
                    paymentId,
                    {
                        provider,
                        amount: Number.isFinite(paymentAmount)
                            ? paymentAmount
                            : finalAmount,
                        payload: paymentPayload,
                    },
                    pendingResult,
                );
            })
            .catch((error) => {
                const message = paymentErrorMessageFromResponse(error);

                if (message) {
                    setPaymentErrorMessage(message);
                }

                setIsSubmitting(false);
            });
    };

    const proceedWithMidtransPayment = (
        paymentMethodId: number,
        pending: PendingMidtransPayment,
    ) => {
        const { paymentType, finalAmount, addOns } = pending;

        const submitMidtransPayment = () => {
            if (isBalancePayment && existingBooking?.id) {
                let startedPayment = false;

                router.put(
                    `/bookings/${existingBooking.id}`,
                    buildBookingPayload(addOns, paymentType, 'midtrans', false),
                    {
                        forceFormData: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            startedPayment = true;
                            startOnlinePayment(
                                existingBooking.id,
                                paymentType,
                                finalAmount,
                                paymentMethodId,
                            );
                        },
                        onError: (errors) => {
                            const message =
                                firstErrorMessage(errors.payment) ??
                                firstErrorMessage(errors.payment_date) ??
                                firstErrorMessage(errors.payment_type);

                            if (message) {
                                setPaymentErrorMessage(message);
                            }
                        },
                        onFinish: () => {
                            if (!startedPayment) {
                                setIsSubmitting(false);
                            }
                        },
                    },
                );

                return;
            }

            const payload = buildBookingPayload(
                addOns,
                paymentType,
                'midtrans',
                true,
            );

            router.post(storeUrl, payload as any, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    const bookingId =
                        bookingIdFromPageProps(page.props) ??
                        existingBooking?.id;

                    if (!bookingId) {
                        setIsSubmitting(false);
                        return;
                    }

                    startOnlinePayment(
                        bookingId,
                        paymentType,
                        finalAmount,
                        paymentMethodId,
                    );
                },
                onError: (errors) => {
                    const message =
                        firstErrorMessage(errors.payment) ??
                        firstErrorMessage(errors.payment_date) ??
                        firstErrorMessage(errors.payment_type);

                    if (message) {
                        setPaymentErrorMessage(message);
                    }

                    setIsSubmitting(false);
                },
            });
        };

        void postReserveSnapshot(true).finally(() => {
            submitMidtransPayment();
        });
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

        router.post(bookingActionUrl(bookingId, 'manual-payment'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const nextResult = (page.props as any)?.flash
                    ?.bookingPaymentResult as
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
            onError: (errors) => {
                const message =
                    firstErrorMessage(errors.payment) ??
                    firstErrorMessage(errors.payment_date) ??
                    firstErrorMessage(errors.payment_type);

                if (message) {
                    setPaymentErrorMessage(message);
                }

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
        void axios
            .get<{ bookingPaymentResult?: BookingPaymentResultData }>(
                bookingActionUrl(paymentResult.bookingId, 'payment-result'),
            )
            .then((response) => {
                if (response.data.bookingPaymentResult) {
                    setPaymentResult(response.data.bookingPaymentResult);
                }
            })
            .finally(() => setIsRefreshingPaymentResult(false));
    }, [bookingActionUrl, paymentResult]);

    const submitTravelDocumentsOnly = useCallback(() => {
        if (!existingBooking?.id) {
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        let rowIndex = 0;

        guests.forEach((guest) => {
            if (!guest.bookingPassengerId) {
                return;
            }

            const doc =
                travelDocuments.find(
                    (document) => document.guestId === guest.id,
                ) ?? makeDefaultTravelDocument(guest.id);

            formData.append(
                `passengers[${rowIndex}][id]`,
                String(guest.bookingPassengerId),
            );
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
            bookingActionUrl(existingBooking.id, 'travel-documents'),
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(
                        isDashboardBooking
                            ? dashboardReturnUrl
                            : `/mybookings?tab=current&booking_number=${encodeURIComponent(
                                  bookingNumber,
                              )}`,
                    );
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    }, [
        bookingActionUrl,
        bookingNumber,
        dashboardReturnUrl,
        existingBooking?.id,
        guests,
        isDashboardBooking,
        travelDocuments,
    ]);

    const buildBookingPayload = (
        addOnsForPayload: AddOnItem[],
        paymentType: PaymentType,
        paymentMethod: PaymentMethod,
        includePaymentFields: boolean,
    ) => {
        const addOnRows = addOnsForPayload
            .filter((a) => a.qty > 0)
            .map((a) => ({
                name: a.label,
                price: a.unitPrice * a.qty,
                qty: a.qty,
                is_taxable: a.isTaxable ?? false,
            }));
        const addOnPricing = calculateAddOnPricing(
            addOnsForPayload.filter((a) => a.qty > 0),
            minimumVatPct ?? 0,
        );
        const totalTaxAmount = pricing.ppn + addOnPricing.addOnsVat;
        const grandTotal =
            pricing.totalPrice +
            addOnPricing.addOnsTotal +
            addOnPricing.addOnsVat;
        const roomNumberByGuestId = getRoomNumberByGuestId(rooms);
        const payload: Record<string, unknown> = {
            tour_id: tour.id,
            departure_date: preselectedDate,
            pax_adult: adults,
            pax_child: children,
            pax_infant: infants,
            vendor_id: vendor?.id ?? (tour.company as any)?.id,
            agent_id: selectedAgentId,
            agent_code:
                selectedDashboardAgent?.username ??
                (tenant as any)?.username ??
                'AGT',
            booking_number: bookingNumber,
            contact_name: contact.name,
            contact_email: contact.email,
            contact_phone: contact.phone,
            contact_notes: contact.notes,
            passengers: guests.map((g) => {
                const doc = travelDocuments.find((d) => d.guestId === g.id);
                return {
                    id: g.bookingPassengerId,
                    client_guest_id: g.id,
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
                    visa_file_path: doc?.visaFile
                        ? null
                        : (doc?.visaFilePath ?? null),
                    visa_category_item_id: g.visaCategoryItemId,
                    room_type: g.roomTypeDescription || null,
                    room_number: roomNumberByGuestId.get(g.id) ?? null,
                    note: g.note || null,
                };
            }),
            addons: addOnRows,
            total_price: pricing.subtotalGuests,
            tax_amount: totalTaxAmount,
            platform_fee: pricing.platformFee,
            commission_amount: pricing.agentCommission,
            grand_total: grandTotal,
        };

        if (includePaymentFields) {
            payload.payment_type = paymentType;
            payload.payment_method = paymentMethod;
        }

        if (rooms.length > 0) {
            payload.rooms = serializeRoomsForBooking(rooms);
        }

        return payload;
    };

    const handlePayNow = (
        paymentType: PaymentType,
        paymentMethod: PaymentMethod,
        addOns: AddOnItem[],
        finalAmount: number,
        manualData?: ManualPaymentData,
    ) => {
        setPaymentErrorMessage(null);

        if (paymentMethod === 'midtrans') {
            setIsSubmitting(false);
            setPendingMidtransPayment({
                paymentType,
                finalAmount,
                addOns,
                manualData,
            });
            setPaymentMethodDialogOpen(true);
            return;
        }

        setIsSubmitting(true);

        if (!fullPaymentAvailable && paymentType === 'full_payment') {
            setPaymentErrorMessage(
                paymentUnavailableReason ?? DEFAULT_PAYMENT_UNAVAILABLE_MESSAGE,
            );
            setIsSubmitting(false);
            return;
        }

        if (!downPaymentAvailable && paymentType === 'down_payment') {
            setPaymentErrorMessage(
                'Down payment is unavailable for this tour. Please complete full payment.',
            );
            setIsSubmitting(false);
            return;
        }

        const submitPayment = () => {
            if (isBalancePayment && existingBooking?.id) {
                let startedPayment = false;

                router.put(
                    `/bookings/${existingBooking.id}`,
                    buildBookingPayload(
                        addOns,
                        paymentType,
                        paymentMethod,
                        false,
                    ),
                    {
                        forceFormData: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            startedPayment = true;

                            submitManualPayment(
                                existingBooking.id,
                                paymentType,
                                finalAmount,
                                manualData,
                            );
                        },
                        onError: (errors) => {
                            const message =
                                firstErrorMessage(errors.payment) ??
                                firstErrorMessage(errors.payment_date) ??
                                firstErrorMessage(errors.payment_type);

                            if (message) {
                                setPaymentErrorMessage(message);
                            }
                        },
                        onFinish: () => {
                            if (!startedPayment) {
                                setIsSubmitting(false);
                            }
                        },
                    },
                );
                return;
            }

            const payload = buildBookingPayload(
                addOns,
                paymentType,
                paymentMethod,
                true,
            );

            router.post(storeUrl, payload as any, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    if (!manualData || paymentMethod !== 'manual_transfer') {
                        return;
                    }

                    const bookingId =
                        bookingIdFromPageProps(page.props) ??
                        existingBooking?.id;
                    if (!bookingId || !manualData.proofFile) {
                        setIsSubmitting(false);
                        return;
                    }

                    submitManualPayment(
                        bookingId,
                        paymentType,
                        finalAmount,
                        manualData,
                    );
                },
                onError: (errors) => {
                    const message =
                        firstErrorMessage(errors.payment) ??
                        firstErrorMessage(errors.payment_date) ??
                        firstErrorMessage(errors.payment_type);

                    if (message) {
                        setPaymentErrorMessage(message);
                    }

                    setIsSubmitting(false);
                },
                onFinish: () => {
                    if (!manualData) {
                        setIsSubmitting(false);
                    }
                },
            });
        };

        void postReserveSnapshot(true).finally(() => {
            submitPayment();
        });
    };

    // ─── Helper ─────────────────────────────────────────────────────────
    // ─── Render ─────────────────────────────────────────────────────────
    if (paymentResult) {
        return renderBookingLayout(
            <>
                <BookingPaymentResult
                    result={paymentResult}
                    onRefresh={refreshPaymentStatus}
                    isRefreshing={isRefreshingPaymentResult}
                />
            </>,
        );
    }

    if (hasBookingConflict) {
        return renderBookingLayout(
            <>
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
                                onClick={() =>
                                    router.visit(bookingConflict.newBookingUrl)
                                }
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
            </>,
        );
    }

    if (!hasAgreedToTnc) {
        return renderBookingLayout(
            <>
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
                                <h2 className="text-xl font-bold">
                                    Terms & Conditions
                                </h2>
                            </div>
                            <div
                                className="mt-6 max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_strike]:text-muted-foreground"
                                dangerouslySetInnerHTML={{
                                    __html: renderTermsHtml(
                                        termConditions || '',
                                    ),
                                }}
                            />
                            <p className="mt-6 rounded-lg bg-muted/50 p-4 text-sm font-medium leading-relaxed text-foreground">
                                By clicking &quot;I Agree &amp; Continue&quot;,
                                you agree to the Terms &amp; Conditions. A{' '}
                                {bookingTimeLimitMinutes}-minute timer will
                                start on the room arrangement step to complete
                                your booking.
                            </p>
                            <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        requestIntentionalExit(
                                            isDashboardBooking
                                                ? { href: dashboardReturnUrl }
                                                : resumedBookingReturnUrl
                                                  ? {
                                                        href: resumedBookingReturnUrl,
                                                    }
                                                  : { historyBack: true },
                                            { releaseHold: true },
                                        )
                                    }
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
                {releaseHoldDialog}
                {holdExpiryResolutionDialog}
            </>,
            (href) => requestIntentionalExit({ href }, { releaseHold: true }),
        );
    }

    return renderBookingLayout(
        <>
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
                            <div className="pt-2">
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
                            </div>

                            {/* Step Indicator */}
                            <div
                                className={
                                    isDashboardBooking
                                        ? 'sticky top-0 z-20 mb-5 rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur'
                                        : 'sticky top-[4.25rem] z-20 -mx-4 mb-5 border-b bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:top-[4.5rem] sm:-mx-0 sm:rounded-xl sm:border'
                                }
                            >
                                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <WizardStepIndicator
                                            currentStep={currentStep}
                                        />
                                    </div>
                                    {showBookingTimer && (
                                        <BookingHoldTimer
                                            timeLeftSeconds={timeLeft}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="pb-4">
                                {/* Booking Info Card */}
                                <BookingInfoCard
                                    tour={tour}
                                    status={bookingInfoStatus}
                                    bookingNumber={bookingNumber ?? null}
                                    invoiceNumber={bookingInvoiceNumber}
                                    departureDate={preselectedDate}
                                    vendor={vendor}
                                    contactName={contact.name}
                                    contactEmail={contact.email}
                                    contactPhone={contact.phone}
                                    pricing={pricing}
                                    totalPaid={paidAmountValue}
                                    remainingBalance={displayRemainingBalance}
                                    displayTotalPrice={displayGrandTotal}
                                    agentCommissionAmount={
                                        pricing.agentCommission
                                    }
                                    showAgentCommission={
                                        isDashboardBooking &&
                                        (Boolean(tenant) ||
                                            Boolean(selectedDashboardAgent))
                                    }
                                    agentName={
                                        requiresAgentSelection
                                            ? (selectedDashboardAgent?.name ??
                                              '-')
                                            : tenant?.name || '-'
                                    }
                                    agentOptions={dashboardAgentOptions}
                                    selectedAgentId={selectedAgentId}
                                    onAgentChange={handleDashboardAgentChange}
                                    requiresAgentSelection={
                                        isDashboardBooking &&
                                        requiresAgentSelection &&
                                        !isReadOnlyBookingMode &&
                                        currentStep === 1
                                    }
                                    agentSelectionError={agentSelectionError}
                                    agentSelectionDisabled={
                                        dashboardAgentOptions.length === 0
                                    }
                                    inputBy={
                                        inputBy
                                            ? {
                                                  userName: inputBy.user_name,
                                                  roleLabel: inputBy.role_label,
                                                  companyName:
                                                      inputBy.company_name,
                                                  createdAt: inputBy.created_at,
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
                                                onAdultsChange={
                                                    handleAdultsChange
                                                }
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
                                                visaCategoryItems={
                                                    visaTypeOptions
                                                }
                                                maxGuests={maxSeatTakingGuests}
                                                departureDate={preselectedDate}
                                                contactGuestId={contactGuestId}
                                                onContactGuestToggle={
                                                    handleContactGuestToggle
                                                }
                                                contactAsGuestAdded={
                                                    contactGuestId !== null
                                                }
                                                savedPassengers={
                                                    savedPassengerOptions
                                                }
                                                onSavedPassengerSelect={
                                                    handleSavedPassengerSelect
                                                }
                                                customerOptions={
                                                    isDashboardBooking
                                                        ? filteredDashboardCustomerOptions
                                                        : undefined
                                                }
                                                customerBookingMode={
                                                    isDashboardBooking
                                                        ? customerBookingMode
                                                        : undefined
                                                }
                                                onCustomerBookingModeChange={
                                                    isDashboardBooking
                                                        ? setCustomerBookingMode
                                                        : undefined
                                                }
                                                selectedCustomerId={
                                                    selectedCustomerId
                                                }
                                                onCustomerSelect={
                                                    isDashboardBooking
                                                        ? handleDashboardCustomerSelect
                                                        : undefined
                                                }
                                                customerOptionsEmptyMessage={
                                                    isDashboardBooking &&
                                                    requiresAgentSelection &&
                                                    selectedAgentId === null
                                                        ? 'Select an agent first to view customers.'
                                                        : 'No customer accounts available for this agent.'
                                                }
                                                readOnly={isReadOnlyBookingMode}
                                            />
                                        )}
                                        {currentStep === 2 && (
                                            <Step2RoomConfiguration
                                                guests={guests}
                                                rooms={rooms}
                                                onRoomsChange={setRooms}
                                                readOnly={isReadOnlyBookingMode}
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
                                                departureDate={preselectedDate}
                                                readOnly={
                                                    isTravelDocumentsReadOnly
                                                }
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
                                                    requiresAgentSelection
                                                        ? (selectedDashboardAgent?.name ??
                                                          '-')
                                                        : tenant?.name || '-'
                                                }
                                                onPayNow={handlePayNow}
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
                                                paidAmount={paidAmountValue}
                                                remainingBalance={
                                                    displayRemainingBalance
                                                }
                                                downPaymentPaidAt={
                                                    downPaymentPaidAt
                                                }
                                                grandTotalOverride={
                                                    shouldUseSnapshotTotals
                                                        ? snapshotGrandTotal
                                                        : null
                                                }
                                                forceBalancePayment={
                                                    isBalancePayment
                                                }
                                                vendorBankInfo={vendorBankInfo}
                                                readOnly={isReviewMode}
                                                preservePaymentPanelColumns={
                                                    isReviewMode
                                                }
                                                addOnsReadOnly={
                                                    shouldUseSnapshotTotals
                                                }
                                                downPaymentAvailable={
                                                    downPaymentAvailable
                                                }
                                                fullPaymentAvailable={
                                                    fullPaymentAvailable
                                                }
                                                manualPaymentAvailable={
                                                    paymentMethodAvailability?.manual ??
                                                    true
                                                }
                                                onlinePaymentAvailable={
                                                    paymentMethodAvailability?.online ??
                                                    true
                                                }
                                                paymentUnavailableReason={
                                                    paymentUnavailableReason
                                                }
                                                paymentErrorMessage={
                                                    paymentErrorMessage
                                                }
                                                showProformaInvoiceButton={
                                                    showProformaInvoiceButton
                                                }
                                                proformaInvoicePreview={
                                                    proformaInvoicePreviewUrl
                                                        ? {
                                                              submitUrl:
                                                                  proformaInvoicePreviewUrl,
                                                              invoiceType:
                                                                  customerFacingInvoiceType,
                                                              statusLabel:
                                                                  'Unpaid',
                                                          }
                                                        : null
                                                }
                                                proformaInvoiceUrl={
                                                    proformaInvoiceUrl
                                                }
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            {currentStep < 4 && (
                                <div className="flex flex-col gap-3 pb-28 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pb-12">
                                    {currentStep > 1 ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={goBack}
                                            className="w-full gap-2 sm:w-auto"
                                        >
                                            <ArrowLeftIcon className="size-4" />{' '}
                                            Back
                                        </Button>
                                    ) : currentStep === 1 &&
                                      !isReadOnlyBookingMode ? (
                                        <RequiredFieldsHint />
                                    ) : (
                                        <div className="hidden sm:block" />
                                    )}
                                    <div className="flex min-w-0 flex-col gap-2 sm:items-end">
                                        {currentStep === 1 &&
                                            !isReadOnlyBookingMode &&
                                            isAvailabilityExceeded && (
                                                <span className="text-sm font-semibold text-destructive">
                                                    Not enough availability.
                                                    This booking can include up
                                                    to {maxSeatTakingGuests}{' '}
                                                    guests for this schedule.
                                                </span>
                                            )}
                                        {currentStep === 1 &&
                                            !isReadOnlyBookingMode &&
                                            !dependentBedPassengerValidation.isValid && (
                                                <span className="text-sm font-semibold text-destructive">
                                                    {dependentBedPassengerValidation
                                                        .issues[0]?.message ??
                                                        'Adult Extra Bed and Child With Bed guests must share an Adult Twin or Adult Double room.'}
                                                </span>
                                            )}
                                        {currentStep === 1 &&
                                            !isReadOnlyBookingMode &&
                                            agentSelectionError && (
                                                <span className="text-sm font-semibold text-destructive">
                                                    {agentSelectionError}
                                                </span>
                                            )}
                                        <Button
                                            type="button"
                                            disabled={
                                                (currentStep === 3 &&
                                                    isDocumentUpdateMode &&
                                                    isSubmitting) ||
                                                (!isReadOnlyBookingMode &&
                                                    currentStep === 1 &&
                                                    !canProceedStep1) ||
                                                (!isReadOnlyBookingMode &&
                                                    currentStep === 2 &&
                                                    !canProceedStep2)
                                            }
                                            onClick={
                                                currentStep === 3 &&
                                                isDocumentUpdateMode
                                                    ? submitTravelDocumentsOnly
                                                    : goNext
                                            }
                                            className="w-full gap-2 sm:w-auto"
                                        >
                                            {currentStep === 3 &&
                                            isDocumentUpdateMode
                                                ? isSubmitting
                                                    ? 'Saving...'
                                                    : 'Save Documents'
                                                : 'Next'}
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
                                        <ArrowLeftIcon className="size-4" />{' '}
                                        Back
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
                            <AlertDialogTitle>
                                Before you continue
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                On the next screen, please complete your
                                transaction within {bookingTimeLimitMinutes}
                                -minutes to avoid cancellation.
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

                <PaymentMethodDialog
                    open={paymentMethodDialogOpen}
                    onOpenChange={(open) => {
                        setPaymentMethodDialogOpen(open);

                        if (!open) {
                            setPendingMidtransPayment(null);
                            setIsSubmitting(false);
                        }
                    }}
                    description={
                        pendingMidtransPayment
                            ? `Select how you want to pay Rp ${pendingMidtransPayment.finalAmount.toLocaleString('id-ID')}`
                            : undefined
                    }
                    loading={isSubmitting}
                    onConfirm={(methodId) => {
                        if (!pendingMidtransPayment) {
                            return;
                        }

                        setIsSubmitting(true);
                        setPaymentMethodDialogOpen(false);
                        proceedWithMidtransPayment(
                            methodId,
                            pendingMidtransPayment,
                        );
                        setPendingMidtransPayment(null);
                    }}
                />

                <OnlinePaymentDialog
                    open={activeOnlinePayment !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setActiveOnlinePayment(null);
                        }
                    }}
                    paymentId={activeOnlinePayment?.paymentId}
                    status="pending"
                    statusCheck={
                        activeOnlinePayment?.paymentId
                            ? {
                                  url: `${bookingActionUrl(activeOnlinePayment.bookingId, 'online-payment')}/${activeOnlinePayment.paymentId}/confirm`,
                                  method: 'POST',
                              }
                            : undefined
                    }
                    provider={activeOnlinePayment?.provider}
                    amount={activeOnlinePayment?.amount}
                    payload={activeOnlinePayment?.payload}
                    continueLabel="I've paid"
                    description="Complete the transfer below while your booking timer is still active, then confirm once finished."
                    reloadOnPaid={false}
                    onPaid={handleOnlinePaymentPaid}
                    onDone={() => {
                        handleOnlinePaymentPaid();
                    }}
                    onContinue={
                        activeOnlinePayment
                            ? () => {
                                  confirmOnlinePaymentAndShowResult(
                                      activeOnlinePayment.bookingId,
                                      activeOnlinePayment.paymentId,
                                      activeOnlinePayment.pendingResult,
                                      { showPendingResult: true },
                                  );
                                  setActiveOnlinePayment(null);
                              }
                            : undefined
                    }
                />

                {releaseHoldDialog}
                {holdExpiryResolutionDialog}
            </div>
        </>,
        (href) => requestIntentionalExit({ href }, { releaseHold: true }),
    );
}
