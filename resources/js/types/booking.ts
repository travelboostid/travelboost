// ─── Booking Status ─────────────────────────────────────────────────────────────

export type BookingStatusCode =
    | 'waiting_payment'
    | 'waiting_payment_approval'
    | 'down_payment'
    | 'full_payment'
    | 'reserved'
    | 'booking_reserved'
    | 'manual_reserved'
    | 'cancel'
    | 'refund'
    | 'expired'
    | 'waiting_list';

export type PaymentMode = 'vendor' | 'agent';

export type BedType = 'single' | 'double' | 'extra';

// ─── Data Interfaces ────────────────────────────────────────────────────────────

export interface TourPrice {
    tourPriceId: number;
    categoryName: string; // price_categories.name (e.g. "Single", "Double")
    description: string; // price_categories.description (e.g. "Single room (1 person)")
    price: number; // tour_prices.price (base price)
    promotionRate: number; // percentage discount (e.g. 10 = 10%)
    promotion: number; // fixed discount amount
    commissionRate: number; // percentage commission
    commission: number; // fixed commission amount
}

export interface RoomType {
    id: number;
    name: string;
    max_occupancy: number;
    bed_types: BedType[];
    price_supplement: number;
}

export interface GuestEntry {
    id: string; // client-side id
    bookingPassengerId?: number | null;
    type: 'adult' | 'child' | 'infant';
    title: string; // e.g. "Mr", "Mrs", "Master"
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO date string
    placeOfBirth: string;
    priceCategory: string | null; // price_categories.name value
    tourPriceId: number; // FK to tour_prices.id
    price: number; // discounted price (after promotion)
    originalPrice: number; // base price before promotion discount
    roomTypeDescription: string; // price_categories.description (auto-derived)
    note: string;
}

export interface SavedPassengerOption {
    id: number;
    title: string | null;
    firstName: string;
    lastName: string | null;
    dateOfBirth: string | null;
    travelerType: 'adult' | 'child' | 'infant' | null;
    placeOfBirth: string | null;
    passportNumber: string | null;
    passportIssueDate: string | null;
    passportExpiryDate: string | null;
    visaNumber: string | null;
    passportFilePath: string | null;
    passportFileName: string | null;
    visaFilePath: string | null;
    visaFileName: string | null;
}

export interface TravelDocumentEntry {
    guestId: string;
    passportNumber: string;
    passportIssueDate: string;
    passportExpiryDate: string;
    visaNumber: string;
    passportFile: File | null;
    passportFileName: string;
    passportFilePath: string | null;
    visaFile: File | null;
    visaFileName: string;
    visaFilePath: string | null;
}

export interface BedSlot {
    bedType: BedType;
    guestId: string | null;
    position: { x: number; y: number };
}

export interface RoomSlot {
    id: string;
    roomTypeId: number;
    roomLabel: string;
    bedLayout: BedSlot[];
}

export interface UploadedDocument {
    id?: number;
    type: 'passport' | 'visa' | 'supporting';
    file?: File;
    url?: string;
    fileName: string;
    fileSize: number;
    uploadProgress?: number;
}

export interface BookingPricing {
    subtotalGuests: number;
    discountedSubtotal: number;
    promotionDiscount: number; // total discount from promotions
    platformFee: number;
    ppn: number;
    agentCommission: number;
    totalPrice: number;
    totalPayment: number;
    paxCount: number;
}

export interface VendorInfo {
    id: number;
    name: string;
    payment_mode: PaymentMode;
    commission: number;
}

export interface BookingContact {
    name: string;
    email: string;
    phone: string;
    notes: string;
}

export interface DashboardCustomerOption {
    id: number;
    company_id: number | null;
    name: string;
    email: string;
    phone: string | null;
}

export interface BookingInputBy {
    userName: string;
    roleLabel: string;
    companyName?: string | null;
    createdAt: string | null;
}
