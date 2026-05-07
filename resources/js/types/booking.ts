// ─── Booking Status ─────────────────────────────────────────────────────────────

export type BookingStatusCode =
  | 'waiting_payment'
  | 'down_payment'
  | 'full_payment'
  | 'reserved'
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

export interface TravelDocumentEntry {
  guestId: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  visaNumber: string;
  passportFile: File | null;
  passportFileName: string;
  visaFile: File | null;
  visaFileName: string;
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
