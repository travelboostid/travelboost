export type Adjustment = {
    type: 'percent' | 'value';
    value: string;
};

export type TourFormTab = 'tour' | 'schedule' | 'availability' | 'addons';

export type RoomPrice = {
    id?: number | null;
    schedule_id?: number | null;
    room_type_id: number | null;
    price: string;
    promotion: Adjustment;
    commission: Adjustment;
};

export type Schedule = {
    id?: number | null;
    departure_date: string;
    return_date: string;
    prices: RoomPrice[];
    availability?: Partial<
        Record<AvailabilityField, number | string | null>
    > | null;
    add_ons?: unknown;
    promotion?: Adjustment;
    commission?: Adjustment;
    manual_reserved_started_at?: string | null;
    manual_reserved_expires_at?: string | null;
    manual_reserved_pending_value?: number | null;
    manual_reserved_original_available?: number | null;
    manual_reserved_start_date?: string | null;
    manual_reserved_start_time?: string | null;
};

export type PriceCategory = {
    id: number;
    name: string;
};

export type ProductCommissionCategory = {
    id: number;
    name: string;
};

export type VisaCategory = {
    id: number;
    name: string;
    items: Array<{
        id: number;
        description: string;
        price: number | string;
        is_taxable: boolean;
    }>;
};

export type AddOn = {
    id?: number | null;
    description: string;
    price: number | '';
    edit_status: boolean;
    is_taxable: boolean;
};

export type AddOnsState = Record<number, AddOn[]>;

export type AvailabilityField =
    | 'max_pax'
    | 'WP'
    | 'WA'
    | 'WPA'
    | 'DP'
    | 'FP'
    | 'RS'
    | 'BRS'
    | 'CA'
    | 'RF'
    | 'EX'
    | 'WL'
    | 'available';

export type AvailabilityRow = Record<AvailabilityField, number> & {
    id?: number | null;
    schedule_id?: number | null;
    departure_date: string;
    return_date: string;
    manual_reserved_started_at?: string | null;
    manual_reserved_expires_at?: string | null;
    manual_reserved_pending_value?: number | null;
    manual_reserved_original_available?: number | null;
    manual_reserved_start_date?: string | null;
    manual_reserved_start_time?: string | null;
    schedule: string;
};

export type LocalDateTimeParts = {
    date: string;
    time: string;
};

export type ManualReservedSummary = {
    scheduleId: number | null;
    departureDate: string;
    startAt: string;
    expiresAt: string | null;
    originalAvailable: number;
    limitLabel: string | null;
};
