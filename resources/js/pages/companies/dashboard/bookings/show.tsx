import type { TourResource } from '@/api/model';
import BookingInfoCard from '@/components/booking/BookingInfoCard';
import Step1GuestInformation from '@/components/booking/Step1GuestInformation';
import Step2RoomConfiguration, {
    deserializeRoomsFromBooking,
} from '@/components/booking/Step2RoomConfiguration';
import Step3TravelDocuments from '@/components/booking/Step3TravelDocuments';
import Step4BookingSummary, {
    type AddOnItem,
    type DownPaymentRule,
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
    VisaCategoryItemOption,
} from '@/types/booking';
import {
    calculateAddOnPricing,
    calculateBookingPricing,
} from '@/utils/booking-calculations';
import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, InfoIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

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
    visa_category_item_id: number | null;
    visa_type_description: string | null;
    visa_type_price: number | string | null;
    visa_type_is_taxable: boolean | number | null;
    room_type: string | null;
    note: string | null;
};

type BookingData = {
    id: number;
    booking_number: string;
    invoice_number?: string | null;
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
    visaCategoryItems?: VisaCategoryItemOption[];
    minimumDownPaymentPct: number | null;
    downPaymentRule?: DownPaymentRule;
    minimumVatPct: number;
    platformFeePerPax?: number;
    paidAmount?: number;
    remainingBalance?: number;
    downPaymentPaidAt?: string | null;
};

// ---------------------------------------------------------------------------
// Helpers — convert DB passengers → wizard GuestEntry[]
// ---------------------------------------------------------------------------

function passengersToGuests(passengers: Passenger[]): GuestEntry[] {
    const counters = { adult: 0, child: 0, infant: 0 };

    return passengers.map((p) => {
        let type: 'adult' | 'child' | 'infant' = 'adult';
        const cat = p.price_category?.toLowerCase() ?? '';
        if (cat.includes('infant')) type = 'infant';
        else if (cat.includes('child')) type = 'child';

        const idx = counters[type]++;

        return {
            id: `${type}-${idx}`,
            type,
            title: p.title ?? '',
            firstName: p.first_name ?? '',
            lastName: p.last_name ?? '',
            dateOfBirth: p.dob ? p.dob.split('T')[0] : '',
            placeOfBirth: p.pob ?? '',
            priceCategory: p.price_category ?? null,
            tourPriceId: 0,
            price: p.price_amount ?? 0,
            originalPrice: p.price_amount ?? 0,
            roomTypeDescription: p.room_type ?? '',
            visaCategoryItemId: p.visa_category_item_id
                ? Number(p.visa_category_item_id)
                : null,
            visaTypeDescription: p.visa_type_description ?? null,
            visaTypePrice: Number(p.visa_type_price ?? 0),
            visaTypeIsTaxable: Boolean(p.visa_type_is_taxable),
            note: p.note ?? '',
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
    visaCategoryItems = [],
    minimumDownPaymentPct,
    downPaymentRule = null,
    minimumVatPct,
    platformFeePerPax = 25_000,
    paidAmount = 0,
    remainingBalance = 0,
    downPaymentPaidAt = null,
}: PageProps) {
    const { company } = usePageSharedDataProps();
    const isAgent = company.type === 'agent';
    const proformaInvoiceUrl =
        booking.status === 'down payment'
            ? `/companies/${company.username}/dashboard/bookings/${booking.id}/invoice`
            : null;

    return (
        <ReadOnlyWizard
            booking={booking}
            tourPrices={tourPrices}
            addOns={addOns}
            visaCategoryItems={visaCategoryItems}
            minimumDownPaymentPct={minimumDownPaymentPct}
            downPaymentRule={downPaymentRule}
            minimumVatPct={minimumVatPct}
            platformFeePerPax={platformFeePerPax}
            paidAmount={paidAmount}
            remainingBalance={remainingBalance}
            downPaymentPaidAt={downPaymentPaidAt}
            company={company}
            isAgent={isAgent}
            proformaInvoiceUrl={proformaInvoiceUrl}
        />
    );
}

// ---------------------------------------------------------------------------
// Read-Only Wizard
// ---------------------------------------------------------------------------

function ReadOnlyWizard({
    booking,
    tourPrices,
    addOns: initialAddOns,
    visaCategoryItems,
    minimumDownPaymentPct,
    downPaymentRule,
    minimumVatPct,
    platformFeePerPax,
    paidAmount,
    remainingBalance,
    downPaymentPaidAt,
    company,
    isAgent,
    proformaInvoiceUrl,
}: {
    booking: BookingData;
    tourPrices: TourPrice[];
    addOns: AddOnItem[];
    visaCategoryItems: VisaCategoryItemOption[];
    minimumDownPaymentPct: number | null;
    downPaymentRule: DownPaymentRule;
    minimumVatPct: number;
    platformFeePerPax: number;
    paidAmount: number;
    remainingBalance: number;
    downPaymentPaidAt: string | null;
    company: any;
    isAgent: boolean;
    proformaInvoiceUrl: string | null;
}) {
    const intl = useIntl();
    const departureDate = booking.departure_date?.split('T')[0] ?? '';

    // ── Wizard step state ──────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
    const [direction, setDirection] = useState(1);

    // ── Contact ────────────────────────────────────────────────────────
    const contact: BookingContact = {
        name: booking.contact_name ?? '',
        email: booking.contact_email ?? '',
        phone: booking.contact_phone ?? '',
        notes: booking.contact_notes ?? '',
    };

    // ── Guests ─────────────────────────────────────────────────────────
    const guests = useMemo(
        () => passengersToGuests(booking.passengers),
        [booking.passengers],
    );
    const adults = booking.pax_adult;
    const children = booking.pax_child;
    const infants = booking.pax_infant;

    // ── Rooms ──────────────────────────────────────────────────────────
    const rooms = useMemo(
        () =>
            deserializeRoomsFromBooking(
                booking.rooms || [],
                guests,
                booking.passengers,
            ),
        [booking.rooms, booking.passengers, guests],
    );

    // ── Travel Documents ───────────────────────────────────────────────
    const travelDocuments = useMemo(
        () => passengersToTravelDocs(booking.passengers, guests),
        [booking.passengers, guests],
    );

    // ── Pricing ────────────────────────────────────────────────────────
    const vendor: VendorInfo = useMemo(
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
    const displayAddOns = useMemo(
        () =>
            initialAddOns.map((addon) =>
                addon.hasQty === false
                    ? { ...addon, qty: guests.length }
                    : addon,
            ),
        [initialAddOns, guests.length],
    );
    const addOnPricing = useMemo(
        () => calculateAddOnPricing(displayAddOns, minimumVatPct ?? 11),
        [displayAddOns, minimumVatPct],
    );
    const bookingGrandTotal = Number(booking.grand_total ?? 0);
    const displayGrandTotal =
        bookingGrandTotal > 0
            ? bookingGrandTotal
            : pricing.totalPrice +
              addOnPricing.addOnsTotal +
              addOnPricing.addOnsVat;

    // ── Navigation ─────────────────────────────────────────────────────
    const goToStep = (step: WizardStepId) => {
        setDirection(step > currentStep ? 1 : -1);
        setCurrentStep(step);
    };

    const goBack = () => {
        router.visit(`/companies/${company.username}/dashboard/bookings`);
    };

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={isAgent ? ['tours.bookings'] : ['tours.orders']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Tours',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Bookings',
                    }),
                    url: `/companies/${company.username}/dashboard/bookings`,
                },
                { title: booking.booking_number },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'View Detail',
                    }),
                },
            ]}
        >
            <Head
                title={intl.formatMessage(
                    { defaultMessage: 'View {bookingNumber}' },
                    { bookingNumber: booking.booking_number },
                )}
            />

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
                            {/* Notice Banner */}
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
                                <InfoIcon className="size-5 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <h2 className="text-sm font-semibold text-sky-900">
                                        <FormattedMessage defaultMessage="Read-Only View" />
                                    </h2>
                                    <p className="mt-1 text-sm text-sky-700">
                                        <FormattedMessage defaultMessage="This booking cannot be edited. It is currently in" />{' '}
                                        <strong className="capitalize">
                                            {booking.status}
                                        </strong>{' '}
                                        <FormattedMessage defaultMessage="status." />
                                    </p>
                                </div>
                            </div>

                            <div className="pb-4 pt-2">
                                {/* Mobile back */}
                                <div className="mb-3 md:hidden">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeftIcon className="size-4" />
                                        <FormattedMessage defaultMessage="Back" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="sticky top-0 z-20 mb-5 rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
                                    <WizardStepIndicator
                                        currentStep={currentStep}
                                        onStepClick={goToStep}
                                    />
                                </div>

                                {/* Booking Info Card */}
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
                                    totalPaid={paidAmount}
                                    remainingBalance={remainingBalance}
                                    displayTotalPrice={
                                        currentStep === 4
                                            ? displayGrandTotal
                                            : undefined
                                    }
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

                            {/* Steps are rendered read-only; document links remain clickable. */}
                            <div className="py-2 opacity-90">
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
                                                onContactChange={() => {}}
                                                adults={adults}
                                                children={children}
                                                infants={infants}
                                                onAdultsChange={() => {}}
                                                onChildrenChange={() => {}}
                                                onInfantsChange={() => {}}
                                                guests={guests}
                                                onGuestUpdate={() => {}}
                                                onGuestRemove={() => {}}
                                                tourPrices={tourPrices}
                                                visaCategoryItems={
                                                    visaCategoryItems
                                                }
                                                maxGuests={99}
                                                departureDate={departureDate}
                                                showAddAsGuest={false}
                                                readOnly
                                            />
                                        )}
                                        {currentStep === 2 && (
                                            <Step2RoomConfiguration
                                                guests={guests}
                                                rooms={rooms}
                                                onRoomsChange={() => {}}
                                                readOnly
                                            />
                                        )}
                                        {currentStep === 3 && (
                                            <Step3TravelDocuments
                                                guests={guests}
                                                travelDocuments={
                                                    travelDocuments
                                                }
                                                onTravelDocumentsChange={() => {}}
                                                departureDate={departureDate}
                                                readOnly
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
                                                onPayNow={() => {}}
                                                isSubmitting={false}
                                                initialAddOns={initialAddOns}
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
                                                    displayGrandTotal
                                                }
                                                readOnly
                                                hidePaymentControls
                                                showProformaInvoiceButton={
                                                    booking.status ===
                                                    'down payment'
                                                }
                                                proformaInvoiceUrl={
                                                    proformaInvoiceUrl
                                                }
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation (Pointer events re-enabled for buttons) */}
                            <div className="flex items-center pb-12 pt-4 pointer-events-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goBack}
                                    className="gap-2"
                                >
                                    <ArrowLeftIcon className="size-4" />{' '}
                                    <FormattedMessage defaultMessage="Back" />
                                </Button>
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
